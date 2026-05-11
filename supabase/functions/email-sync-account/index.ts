import { corsHeaders } from "../_shared/cors.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";
import { ImapFlow } from "npm:imapflow@1.0.171";
import { simpleParser } from "npm:mailparser@3.7.1";

// Syncs one email account into the unified `messages` table.
// Supports: oauth_gmail, oauth_outlook, imap, afromail.

type Account = {
  id: string;
  user_id: string;
  provider: string;
  email_address: string;
  connection_type: string;
  status: string;
  access_token: string | null;
  refresh_token: string | null;
  token_expires_at: string | null;
  imap_host: string | null;
  imap_port: number | null;
  imap_username: string | null;
  imap_password: string | null;
  use_ssl: boolean | null;
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

    const { account_id } = await req.json().catch(() => ({}));
    if (!account_id) return json({ error: "account_id required" }, 400);

    const { data: account, error: fetchErr } = await admin
      .from("email_accounts")
      .select("*")
      .eq("id", account_id)
      .eq("user_id", userId)
      .single<Account>();

    if (fetchErr || !account) return json({ error: "Account not found" }, 404);

    let synced = 0;
    try {
      switch (account.connection_type) {
        case "oauth_gmail":
          synced = await syncGmail(account, admin);
          break;
        case "oauth_outlook":
          synced = await syncOutlook(account, admin);
          break;
        case "imap":
          synced = await syncImap(account, admin);
          break;
        case "afromail":
          synced = await syncAfromail(account, admin);
          break;
        default:
          throw new Error(`Unknown connection type: ${account.connection_type}`);
      }

      await admin.from("email_accounts").update({
        last_sync_at: new Date().toISOString(),
        last_error: null,
        status: "connected",
      }).eq("id", account.id);

      return json({ ok: true, synced });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await admin.from("email_accounts").update({
        last_error: message,
        status: "error",
      }).eq("id", account.id);
      return json({ error: message }, 500);
    }
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "unknown error" }, 500);
  }
});

// ----------------- Gmail -----------------
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

async function syncGmail(account: Account, admin: SupabaseClient): Promise<number> {
  const token = await refreshGoogleToken(account, admin);
  const listRes = await fetch(
    "https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=25&q=in:inbox",
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!listRes.ok) throw new Error(`Gmail list failed: ${await listRes.text()}`);
  const list = await listRes.json();
  const ids: { id: string }[] = list.messages ?? [];

  let count = 0;
  for (const { id } of ids) {
    const msgRes = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=full`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    if (!msgRes.ok) continue;
    const m = await msgRes.json();
    const headers: Record<string, string> = {};
    for (const h of m.payload?.headers ?? []) headers[h.name.toLowerCase()] = h.value;

    const { name, email } = parseFrom(headers["from"] ?? "");
    const subject = headers["subject"] ?? "(no subject)";
    const dateStr = headers["date"];
    const received_at = dateStr ? new Date(dateStr).toISOString() : new Date().toISOString();
    const { text, html } = extractGmailBody(m.payload);
    const labels: string[] = m.labelIds ?? [];

    await admin.from("messages").upsert({
      user_id: account.user_id,
      account_id: account.id,
      provider: "gmail",
      provider_message_id: id,
      thread_id: m.threadId ?? null,
      folder: labels.includes("INBOX") ? "inbox" : "all",
      from_name: name,
      from_email: email,
      to_emails: splitEmails(headers["to"]),
      cc_emails: splitEmails(headers["cc"]),
      subject,
      preview: m.snippet ?? "",
      body_text: text,
      body_html: html,
      has_attachment: hasAttachments(m.payload),
      read: !labels.includes("UNREAD"),
      starred: labels.includes("STARRED"),
      received_at,
    }, { onConflict: "account_id,provider_message_id" });
    count++;
  }
  return count;
}

function extractGmailBody(payload: Record<string, unknown> | undefined): { text: string; html: string } {
  let text = "", html = "";
  function walk(part: Record<string, unknown> | undefined) {
    if (!part) return;
    const mimeType = part.mimeType as string | undefined;
    const body = part.body as { data?: string } | undefined;
    if (mimeType === "text/plain" && body?.data) text += decodeB64Url(body.data);
    else if (mimeType === "text/html" && body?.data) html += decodeB64Url(body.data);
    for (const p of (part.parts as Record<string, unknown>[] | undefined) ?? []) walk(p);
  }
  walk(payload);
  return { text, html };
}

function hasAttachments(payload: Record<string, unknown> | undefined): boolean {
  if (!payload) return false;
  const parts = (payload.parts as Record<string, unknown>[] | undefined) ?? [];
  for (const p of parts) {
    if (p.filename && (p.filename as string).length > 0) return true;
    if (hasAttachments(p)) return true;
  }
  return false;
}

function decodeB64Url(s: string): string {
  try {
    const b64 = s.replace(/-/g, "+").replace(/_/g, "/");
    return new TextDecoder().decode(Uint8Array.from(atob(b64), c => c.charCodeAt(0)));
  } catch { return ""; }
}

// ----------------- Outlook -----------------
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

async function syncOutlook(account: Account, admin: SupabaseClient): Promise<number> {
  const token = await refreshMicrosoftToken(account, admin);
  const res = await fetch(
    "https://graph.microsoft.com/v1.0/me/mailFolders/inbox/messages?$top=25&$orderby=receivedDateTime desc",
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!res.ok) throw new Error(`Outlook list failed: ${await res.text()}`);
  const data = await res.json();
  const items: Array<Record<string, unknown>> = data.value ?? [];

  let count = 0;
  for (const m of items) {
    const from = m.from as { emailAddress?: { name?: string; address?: string } } | undefined;
    const body = m.body as { content?: string; contentType?: string } | undefined;
    const toRecipients = (m.toRecipients as Array<{ emailAddress: { address: string } }>) ?? [];
    const ccRecipients = (m.ccRecipients as Array<{ emailAddress: { address: string } }>) ?? [];

    await admin.from("messages").upsert({
      user_id: account.user_id,
      account_id: account.id,
      provider: "outlook",
      provider_message_id: m.id as string,
      thread_id: (m.conversationId as string) ?? null,
      folder: "inbox",
      from_name: from?.emailAddress?.name ?? null,
      from_email: from?.emailAddress?.address ?? "unknown",
      to_emails: toRecipients.map(r => r.emailAddress.address),
      cc_emails: ccRecipients.map(r => r.emailAddress.address),
      subject: (m.subject as string) ?? "(no subject)",
      preview: (m.bodyPreview as string) ?? "",
      body_text: body?.contentType === "text" ? body.content ?? null : null,
      body_html: body?.contentType === "html" ? body.content ?? null : null,
      has_attachment: (m.hasAttachments as boolean) ?? false,
      read: (m.isRead as boolean) ?? false,
      starred: (m.flag as { flagStatus?: string })?.flagStatus === "flagged",
      received_at: (m.receivedDateTime as string) ?? new Date().toISOString(),
    }, { onConflict: "account_id,provider_message_id" });
    count++;
  }
  return count;
}

// ----------------- IMAP -----------------
async function syncImap(account: Account, admin: SupabaseClient): Promise<number> {
  if (!account.imap_host || !account.imap_username || !account.imap_password) {
    throw new Error("IMAP credentials incomplete");
  }
  const client = new ImapFlow({
    host: account.imap_host,
    port: account.imap_port ?? 993,
    secure: account.use_ssl ?? true,
    auth: { user: account.imap_username, pass: account.imap_password },
    logger: false,
  });

  await client.connect();
  let count = 0;
  try {
    const lock = await client.getMailboxLock("INBOX");
    try {
      const status = await client.status("INBOX", { messages: true });
      const total = status.messages ?? 0;
      if (total === 0) return 0;
      const start = Math.max(1, total - 24);
      const range = `${start}:${total}`;

      for await (const msg of client.fetch(range, { envelope: true, source: true, flags: true })) {
        const parsed = await simpleParser(msg.source as Uint8Array);
        const fromAddr = parsed.from?.value?.[0];
        await admin.from("messages").upsert({
          user_id: account.user_id,
          account_id: account.id,
          provider: account.provider,
          provider_message_id: parsed.messageId ?? `imap-${account.id}-${msg.uid}`,
          thread_id: null,
          folder: "inbox",
          from_name: fromAddr?.name ?? null,
          from_email: fromAddr?.address ?? "unknown",
          to_emails: (parsed.to?.value ?? []).map(a => a.address ?? "").filter(Boolean),
          cc_emails: (parsed.cc?.value ?? []).map(a => a.address ?? "").filter(Boolean),
          subject: parsed.subject ?? "(no subject)",
          preview: (parsed.text ?? "").slice(0, 200),
          body_text: parsed.text ?? null,
          body_html: typeof parsed.html === "string" ? parsed.html : null,
          has_attachment: (parsed.attachments?.length ?? 0) > 0,
          read: !!msg.flags?.has("\\Seen"),
          starred: !!msg.flags?.has("\\Flagged"),
          received_at: (parsed.date ?? new Date()).toISOString(),
        }, { onConflict: "account_id,provider_message_id" });
        count++;
      }
    } finally {
      lock.release();
    }
  } finally {
    await client.logout().catch(() => {});
  }
  return count;
}

// ----------------- Afromail -----------------
async function syncAfromail(account: Account, admin: SupabaseClient): Promise<number> {
  const { data: msgs } = await admin
    .from("afromail_messages")
    .select("*")
    .eq("user_id", account.user_id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (!msgs || msgs.length === 0) return 0;
  for (const m of msgs) {
    await admin.from("messages").upsert({
      user_id: account.user_id,
      account_id: account.id,
      provider: "afromail",
      provider_message_id: m.id,
      thread_id: null,
      folder: m.folder ?? "inbox",
      from_name: m.from_name,
      from_email: m.from_email,
      to_emails: [m.to_email],
      cc_emails: [],
      subject: m.subject,
      preview: m.preview,
      body_text: m.body,
      body_html: null,
      has_attachment: m.has_attachment ?? false,
      read: m.read ?? false,
      starred: m.starred ?? false,
      received_at: m.created_at,
    }, { onConflict: "account_id,provider_message_id" });
  }
  return msgs.length;
}

// ----------------- helpers -----------------
function parseFrom(header: string): { name: string | null; email: string } {
  const m = header.match(/^\s*"?([^"<]*?)"?\s*<([^>]+)>\s*$/);
  if (m) return { name: m[1].trim() || null, email: m[2].trim() };
  return { name: null, email: header.trim() || "unknown" };
}
function splitEmails(header: string | undefined): string[] {
  if (!header) return [];
  return header.split(",").map(s => {
    const m = s.match(/<([^>]+)>/);
    return (m ? m[1] : s).trim();
  }).filter(Boolean);
}
function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
