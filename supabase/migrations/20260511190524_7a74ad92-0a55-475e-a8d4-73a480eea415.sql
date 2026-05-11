CREATE TABLE public.messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  account_id uuid NOT NULL REFERENCES public.email_accounts(id) ON DELETE CASCADE,
  provider text NOT NULL,
  provider_message_id text NOT NULL,
  thread_id text,
  folder text NOT NULL DEFAULT 'inbox',
  from_name text,
  from_email text NOT NULL,
  to_emails text[] NOT NULL DEFAULT '{}',
  cc_emails text[] NOT NULL DEFAULT '{}',
  subject text,
  preview text,
  body_text text,
  body_html text,
  has_attachment boolean NOT NULL DEFAULT false,
  read boolean NOT NULL DEFAULT false,
  starred boolean NOT NULL DEFAULT false,
  received_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (account_id, provider_message_id)
);

CREATE INDEX idx_messages_user_received ON public.messages (user_id, received_at DESC);
CREATE INDEX idx_messages_account ON public.messages (account_id, received_at DESC);
CREATE INDEX idx_messages_folder ON public.messages (user_id, folder, received_at DESC);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own messages" ON public.messages
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own messages" ON public.messages
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own messages" ON public.messages
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users delete own messages" ON public.messages
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER update_messages_updated_at
  BEFORE UPDATE ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();