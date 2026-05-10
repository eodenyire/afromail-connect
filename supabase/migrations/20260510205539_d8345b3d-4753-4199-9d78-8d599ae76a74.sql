
-- Connection type enum
CREATE TYPE public.email_connection_type AS ENUM ('oauth_gmail', 'oauth_outlook', 'imap', 'afromail');
CREATE TYPE public.email_account_status AS ENUM ('pending', 'connected', 'error', 'disconnected');

CREATE TABLE public.email_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  provider TEXT NOT NULL,
  email_address TEXT NOT NULL,
  connection_type public.email_connection_type NOT NULL,
  status public.email_account_status NOT NULL DEFAULT 'pending',
  display_name TEXT,
  -- OAuth fields
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  scope TEXT,
  -- IMAP/SMTP fields
  imap_host TEXT,
  imap_port INTEGER,
  imap_username TEXT,
  imap_password TEXT, -- stored server-side only; consider encryption at rest
  smtp_host TEXT,
  smtp_port INTEGER,
  smtp_username TEXT,
  smtp_password TEXT,
  use_ssl BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMPTZ,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, provider, email_address)
);

ALTER TABLE public.email_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own email accounts"
  ON public.email_accounts FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own email accounts"
  ON public.email_accounts FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own email accounts"
  ON public.email_accounts FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete own email accounts"
  ON public.email_accounts FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER update_email_accounts_updated_at
  BEFORE UPDATE ON public.email_accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_email_accounts_user ON public.email_accounts(user_id);

-- Native Afromail inbox
CREATE TABLE public.afromail_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  from_name TEXT,
  from_email TEXT NOT NULL,
  to_email TEXT NOT NULL,
  subject TEXT,
  body TEXT,
  preview TEXT,
  folder TEXT NOT NULL DEFAULT 'inbox',
  read BOOLEAN NOT NULL DEFAULT false,
  starred BOOLEAN NOT NULL DEFAULT false,
  has_attachment BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.afromail_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own afromail messages"
  ON public.afromail_messages FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own afromail messages"
  ON public.afromail_messages FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own afromail messages"
  ON public.afromail_messages FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete own afromail messages"
  ON public.afromail_messages FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER update_afromail_messages_updated_at
  BEFORE UPDATE ON public.afromail_messages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_afromail_messages_user ON public.afromail_messages(user_id);
