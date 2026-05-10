import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";

// Generates an OAuth authorize URL for Gmail or Outlook.
// Reads provider client IDs from env. If a client ID is missing the function
// returns a 400 so the UI can show a helpful "add API key" message.

const GOOGLE_SCOPES = [
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/gmail.modify",
].join(" ");

const MS_SCOPES = [
  "offline_access",
  "openid",
  "email",
  "profile",
  "https://graph.microsoft.com/Mail.Read",
  "https://graph.microsoft.com/Mail.Send",
  "https://graph.microsoft.com/Mail.ReadWrite",
].join(" ");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "Unauthorized" }, 401);
    }

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

    const { provider, redirect_uri } = await req.json();
    if (!provider || !redirect_uri) {
      return json({ error: "provider and redirect_uri are required" }, 400);
    }

    const state = btoa(JSON.stringify({ userId, provider, nonce: crypto.randomUUID() }));

    if (provider === "gmail") {
      const clientId = Deno.env.get("GOOGLE_OAUTH_CLIENT_ID");
      if (!clientId) {
        return json({
          error: "missing_config",
          message:
            "Google OAuth is not configured yet. Add GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_CLIENT_SECRET in backend secrets.",
        }, 400);
      }
      const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
      url.searchParams.set("client_id", clientId);
      url.searchParams.set("redirect_uri", redirect_uri);
      url.searchParams.set("response_type", "code");
      url.searchParams.set("scope", GOOGLE_SCOPES);
      url.searchParams.set("access_type", "offline");
      url.searchParams.set("prompt", "consent");
      url.searchParams.set("state", state);
      return json({ authorize_url: url.toString() });
    }

    if (provider === "outlook") {
      const clientId = Deno.env.get("MICROSOFT_OAUTH_CLIENT_ID");
      if (!clientId) {
        return json({
          error: "missing_config",
          message:
            "Microsoft OAuth is not configured yet. Add MICROSOFT_OAUTH_CLIENT_ID and MICROSOFT_OAUTH_CLIENT_SECRET in backend secrets.",
        }, 400);
      }
      const url = new URL(
        "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
      );
      url.searchParams.set("client_id", clientId);
      url.searchParams.set("redirect_uri", redirect_uri);
      url.searchParams.set("response_type", "code");
      url.searchParams.set("scope", MS_SCOPES);
      url.searchParams.set("response_mode", "query");
      url.searchParams.set("state", state);
      return json({ authorize_url: url.toString() });
    }

    return json({ error: "unsupported provider" }, 400);
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
