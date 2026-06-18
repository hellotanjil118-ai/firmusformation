
CREATE OR REPLACE FUNCTION public.grant_employee_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user UUID := NEW.user_id;
BEGIN
  IF v_user IS NULL AND NEW.email IS NOT NULL THEN
    SELECT id INTO v_user FROM auth.users WHERE lower(email) = lower(NEW.email) LIMIT 1;
    IF v_user IS NOT NULL THEN
      NEW.user_id := v_user;
    END IF;
  END IF;
  IF v_user IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (v_user, 'employee'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_grant_employee_role ON public.employees;
CREATE TRIGGER trg_grant_employee_role
  BEFORE INSERT OR UPDATE OF user_id, email ON public.employees
  FOR EACH ROW EXECUTE FUNCTION public.grant_employee_role();

CREATE OR REPLACE FUNCTION public.revoke_employee_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.user_id IS NOT NULL THEN
    DELETE FROM public.user_roles
    WHERE user_id = OLD.user_id AND role = 'employee'::app_role;
  END IF;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_revoke_employee_role ON public.employees;
CREATE TRIGGER trg_revoke_employee_role
  AFTER DELETE ON public.employees
  FOR EACH ROW EXECUTE FUNCTION public.revoke_employee_role();
