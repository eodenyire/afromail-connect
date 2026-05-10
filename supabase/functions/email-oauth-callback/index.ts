import { corsHeaders } from "@supabase/supabase-js/cors";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";

// Exchanges OAuth code for tokens and stores them in email_accounts.

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

    const { provider, code, redirect_uri } = await req.json();
    if (!provider || !code || !redirect_uri) {
      return json({ error: "provider, code and redirect_uri required" }, 400);
    }

    let tokenUrl: string;
    let clientId: string | undefined;
    let clientSecret: string | undefined;
    let userInfoUrl: string;

    if (provider === "gmail") {
      tokenUrl = "https://oauth2.googleapis.com/token";
      clientId = Deno.env.get("GOOGLE_OAUTH_CLIENT_ID");
      clientSecret = Deno.env.get("GOOGLE_OAUTH_CLIENT_SECRET");
      userInfoUrl = "https://www.googleapis.com/oauth2/v2/userinfo";
    } else if (provider === "outlook") {
      tokenUrl = "https://login.microsoftonline.com/common/oauth2/v2.0/token";
      clientId = Deno.env.get("MICROSOFT_OAUTH_CLIENT_ID");
      clientSecret = Deno.env.get("MICROSOFT_OAUTH_CLIENT_SECRET");
      userInfoUrl = "https://graph.microsoft.com/v1.0/me";
    } else {
      return json({ error: "unsupported provider" }, 400);
    }

    if (!clientId || !clientSecret) {
      return json({
        error: "missing_config",
        message: `${provider} OAuth credentials not configured on the server.`,
      }, 400);
    }

    const form = new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri,
      grant_type: "authorization_code",
    });

    const tokenRes = await fetch(tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form,
    });
    const tokenData = await tokenRes.json();
    if (!tokenRes.ok) {
      return json({ error: "token_exchange_failed", details: tokenData }, 400);
    }

    const access_token = tokenData.access_token;
    const refresh_token = tokenData.refresh_token ?? null;
    const expires_in = tokenData.expires_in ?? 3600;
    const scope = tokenData.scope ?? null;

    // Fetch profile email
    const profileRes = await fetch(userInfoUrl, {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    const profile = await profileRes.json();
    const email =
      profile.email ?? profile.mail ?? profile.userPrincipalName ?? "unknown@unknown";
    const displayName = profile.name ?? profile.displayName ?? null;

    const connection_type = provider === "gmail" ? "oauth_gmail" : "oauth_outlook";

    const { error: upsertErr } = await supabase
      .from("email_accounts")
      .upsert({
        user_id: userId,
        provider,
        email_address: email,
        connection_type,
        status: "connected",
        display_name: displayName,
        access_token,
        refresh_token,
        token_expires_at: new Date(Date.now() + expires_in * 1000).toISOString(),
        scope,
        last_sync_at: null,
        last_error: null,
      }, { onConflict: "user_id,provider,email_address" });

    if (upsertErr) return json({ error: upsertErr.message }, 500);

    return json({ ok: true, email });
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
