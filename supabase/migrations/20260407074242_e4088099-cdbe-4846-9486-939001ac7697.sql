
ALTER TABLE public.profiles
  ADD COLUMN notif_email boolean NOT NULL DEFAULT true,
  ADD COLUMN notif_desktop boolean NOT NULL DEFAULT true,
  ADD COLUMN notif_sound boolean NOT NULL DEFAULT false,
  ADD COLUMN notif_security boolean NOT NULL DEFAULT true,
  ADD COLUMN notif_marketing boolean NOT NULL DEFAULT false,
  ADD COLUMN notif_digest text NOT NULL DEFAULT 'realtime';
