import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { providers, type EmailProvider } from "@/data/mockEmails";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  provider: EmailProvider | null;
  onConnected: () => void;
}

const OAUTH_PROVIDERS: EmailProvider[] = ["gmail", "outlook"];
const IMAP_PROVIDERS: EmailProvider[] = [
  "yahoo", "icloud", "aol", "zoho", "yandex", "fastmail", "tutanota", "protonmail",
];

export const ConnectAccountDialog = ({ open, onOpenChange, provider, onConnected }: Props) => {
  const [submitting, setSubmitting] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [handle, setHandle] = useState("");
  const [imapHost, setImapHost] = useState("");
  const [smtpHost, setSmtpHost] = useState("");

  const providerInfo = providers.find((p) => p.id === provider);
  const isOAuth = provider && OAUTH_PROVIDERS.includes(provider);
  const isImap = provider && IMAP_PROVIDERS.includes(provider);
  const isAfromail = provider === "afromail";

  const reset = () => {
    setEmail(""); setPassword(""); setHandle("");
    setImapHost(""); setSmtpHost("");
  };

  const close = () => { reset(); onOpenChange(false); };

  const startOAuth = async () => {
    if (!provider) return;
    setSubmitting(true);
    const redirect_uri = `${window.location.origin}/auth/email-callback`;
    const { data, error } = await supabase.functions.invoke("email-oauth-start", {
      body: { provider, redirect_uri },
    });
    setSubmitting(false);
    if (error || (data as { error?: string })?.error) {
      const msg = (data as { message?: string; error?: string })?.message
        ?? (data as { error?: string })?.error
        ?? error?.message ?? "Could not start OAuth";
      toast.error(msg);
      return;
    }
    const url = (data as { authorize_url?: string }).authorize_url;
    if (url) window.location.href = url;
  };

  const submitImap = async () => {
    if (!provider || !email || !password) {
      toast.error("Email and password are required");
      return;
    }
    setSubmitting(true);
    const { data, error } = await supabase.functions.invoke("email-imap-connect", {
      body: {
        provider, email_address: email, password,
        imap_host: imapHost || undefined,
        smtp_host: smtpHost || undefined,
      },
    });
    setSubmitting(false);
    if (error || (data as { error?: string })?.error) {
      toast.error((data as { error?: string })?.error ?? error?.message ?? "Failed");
      return;
    }
    toast.success(`${providerInfo?.name} connected`);
    onConnected();
    close();
  };

  const submitAfromail = async () => {
    if (!/^[a-z0-9._-]{3,32}$/i.test(handle)) {
      toast.error("Handle must be 3–32 chars (letters, numbers, . _ -)");
      return;
    }
    setSubmitting(true);
    const { data, error } = await supabase.functions.invoke(
      "email-afromail-provision", { body: { handle } },
    );
    setSubmitting(false);
    if (error || (data as { error?: string })?.error) {
      toast.error((data as { error?: string })?.error ?? error?.message ?? "Failed");
      return;
    }
    toast.success(`Afromail address ${(data as { email: string }).email} active`);
    onConnected();
    close();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) close(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            Connect {providerInfo?.name ?? "account"} {providerInfo?.icon}
          </DialogTitle>
          <DialogDescription>
            {isOAuth && "You'll be redirected to sign in and grant mailbox access."}
            {isImap && "Use an app password if your provider requires one."}
            {isAfromail && "Choose a handle for your @afromail.com address."}
          </DialogDescription>
        </DialogHeader>

        {isOAuth && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Lovable will open {providerInfo?.name}'s secure sign-in.
              Tokens are stored in your backend and used to sync your inbox.
            </p>
            <Button onClick={startOAuth} disabled={submitting} className="w-full">
              {submitting ? "Opening…" : `Continue with ${providerInfo?.name}`}
            </Button>
          </div>
        )}

        {isImap && (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email address</Label>
              <Input id="email" type="email" value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password / app password</Label>
              <Input id="password" type="password" value={password}
                onChange={(e) => setPassword(e.target.value)} />
            </div>
            <details className="text-xs text-muted-foreground">
              <summary className="cursor-pointer">Advanced (custom IMAP/SMTP)</summary>
              <div className="mt-2 space-y-2">
                <Input placeholder="imap host (optional)" value={imapHost}
                  onChange={(e) => setImapHost(e.target.value)} />
                <Input placeholder="smtp host (optional)" value={smtpHost}
                  onChange={(e) => setSmtpHost(e.target.value)} />
              </div>
            </details>
            <Button onClick={submitImap} disabled={submitting} className="w-full">
              {submitting ? "Connecting…" : "Connect"}
            </Button>
          </div>
        )}

        {isAfromail && (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="handle">Choose your handle</Label>
              <div className="flex items-center gap-2">
                <Input id="handle" value={handle}
                  onChange={(e) => setHandle(e.target.value)}
                  placeholder="yourname" />
                <span className="text-sm text-muted-foreground">@afromail.com</span>
              </div>
            </div>
            <Button onClick={submitAfromail} disabled={submitting} className="w-full">
              {submitting ? "Creating…" : "Create Afromail address"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
