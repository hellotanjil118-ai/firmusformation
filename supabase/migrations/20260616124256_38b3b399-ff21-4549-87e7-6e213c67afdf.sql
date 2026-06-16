
CREATE TABLE public.meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  organizer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  meeting_type TEXT NOT NULL DEFAULT 'consultation', -- consultation, client, team, internal
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_min INT NOT NULL DEFAULT 30,
  meeting_url TEXT,
  location TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled', -- scheduled, completed, cancelled, no_show
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.meetings TO authenticated;
GRANT ALL ON public.meetings TO service_role;

ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage all meetings" ON public.meetings
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Clients view their meetings" ON public.meetings
  FOR SELECT TO authenticated
  USING (
    client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid())
  );

CREATE TRIGGER trg_meetings_updated_at
  BEFORE UPDATE ON public.meetings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Notify client when a meeting is scheduled or rescheduled
CREATE OR REPLACE FUNCTION public.notify_on_meeting()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_client_user UUID;
BEGIN
  IF NEW.client_id IS NULL THEN RETURN NEW; END IF;
  SELECT user_id INTO v_client_user FROM public.clients WHERE id = NEW.client_id;
  IF v_client_user IS NULL THEN RETURN NEW; END IF;

  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.notifications (user_id, title, body, link)
    VALUES (v_client_user, 'Meeting scheduled: ' || NEW.title,
            to_char(NEW.scheduled_at, 'Mon DD, YYYY HH24:MI'),
            '/portal');
  ELSIF TG_OP = 'UPDATE' AND (NEW.scheduled_at IS DISTINCT FROM OLD.scheduled_at OR NEW.status IS DISTINCT FROM OLD.status) THEN
    INSERT INTO public.notifications (user_id, title, body, link)
    VALUES (v_client_user, 'Meeting updated: ' || NEW.title,
            NEW.status || ' · ' || to_char(NEW.scheduled_at, 'Mon DD, YYYY HH24:MI'),
            '/portal');
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_notify_meeting
  AFTER INSERT OR UPDATE ON public.meetings
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_meeting();

CREATE INDEX idx_meetings_scheduled_at ON public.meetings(scheduled_at);
CREATE INDEX idx_meetings_client_id ON public.meetings(client_id);
