
CREATE OR REPLACE FUNCTION public.claim_client_by_email()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_email text;
  v_client_id uuid;
BEGIN
  IF v_user_id IS NULL THEN RETURN NULL; END IF;

  SELECT id INTO v_client_id FROM public.clients WHERE user_id = v_user_id LIMIT 1;
  IF v_client_id IS NOT NULL THEN RETURN v_client_id; END IF;

  SELECT email INTO v_email FROM auth.users WHERE id = v_user_id;
  IF v_email IS NULL THEN RETURN NULL; END IF;

  UPDATE public.clients
  SET user_id = v_user_id
  WHERE lower(email) = lower(v_email)
    AND user_id IS NULL
  RETURNING id INTO v_client_id;

  RETURN v_client_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.claim_client_by_email() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_client_by_email() TO authenticated;
