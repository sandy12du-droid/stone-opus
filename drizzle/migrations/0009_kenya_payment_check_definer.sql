ALTER FUNCTION public.erp_payment_limit() SECURITY DEFINER;
REVOKE ALL ON FUNCTION public.erp_payment_limit() FROM PUBLIC, anon, authenticated;