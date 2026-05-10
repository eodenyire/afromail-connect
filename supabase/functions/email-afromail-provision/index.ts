import { corsHeaders } from "@supabase/supabase-js/cors";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";

// Provisions a native Afromail address for the signed-in user.

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

    const { handle } = await req.json().catch(() => ({}));
    if (!handle || !/^[a-z0-9._-]{3,32}$/i.test(handle)) {
      return json({ error: "Provide a valid handle (3-32 chars, letters/numbers/._-)" }, 400);
    }
    const email_address = `${handle.toLowerCase()}@afromail.com`;

    const { error: upsertErr } = await supabase
      .from("email_accounts")
      .upsert({
        user_id: userId,
        provider: "afromail",
        email_address,
        connection_type: "afromail",
        status: "connected",
      }, { onConflict: "user_id,provider,email_address" });

    if (upsertErr) return json({ error: upsertErr.message }, 500);

    // Seed a welcome message for new Afromail users
    await supabase.from("afromail_messages").insert({
      user_id: userId,
      from_name: "Afromail Team",
      from_email: "welcome@afromail.com",
      to_email: email_address,
      subject: "Welcome to Afromail",
      preview: "Your unified inbox is ready.",
      body:
        `Hi there,\n\nYour Afromail address ${email_address} is active. ` +
        `Connect Gmail, Outlook, Yahoo and any IMAP mailbox from Settings to bring everything together.\n\n— Afromail`,
      folder: "inbox",
      read: false,
      starred: true,
    });

    return json({ ok: true, email: email_address });
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
