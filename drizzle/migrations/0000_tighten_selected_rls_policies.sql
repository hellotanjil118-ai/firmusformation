DROP POLICY IF EXISTS "System insert audit" ON public.employee_assignment_audit;
REVOKE INSERT ON public.employee_assignment_audit FROM authenticated;

DROP POLICY IF EXISTS "Anyone can submit leads" ON public.leads;
CREATE POLICY "Public contact intake only" ON public.leads
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    status = 'new'
    AND notes IS NULL
    AND assigned_to IS NULL
    AND COALESCE(value, 0) = 0
    AND length(btrim(name)) BETWEEN 1 AND 100
    AND length(btrim(email)) BETWEEN 3 AND 255
    AND email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
    AND length(btrim(message)) BETWEEN 1 AND 2000
    AND (phone IS NULL OR length(phone) <= 50)
    AND (service IS NULL OR length(service) <= 100)
    AND (company IS NULL OR length(company) <= 100)
    AND (country IS NULL OR length(country) <= 100)
    AND source IS NULL
  );
CREATE POLICY "Admins create leads" ON public.leads
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Company settings readable by all" ON public.company_settings;
REVOKE SELECT ON public.company_settings FROM anon;
CREATE VIEW public.public_brand_settings WITH (security_barrier = true) AS
  SELECT logo_url, brand_primary
  FROM public.company_settings
  WHERE singleton IS TRUE;
GRANT SELECT ON public.public_brand_settings TO anon, authenticated;

DROP POLICY IF EXISTS "departments_read_auth" ON public.departments;
CREATE POLICY "departments_read_team" ON public.departments
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR (
      public.has_role(auth.uid(), 'employee')
      AND public.employee_department(auth.uid()) = id
    )
  );