import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";

// Triggers a sync of every connected account for the signed-in user.
// Calls email-sync-account in parallel and returns a per-account result.

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

    const { data: accounts, error } = await supabase
      .from("email_accounts")
      .select("id")
      .neq("status", "disconnected");

    if (error) return json({ error: error.message }, 500);

    const base = Deno.env.get("SUPABASE_URL")!;
    const results = await Promise.all((accounts ?? []).map(async (a) => {
      const r = await fetch(`${base}/functions/v1/email-sync-account`, {
        method: "POST",
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ account_id: a.id }),
      });
      const body = await r.json().catch(() => ({}));
      return { account_id: a.id, ok: r.ok, ...body };
    }));

    return json({ ok: true, results });
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
