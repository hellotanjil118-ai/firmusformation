-- Notifications system
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  link TEXT,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own notifications" ON public.notifications
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users update own notifications" ON public.notifications
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins manage notifications" ON public.notifications
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE INDEX idx_notifications_user ON public.notifications(user_id, created_at DESC);

-- Allow clients to create their own orders (self-service ordering)
CREATE POLICY "Clients create own orders" ON public.orders
  FOR INSERT TO authenticated
  WITH CHECK (client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid()));

-- Notify admins on new order, notify client on status change
CREATE OR REPLACE FUNCTION public.notify_on_order_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_client_user UUID;
  v_admin RECORD;
BEGIN
  SELECT user_id INTO v_client_user FROM public.clients WHERE id = NEW.client_id;

  IF TG_OP = 'INSERT' THEN
    FOR v_admin IN SELECT user_id FROM public.user_roles WHERE role = 'admin' LOOP
      INSERT INTO public.notifications (user_id, title, body, link)
      VALUES (v_admin.user_id, 'New order placed', NEW.package_name, '/admin/orders/' || NEW.id);
    END LOOP;
  ELSIF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status AND v_client_user IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, title, body, link)
    VALUES (v_client_user, 'Order status updated', NEW.package_name || ' is now ' || NEW.status, '/portal/orders/' || NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_order_change
  AFTER INSERT OR UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_order_change();

-- Notify recipient on new order message
CREATE OR REPLACE FUNCTION public.notify_on_order_message()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_client_user UUID;
  v_admin RECORD;
BEGIN
  SELECT c.user_id INTO v_client_user FROM public.orders o JOIN public.clients c ON c.id = o.client_id WHERE o.id = NEW.order_id;

  IF NEW.sender_type = 'client' THEN
    FOR v_admin IN SELECT user_id FROM public.user_roles WHERE role = 'admin' LOOP
      INSERT INTO public.notifications (user_id, title, body, link)
      VALUES (v_admin.user_id, 'New client message', left(NEW.body, 120), '/admin/orders/' || NEW.order_id);
    END LOOP;
  ELSIF v_client_user IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, title, body, link)
    VALUES (v_client_user, 'New message from your manager', left(NEW.body, 120), '/portal/orders/' || NEW.order_id);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_order_message
  AFTER INSERT ON public.order_messages
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_order_message();

ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;