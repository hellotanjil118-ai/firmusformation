
CREATE TABLE IF NOT EXISTS public.company_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  singleton BOOLEAN NOT NULL DEFAULT TRUE UNIQUE,
  company_name TEXT NOT NULL DEFAULT 'Firmus Formation',
  legal_name TEXT,
  tagline TEXT,
  contact_email TEXT,
  support_email TEXT,
  contact_phone TEXT,
  whatsapp_number TEXT,
  website_url TEXT,
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  country TEXT,
  tax_id TEXT,
  currency TEXT NOT NULL DEFAULT 'USD',
  timezone TEXT NOT NULL DEFAULT 'UTC',
  logo_url TEXT,
  brand_primary TEXT,
  invoice_prefix TEXT DEFAULT 'INV',
  invoice_footer TEXT,
  invoice_terms TEXT,
  notify_new_leads BOOLEAN NOT NULL DEFAULT TRUE,
  notify_new_orders BOOLEAN NOT NULL DEFAULT TRUE,
  notify_new_tickets BOOLEAN NOT NULL DEFAULT TRUE,
  notify_invoice_paid BOOLEAN NOT NULL DEFAULT TRUE,
  insights_cadence TEXT NOT NULL DEFAULT 'weekly',
  social_links JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.company_settings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.company_settings TO authenticated;
GRANT ALL ON public.company_settings TO service_role;

ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company settings readable by all"
  ON public.company_settings FOR SELECT
  USING (true);

CREATE POLICY "Admins manage company settings"
  ON public.company_settings FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER company_settings_updated_at
  BEFORE UPDATE ON public.company_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.company_settings (singleton, company_name, contact_email, currency, timezone)
VALUES (TRUE, 'Firmus Formation', 'hello@firmusformation.com', 'USD', 'UTC')
ON CONFLICT (singleton) DO NOTHING;

-- Allow admins to view all profiles for user management
DROP POLICY IF EXISTS "Admins view all profiles" ON public.profiles;
CREATE POLICY "Admins view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Admins manage user_roles
DROP POLICY IF EXISTS "Admins manage roles" ON public.user_roles;
CREATE POLICY "Admins manage roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
