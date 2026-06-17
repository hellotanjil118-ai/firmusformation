
CREATE TABLE public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  code TEXT,
  description TEXT,
  color TEXT DEFAULT '#6366f1',
  icon TEXT DEFAULT 'Building2',
  head_user_id UUID,
  monthly_target NUMERIC(12,2) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.departments TO authenticated;
GRANT ALL ON public.departments TO service_role;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "departments_read_auth" ON public.departments FOR SELECT TO authenticated USING (true);
CREATE POLICY "departments_admin_write" ON public.departments FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_departments_updated BEFORE UPDATE ON public.departments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  title TEXT,
  employment_type TEXT NOT NULL DEFAULT 'full_time',
  status TEXT NOT NULL DEFAULT 'active',
  hourly_rate NUMERIC(10,2) DEFAULT 0,
  monthly_salary NUMERIC(12,2) DEFAULT 0,
  avatar_url TEXT,
  joined_at DATE DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.employees TO authenticated;
GRANT ALL ON public.employees TO service_role;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "employees_read_auth" ON public.employees FOR SELECT TO authenticated USING (true);
CREATE POLICY "employees_admin_write" ON public.employees FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_employees_updated BEFORE UPDATE ON public.employees
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_employees_department ON public.employees(department_id);

INSERT INTO public.departments (name, slug, code, description, color, icon, sort_order, monthly_target) VALUES
  ('Amazon', 'amazon', 'AMZ', 'Research, PPC, Listings, Launch & Account Management', '#ff9900', 'ShoppingCart', 1, 50000),
  ('Documentation', 'documentation', 'DOC', 'LLC, EIN, Trademark, Bank Account formation', '#0ea5e9', 'FileText', 2, 25000),
  ('Marketing', 'marketing', 'MKT', 'Campaigns, content, SEO and growth', '#ec4899', 'Megaphone', 3, 15000),
  ('Sales', 'sales', 'SAL', 'Lead generation, qualification and closing', '#10b981', 'TrendingUp', 4, 60000),
  ('Support', 'support', 'SUP', 'Client support, ticketing and success', '#8b5cf6', 'Headphones', 5, 0),
  ('Finance', 'finance', 'FIN', 'Invoicing, payroll, expenses and reporting', '#f59e0b', 'DollarSign', 6, 0),
  ('Human Resources', 'hr', 'HR', 'Hiring, payroll, employee management', '#06b6d4', 'Users', 7, 0),
  ('AI Automation', 'ai', 'AI', 'AI workflows, automations and tooling', '#6366f1', 'Sparkles', 8, 0);
