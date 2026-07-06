
-- Helper: is the current user part of the team (admin or an employee)?
CREATE OR REPLACE FUNCTION public.is_team_member(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'admin')
      OR EXISTS (SELECT 1 FROM public.employees WHERE user_id = _user_id AND status = 'active');
$$;

CREATE OR REPLACE FUNCTION public.employee_department(_user_id uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT department_id FROM public.employees WHERE user_id = _user_id LIMIT 1;
$$;

-- Channels
CREATE TABLE public.community_channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  kind text NOT NULL DEFAULT 'company' CHECK (kind IN ('company','department')),
  department_id uuid REFERENCES public.departments(id) ON DELETE CASCADE,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.community_channels TO authenticated;
GRANT ALL ON public.community_channels TO service_role;
ALTER TABLE public.community_channels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members can view accessible channels" ON public.community_channels
  FOR SELECT TO authenticated USING (
    public.is_team_member(auth.uid()) AND (
      kind = 'company'
      OR public.has_role(auth.uid(), 'admin')
      OR department_id = public.employee_department(auth.uid())
    )
  );

CREATE POLICY "Admins manage channels" ON public.community_channels
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER community_channels_updated
  BEFORE UPDATE ON public.community_channels
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Messages
CREATE TABLE public.community_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid NOT NULL REFERENCES public.community_channels(id) ON DELETE CASCADE,
  sender_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  sender_name text,
  sender_avatar text,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX community_messages_channel_created_idx
  ON public.community_messages (channel_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.community_messages TO authenticated;
GRANT ALL ON public.community_messages TO service_role;
ALTER TABLE public.community_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View messages in accessible channels" ON public.community_messages
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.community_channels c
      WHERE c.id = channel_id AND public.is_team_member(auth.uid()) AND (
        c.kind = 'company'
        OR public.has_role(auth.uid(), 'admin')
        OR c.department_id = public.employee_department(auth.uid())
      )
    )
  );

CREATE POLICY "Send messages in accessible channels" ON public.community_messages
  FOR INSERT TO authenticated WITH CHECK (
    sender_id = auth.uid() AND EXISTS (
      SELECT 1 FROM public.community_channels c
      WHERE c.id = channel_id AND public.is_team_member(auth.uid()) AND (
        c.kind = 'company'
        OR public.has_role(auth.uid(), 'admin')
        OR c.department_id = public.employee_department(auth.uid())
      )
    )
  );

CREATE POLICY "Delete own or admin messages" ON public.community_messages
  FOR DELETE TO authenticated USING (
    sender_id = auth.uid() OR public.has_role(auth.uid(), 'admin')
  );

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.community_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.community_channels;

-- Seed General channel
INSERT INTO public.community_channels (name, slug, description, kind)
VALUES ('General', 'general', 'Company-wide chat for everyone', 'company')
ON CONFLICT (slug) DO NOTHING;

-- Seed one channel per existing department
INSERT INTO public.community_channels (name, slug, description, kind, department_id)
SELECT d.name, 'dept-' || d.id::text, 'Department channel for ' || d.name, 'department', d.id
FROM public.departments d
ON CONFLICT (slug) DO NOTHING;

-- Trigger: create channel per new department
CREATE OR REPLACE FUNCTION public.create_department_channel()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.community_channels (name, slug, description, kind, department_id)
  VALUES (NEW.name, 'dept-' || NEW.id::text, 'Department channel for ' || NEW.name, 'department', NEW.id)
  ON CONFLICT (slug) DO NOTHING;
  RETURN NEW;
END $$;

CREATE TRIGGER on_department_create_channel
  AFTER INSERT ON public.departments
  FOR EACH ROW EXECUTE FUNCTION public.create_department_channel();
