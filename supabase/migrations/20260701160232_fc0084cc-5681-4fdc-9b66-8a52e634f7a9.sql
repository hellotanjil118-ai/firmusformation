
ALTER TABLE public.employee_assignment_audit
  ADD COLUMN IF NOT EXISTS from_status TEXT,
  ADD COLUMN IF NOT EXISTS to_status TEXT;

CREATE OR REPLACE FUNCTION public.log_employee_assignment_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_from_name TEXT;
  v_to_name TEXT;
  v_user UUID := auth.uid();
  v_email TEXT;
  v_action TEXT;
  v_dept_changed BOOLEAN := FALSE;
  v_status_changed BOOLEAN := FALSE;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_dept_changed := NEW.department_id IS NOT NULL;
    v_status_changed := FALSE; -- initial status; skip
  ELSIF TG_OP = 'UPDATE' THEN
    v_dept_changed := NEW.department_id IS DISTINCT FROM OLD.department_id;
    v_status_changed := NEW.status IS DISTINCT FROM OLD.status;
  END IF;

  IF NOT v_dept_changed AND NOT v_status_changed THEN
    RETURN NEW;
  END IF;

  IF v_user IS NOT NULL THEN
    SELECT email INTO v_email FROM auth.users WHERE id = v_user;
  END IF;

  IF v_dept_changed THEN
    v_action := CASE
      WHEN TG_OP = 'INSERT' THEN 'assign'
      WHEN OLD.department_id IS NULL THEN 'assign'
      WHEN NEW.department_id IS NULL THEN 'unassign'
      ELSE 'reassign'
    END;

    SELECT name INTO v_from_name FROM public.departments
      WHERE id = (CASE WHEN TG_OP = 'UPDATE' THEN OLD.department_id ELSE NULL END);
    SELECT name INTO v_to_name FROM public.departments WHERE id = NEW.department_id;

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
  END IF;

  IF v_status_changed THEN
    INSERT INTO public.employee_assignment_audit (
      employee_id, employee_name,
      from_status, to_status,
      changed_by, changed_by_email, action
    ) VALUES (
      NEW.id, NEW.full_name,
      OLD.status, NEW.status,
      v_user, v_email, 'status_change'
    );
  END IF;

  RETURN NEW;
END;
$function$;
