-- ============================================================
-- ZRHO Migration 007: Delete Account Function
-- SECURITY DEFINER function to permanently delete the user
-- from auth.users, cascading to all related data
-- ============================================================

CREATE OR REPLACE FUNCTION public.delete_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  DELETE FROM auth.users WHERE id = auth.uid();
END;
$$;
