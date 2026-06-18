
-- Audit log for employee department/team assignment changes
CREATE TABLE public.employee_assignment_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  employee_name TEXT,
  from_department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  to_department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  from_department_name TEXT,
  to_department_name TEXT,
  changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  changed_by_email TEXT,
  action TEXT NOT NULL DEFAULT 'reassign',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_eaa_employee ON public.employee_assignment_audit(employee_id);
CREATE INDEX idx_eaa_created ON public.employee_assignment_audit(created_at DESC);

GRANT SELECT, INSERT ON public.employee_assignment_audit TO authenticated;
GRANT ALL ON public.employee_assignment_audit TO service_role;

ALTER TABLE public.employee_assignment_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read audit"
  ON public.employee_assignment_audit FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "System insert audit"
  ON public.employee_assignment_audit FOR INSERT TO authenticated
  WITH CHECK (true);

-- Trigger function: log assignment changes
CREATE OR REPLACE FUNCTION public.log_employee_assignment_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_from_name TEXT;
  v_to_name TEXT;
  v_user UUID := auth.uid();
  v_email TEXT;
  v_action TEXT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.department_id IS NULL THEN RETURN NEW; END IF;
    v_action := 'assign';
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.department_id IS NOT DISTINCT FROM OLD.department_id THEN RETURN NEW; END IF;
    v_action := CASE
      WHEN OLD.department_id IS NULL THEN 'assign'
      WHEN NEW.department_id IS NULL THEN 'unassign'
      ELSE 'reassign'
    END;
  ELSE
    RETURN NEW;
  END IF;

  SELECT name INTO v_from_name FROM public.departments
    WHERE id = (CASE WHEN TG_OP = 'UPDATE' THEN OLD.department_id ELSE NULL END);
  SELECT name INTO v_to_name FROM public.departments WHERE id = NEW.department_id;
  IF v_user IS NOT NULL THEN
    SELECT email INTO v_email FROM auth.users WHERE id = v_user;
  END IF;

  INSERT INTO public.employee_assignment_audit (
    employee_id, employee_name,
    from_department_id, to_department_id,
    from_department_name, to_department_name,
    changed_by, changed_by_email, action
  ) VALUES (
    NEW.id, NEW.full_name,
    CASE WHEN TG_OP = 'UPDATE' THEN OLD.department_id ELSE NULL END,
    NEW.department_id,
    v_from_name, v_to_name,
    v_user, v_email, v_action
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_employee_assignment ON public.employees;
CREATE TRIGGER trg_log_employee_assignment
  AFTER INSERT OR UPDATE OF department_id ON public.employees
  FOR EACH ROW EXECUTE FUNCTION public.log_employee_assignment_change();
