-- Support tickets
CREATE TABLE public.support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL,
  order_id uuid,
  subject text NOT NULL,
  category text NOT NULL DEFAULT 'general',
  priority text NOT NULL DEFAULT 'normal',
  status text NOT NULL DEFAULT 'open',
  assigned_to uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  closed_at timestamptz
);

CREATE INDEX idx_tickets_client ON public.support_tickets(client_id);
CREATE INDEX idx_tickets_status ON public.support_tickets(status);

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage tickets" ON public.support_tickets
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Clients read own tickets" ON public.support_tickets
  FOR SELECT TO authenticated
  USING (client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid()));

CREATE POLICY "Clients create own tickets" ON public.support_tickets
  FOR INSERT TO authenticated
  WITH CHECK (client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid()));

CREATE POLICY "Clients update own open tickets" ON public.support_tickets
  FOR UPDATE TO authenticated
  USING (client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid()));

CREATE TRIGGER trg_tickets_updated_at BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Ticket messages
CREATE TABLE public.ticket_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  sender_id uuid,
  sender_type text NOT NULL DEFAULT 'client',
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_ticket_messages_ticket ON public.ticket_messages(ticket_id);

ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage ticket messages" ON public.ticket_messages
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Clients read own ticket messages" ON public.ticket_messages
  FOR SELECT TO authenticated
  USING (ticket_id IN (
    SELECT t.id FROM public.support_tickets t
    JOIN public.clients c ON c.id = t.client_id
    WHERE c.user_id = auth.uid()
  ));

CREATE POLICY "Clients send messages on own tickets" ON public.ticket_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND sender_type = 'client'
    AND ticket_id IN (
      SELECT t.id FROM public.support_tickets t
      JOIN public.clients c ON c.id = t.client_id
      WHERE c.user_id = auth.uid()
    )
  );

-- Activity logs
CREATE TABLE public.activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  client_id uuid,
  action text NOT NULL,
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_activity_user ON public.activity_logs(user_id);
CREATE INDEX idx_activity_client ON public.activity_logs(client_id);

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read all activity" ON public.activity_logs
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users read own activity" ON public.activity_logs
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users insert own activity" ON public.activity_logs
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());