import { corsHeaders } from "../_shared/cors.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";
import nodemailer from "npm:nodemailer@6.9.14";

// Sends an email via the user's connected account.
// Routes by connection_type: oauth_gmail, oauth_outlook, imap, afromail.

type Account = {
  id: string;
  user_id: string;
  provider: string;
  email_address: string;
  display_name: string | null;
  connection_type: string;
  access_token: string | null;
  refresh_token: string | null;
  token_expires_at: string | null;
  smtp_host: string | null;
  smtp_port: number | null;
  smtp_username: string | null;
  smtp_password: string | null;
  use_ssl: boolean | null;
};

type SendBody = {
  account_id: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body_html?: string;
  body_text?: string;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: claims, error: claimsErr } = await userClient.auth.getClaims(
      authHeader.replace("Bearer ", ""),
    );
    if (claimsErr || !claims?.claims) return json({ error: "Unauthorized" }, 401);
    const userId = claims.claims.sub;

    const body = (await req.json().catch(() => null)) as SendBody | null;
    if (!body?.account_id || !Array.isArray(body.to) || body.to.length === 0 || !body.subject) {
      return json({ error: "account_id, to[], and subject are required" }, 400);
    }

    const { data: account, error: fetchErr } = await admin
      .from("email_accounts")
      .select("*")
      .eq("id", body.account_id)
      .eq("user_id", userId)
      .single<Account>();
    if (fetchErr || !account) return json({ error: "Account not found" }, 404);

    let providerMessageId: string;
    switch (account.connection_type) {
      case "oauth_gmail":
        providerMessageId = await sendGmail(account, admin, body);
        break;
      case "oauth_outlook":
        providerMessageId = await sendOutlook(account, admin, body);
        break;
      case "imap":
        providerMessageId = await sendSmtp(account, body);
        break;
      case "afromail":
        providerMessageId = await sendAfromail(account, admin, body);
        break;
      default:
        return json({ error: `Unsupported connection type: ${account.connection_type}` }, 400);
    }

    // Save to unified messages as a sent item.
    await admin.from("messages").upsert({
      user_id: userId,
      account_id: account.id,
      provider: account.provider,
      provider_message_id: providerMessageId,
      thread_id: null,
      folder: "sent",
      from_name: account.display_name,
      from_email: account.email_address,
      to_emails: body.to,
      cc_emails: body.cc ?? [],
      subject: body.subject,
      preview: (body.body_text ?? stripHtml(body.body_html ?? "")).slice(0, 200),
      body_text: body.body_text ?? null,
      body_html: body.body_html ?? null,
      has_attachment: false,
      read: true,
      starred: false,
      received_at: new Date().toISOString(),
    }, { onConflict: "account_id,provider_message_id" });

    return json({ ok: true, provider_message_id: providerMessageId });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});

// ---------- Gmail ----------
async function refreshGoogleToken(account: Account, admin: SupabaseClient): Promise<string> {
  const expiresAt = account.token_expires_at ? new Date(account.token_expires_at).getTime() : 0;
  if (account.access_token && expiresAt > Date.now() + 60_000) return account.access_token;
  if (!account.refresh_token) throw new Error("No refresh token; please reconnect Gmail.");
  const clientId = Deno.env.get("GOOGLE_OAUTH_CLIENT_ID");
  const clientSecret = Deno.env.get("GOOGLE_OAUTH_CLIENT_SECRET");
  if (!clientId || !clientSecret) throw new Error("Google OAuth not configured");

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: account.refresh_token,
      grant_type: "refresh_token",
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Google refresh failed: ${JSON.stringify(data)}`);
  await admin.from("email_accounts").update({
    access_token: data.access_token,
    token_expires_at: new Date(Date.now() + (data.expires_in ?? 3600) * 1000).toISOString(),
  }).eq("id", account.id);
  return data.access_token;
}

async function sendGmail(account: Account, admin: SupabaseClient, body: SendBody): Promise<string> {
  const token = await refreshGoogleToken(account, admin);
  const raw = buildRfc2822(account, body);
  const b64 = base64UrlEncode(raw);
  const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ raw: b64 }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Gmail send failed: ${JSON.stringify(data)}`);
  return data.id as string;
}

// ---------- Outlook ----------
async function refreshMicrosoftToken(account: Account, admin: SupabaseClient): Promise<string> {
  const expiresAt = account.token_expires_at ? new Date(account.token_expires_at).getTime() : 0;
  if (account.access_token && expiresAt > Date.now() + 60_000) return account.access_token;
  if (!account.refresh_token) throw new Error("No refresh token; please reconnect Outlook.");
  const clientId = Deno.env.get("MICROSOFT_OAUTH_CLIENT_ID");
  const clientSecret = Deno.env.get("MICROSOFT_OAUTH_CLIENT_SECRET");
  if (!clientId || !clientSecret) throw new Error("Microsoft OAuth not configured");

  const res = await fetch("https://login.microsoftonline.com/common/oauth2/v2.0/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: account.refresh_token,
      grant_type: "refresh_token",
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Microsoft refresh failed: ${JSON.stringify(data)}`);
  await admin.from("email_accounts").update({
    access_token: data.access_token,
    refresh_token: data.refresh_token ?? account.refresh_token,
    token_expires_at: new Date(Date.now() + (data.expires_in ?? 3600) * 1000).toISOString(),
  }).eq("id", account.id);
  return data.access_token;
}

async function sendOutlook(account: Account, admin: SupabaseClient, body: SendBody): Promise<string> {
  const token = await refreshMicrosoftToken(account, admin);
  const html = body.body_html ?? `<pre>${escapeHtml(body.body_text ?? "")}</pre>`;
  const message = {
    subject: body.subject,
    body: { contentType: "HTML", content: html },
    toRecipients: body.to.map(a => ({ emailAddress: { address: a } })),
    ccRecipients: (body.cc ?? []).map(a => ({ emailAddress: { address: a } })),
    bccRecipients: (body.bcc ?? []).map(a => ({ emailAddress: { address: a } })),
  };
  const res = await fetch("https://graph.microsoft.com/v1.0/me/sendMail", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ message, saveToSentItems: true }),
  });
  if (!res.ok) throw new Error(`Outlook send failed: ${await res.text()}`);
  return `outlook-${crypto.randomUUID()}`;
}

// ---------- IMAP / SMTP ----------
async function sendSmtp(account: Account, body: SendBody): Promise<string> {
  if (!account.smtp_host || !account.smtp_username || !account.smtp_password) {
    throw new Error("SMTP credentials incomplete; reconnect with SMTP details.");
  }
  const port = account.smtp_port ?? 587;
  const transporter = nodemailer.createTransport({
    host: account.smtp_host,
    port,
    secure: port === 465,
    auth: { user: account.smtp_username, pass: account.smtp_password },
  });
  const info = await transporter.sendMail({
    from: account.display_name
      ? `"${account.display_name}" <${account.email_address}>`
      : account.email_address,
    to: body.to.join(", "),
    cc: body.cc?.join(", "),
    bcc: body.bcc?.join(", "),
    subject: body.subject,
    text: body.body_text,
    html: body.body_html,
  });
  return info.messageId ?? `smtp-${crypto.randomUUID()}`;
}

// ---------- Afromail (internal only) ----------
async function sendAfromail(account: Account, admin: SupabaseClient, body: SendBody): Promise<string> {
  // Insert into afromail_messages for each recipient that has an account here.
  for (const to of body.to) {
    const { data: recipientProfile } = await admin
      .from("email_accounts")
      .select("user_id")
      .eq("email_address", to)
      .eq("connection_type", "afromail")
      .maybeSingle();

    if (recipientProfile?.user_id) {
      await admin.from("afromail_messages").insert({
        user_id: recipientProfile.user_id,
        from_name: account.display_name,
        from_email: account.email_address,
        to_email: to,
        subject: body.subject,
        body: body.body_text ?? stripHtml(body.body_html ?? ""),
        preview: (body.body_text ?? stripHtml(body.body_html ?? "")).slice(0, 200),
        folder: "inbox",
      });
    }
  }
  return `afromail-${crypto.randomUUID()}`;
}

// ---------- helpers ----------
function buildRfc2822(account: Account, body: SendBody): string {
  const from = account.display_name
    ? `"${account.display_name}" <${account.email_address}>`
    : account.email_address;
  const html = body.body_html ?? `<pre>${escapeHtml(body.body_text ?? "")}</pre>`;
  const lines = [
    `From: ${from}`,
    `To: ${body.to.join(", ")}`,
    body.cc?.length ? `Cc: ${body.cc.join(", ")}` : null,
    body.bcc?.length ? `Bcc: ${body.bcc.join(", ")}` : null,
    `Subject: ${body.subject}`,
    "MIME-Version: 1.0",
    'Content-Type: text/html; charset="UTF-8"',
    "",
    html,
  ].filter(Boolean) as string[];
  return lines.join("\r\n");
}

function base64UrlEncode(s: string): string {
  const bytes = new TextEncoder().encode(s);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function stripHtml(s: string): string {
  return s.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
