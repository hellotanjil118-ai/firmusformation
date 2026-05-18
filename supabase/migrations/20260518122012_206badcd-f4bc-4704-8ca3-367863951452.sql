
-- ORDERS
CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  service_id uuid REFERENCES public.services(id) ON DELETE SET NULL,
  package_name text NOT NULL,
  price numeric(10,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  status text NOT NULL DEFAULT 'pending',
  notes text,
  started_at timestamptz,
  due_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_orders_client ON public.orders(client_id);
CREATE INDEX idx_orders_status ON public.orders(status);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage orders" ON public.orders
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Clients read own orders" ON public.orders
  FOR SELECT TO authenticated
  USING (client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid()));

CREATE TRIGGER trg_orders_updated BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ORDER STAGES
CREATE TABLE public.order_stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  order_index integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  completed_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_stages_order ON public.order_stages(order_id);

ALTER TABLE public.order_stages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage stages" ON public.order_stages
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Clients read own stages" ON public.order_stages
  FOR SELECT TO authenticated
  USING (order_id IN (
    SELECT o.id FROM public.orders o
    JOIN public.clients c ON c.id = o.client_id
    WHERE c.user_id = auth.uid()
  ));

CREATE TRIGGER trg_stages_updated BEFORE UPDATE ON public.order_stages
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ORDER DOCUMENTS
CREATE TABLE public.order_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  uploader_type text NOT NULL DEFAULT 'admin',
  name text NOT NULL,
  file_path text NOT NULL,
  file_size bigint,
  mime_type text,
  client_visible boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_docs_order ON public.order_documents(order_id);

ALTER TABLE public.order_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage docs" ON public.order_documents
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Clients read own visible docs" ON public.order_documents
  FOR SELECT TO authenticated
  USING (
    client_visible = true
    AND order_id IN (
      SELECT o.id FROM public.orders o
      JOIN public.clients c ON c.id = o.client_id
      WHERE c.user_id = auth.uid()
    )
  );

CREATE POLICY "Clients upload to own orders" ON public.order_documents
  FOR INSERT TO authenticated
  WITH CHECK (
    uploaded_by = auth.uid()
    AND order_id IN (
      SELECT o.id FROM public.orders o
      JOIN public.clients c ON c.id = o.client_id
      WHERE c.user_id = auth.uid()
    )
  );

-- ORDER MESSAGES
CREATE TABLE public.order_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  sender_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  sender_type text NOT NULL DEFAULT 'client',
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_msgs_order ON public.order_messages(order_id);

ALTER TABLE public.order_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage messages" ON public.order_messages
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Clients read own messages" ON public.order_messages
  FOR SELECT TO authenticated
  USING (order_id IN (
    SELECT o.id FROM public.orders o
    JOIN public.clients c ON c.id = o.client_id
    WHERE c.user_id = auth.uid()
  ));

CREATE POLICY "Clients send messages on own orders" ON public.order_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND sender_type = 'client'
    AND order_id IN (
      SELECT o.id FROM public.orders o
      JOIN public.clients c ON c.id = o.client_id
      WHERE c.user_id = auth.uid()
    )
  );

-- LEAD NOTES
CREATE TABLE public.lead_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  author_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_lnotes_lead ON public.lead_notes(lead_id);

ALTER TABLE public.lead_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage lead notes" ON public.lead_notes
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- STORAGE BUCKET for order documents
INSERT INTO storage.buckets (id, name, public) VALUES ('order-documents', 'order-documents', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Admins all access order docs" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'order-documents' AND has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'order-documents' AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Clients read own order docs" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'order-documents'
    AND (storage.foldername(name))[1] IN (
      SELECT o.id::text FROM public.orders o
      JOIN public.clients c ON c.id = o.client_id
      WHERE c.user_id = auth.uid()
    )
  );

CREATE POLICY "Clients upload to own order folders" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'order-documents'
    AND (storage.foldername(name))[1] IN (
      SELECT o.id::text FROM public.orders o
      JOIN public.clients c ON c.id = o.client_id
      WHERE c.user_id = auth.uid()
    )
  );
