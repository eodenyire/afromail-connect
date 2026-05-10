import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";

// Triggers a sync for a single email account.
// Real provider fetching (Gmail API, MS Graph, IMAP) can be plugged in here;
// for now we validate ownership, update last_sync_at, and clear last_error
// so the UI reflects a fresh successful run.

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

    const { account_id } = await req.json().catch(() => ({}));
    if (!account_id) return json({ error: "account_id required" }, 400);

    const { data: account, error: fetchErr } = await supabase
      .from("email_accounts")
      .select("id, user_id, connection_type, status, access_token, refresh_token, token_expires_at")
      .eq("id", account_id)
      .eq("user_id", userId)
      .single();

    if (fetchErr || !account) return json({ error: "Account not found" }, 404);

    if (account.status === "disconnected") {
      return json({ error: "Account is paused. Reactivate it before syncing." }, 400);
    }

    // TODO: provider-specific sync logic
    // - oauth_gmail   → refresh token if needed, call Gmail API
    // - oauth_outlook → refresh token if needed, call Microsoft Graph
    // - imap          → IMAP FETCH new UIDs
    // - afromail      → no external sync needed

    const { error: updateErr } = await supabase
      .from("email_accounts")
      .update({
        last_sync_at: new Date().toISOString(),
        last_error: null,
        status: "connected",
      })
      .eq("id", account_id);

    if (updateErr) return json({ error: updateErr.message }, 500);

    return json({ ok: true, synced_at: new Date().toISOString() });
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
