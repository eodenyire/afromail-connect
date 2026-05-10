import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// OAuth redirect target for Gmail/Outlook flows.
// Reads ?code&state, posts to the email-oauth-callback edge function,
// then returns the user to Settings.
const EmailCallback = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("Finishing connection…");

  useEffect(() => {
    const run = async () => {
      const code = params.get("code");
      const state = params.get("state");
      const error = params.get("error");
      if (error) {
        toast.error(`Connection cancelled: ${error}`);
        navigate("/settings");
        return;
      }
      if (!code || !state) {
        toast.error("Missing code/state");
        navigate("/settings");
        return;
      }
      let provider = "gmail";
      try {
        const parsed = JSON.parse(atob(state));
        provider = parsed.provider ?? "gmail";
      } catch (_) { /* ignore */ }

      const redirect_uri = `${window.location.origin}/auth/email-callback`;
      const { data, error: fnErr } = await supabase.functions.invoke(
        "email-oauth-callback",
        { body: { provider, code, redirect_uri } },
      );
      if (fnErr || (data as { error?: string })?.error) {
        const msg = (data as { message?: string; error?: string })?.message
          ?? (data as { error?: string })?.error
          ?? fnErr?.message
          ?? "Connection failed";
        toast.error(msg);
        setStatus("Connection failed");
        setTimeout(() => navigate("/settings"), 1500);
        return;
      }
      toast.success(`${provider} connected!`);
      navigate("/settings");
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3 text-muted-foreground">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm">{status}</p>
      </div>
    </div>
  );
};

export default EmailCallback;
