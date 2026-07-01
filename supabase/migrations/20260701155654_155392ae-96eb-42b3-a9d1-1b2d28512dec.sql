
-- Restrict employees SELECT: admins see all; employees see only their own record
DROP POLICY IF EXISTS employees_read_auth ON public.employees;

CREATE POLICY employees_read_admin ON public.employees
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY employees_read_self ON public.employees
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
