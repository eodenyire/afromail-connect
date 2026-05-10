// Shared CORS helpers used by every edge function in this project.
// Import via a relative path: `import { corsHeaders } from "../_shared/cors.ts"`.

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
} as const;

/** Returns a 204 response for preflight OPTIONS requests. */
export const preflight = () => new Response("ok", { headers: corsHeaders });

/** Builds a JSON response with CORS headers attached. */
export function jsonResponse(body: unknown, status = 200, extraHeaders: HeadersInit = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
      ...extraHeaders,
    },
  });
}
