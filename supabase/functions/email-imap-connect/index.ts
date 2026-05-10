import { corsHeaders } from "npm:@supabase/supabase-js@2.95.0/cors";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";

// Saves IMAP/SMTP credentials for a mailbox (Yahoo, corporate, custom domain).
// Live IMAP verification can be added later via a Deno IMAP client.

const PRESETS: Record<string, { imap: [string, number]; smtp: [string, number] }> = {
  yahoo: { imap: ["imap.mail.yahoo.com", 993], smtp: ["smtp.mail.yahoo.com", 465] },
  icloud: { imap: ["imap.mail.me.com", 993], smtp: ["smtp.mail.me.com", 587] },
  aol: { imap: ["imap.aol.com", 993], smtp: ["smtp.aol.com", 465] },
  zoho: { imap: ["imap.zoho.com", 993], smtp: ["smtp.zoho.com", 465] },
  yandex: { imap: ["imap.yandex.com", 993], smtp: ["smtp.yandex.com", 465] },
  fastmail: { imap: ["imap.fastmail.com", 993], smtp: ["smtp.fastmail.com", 465] },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: claims, error: claimsErr } = await supabase.auth.getClaims(
      authHeader.replace("Bearer ", ""),
    );
    if (claimsErr || !claims?.claims) return json({ error: "Unauthorized" }, 401);
    const userId = claims.claims.sub;

    const body = await req.json();
    const {
      provider, email_address, password,
      imap_host, imap_port, smtp_host, smtp_port,
    } = body ?? {};

    if (!provider || !email_address || !password) {
      return json({ error: "provider, email_address and password required" }, 400);
    }

    const preset = PRESETS[provider];
    const host_in = imap_host ?? preset?.imap[0];
    const port_in = imap_port ?? preset?.imap[1];
    const host_out = smtp_host ?? preset?.smtp[0];
    const port_out = smtp_port ?? preset?.smtp[1];

    if (!host_in || !host_out) {
      return json({
        error: "missing_host",
        message: "Provide imap_host and smtp_host for this provider.",
      }, 400);
    }

    const { error: upsertErr } = await supabase
      .from("email_accounts")
      .upsert({
        user_id: userId,
        provider,
        email_address,
        connection_type: "imap",
        status: "connected",
        imap_host: host_in,
        imap_port: port_in,
        imap_username: email_address,
        imap_password: password,
        smtp_host: host_out,
        smtp_port: port_out,
        smtp_username: email_address,
        smtp_password: password,
        use_ssl: true,
      }, { onConflict: "user_id,provider,email_address" });

    if (upsertErr) return json({ error: upsertErr.message }, 500);
    return json({ ok: true });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "unknown error" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
