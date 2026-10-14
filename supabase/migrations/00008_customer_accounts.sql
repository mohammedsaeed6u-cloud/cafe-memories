-- Customer account settings. Apply after 00003; never use a phone number as proof of identity.
-- Keep the optional contact number separate from customers: visited-branch staff may
-- view customer records, but only the owner should receive their contact settings.
CREATE TABLE public.customer_accounts (
  customer_id uuid PRIMARY KEY REFERENCES public.customers(id) ON DELETE CASCADE,
  phone text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT customer_account_phone_format CHECK (phone IS NULL OR phone ~ '^[+]?[0-9]{8,15}$')
);
ALTER TABLE public.customer_accounts ENABLE ROW LEVEL SECURITY;
-- No direct client policies. A customer can edit only their own settings through
-- the RPC below; even a visited-branch merchant cannot query the private number.
REVOKE ALL ON public.customer_accounts FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.customer_accounts TO service_role;

CREATE FUNCTION public.set_customer_account(p_display_name text, p_phone text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_customer uuid; v_phone text := nullif(trim(p_phone), '');
BEGIN
  IF auth.uid() IS NULL OR auth.role() <> 'authenticated' THEN
    RAISE EXCEPTION 'Customer authentication required' USING ERRCODE = '42501';
  END IF;
  IF p_display_name IS NULL OR length(trim(p_display_name)) NOT BETWEEN 2 AND 80
     OR trim(p_display_name) ~ '[[:cntrl:]]'
     OR (v_phone IS NOT NULL AND v_phone !~ '^[+]?[0-9]{8,15}$') THEN
    RAISE EXCEPTION 'Invalid customer settings' USING ERRCODE = '22023';
  END IF;
  -- The owner is determined from the verified JWT; no customer/user ID is accepted.
  UPDATE public.customers SET display_name = trim(p_display_name), last_seen_at = now()
    WHERE auth_user_id = auth.uid() AND deleted_at IS NULL RETURNING id INTO v_customer;
  IF v_customer IS NULL THEN
    RAISE EXCEPTION 'Customer account not found' USING ERRCODE = '42501';
  END IF;
  INSERT INTO public.customer_accounts(customer_id, phone)
    VALUES (v_customer, v_phone)
    ON CONFLICT (customer_id) DO UPDATE SET phone = EXCLUDED.phone, updated_at = now();
END;
$$;
REVOKE ALL ON FUNCTION public.set_customer_account(text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_customer_account(text,text) TO authenticated;

-- Check *all* venues and statuses, not just the 30 visible photos or verified
-- visits in the currently opened branch. A false "empty" result could cause an
-- anonymous guest to replace their Auth identity and orphan their history.
CREATE FUNCTION public.customer_has_saved_data()
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_customer uuid; v_name text;
BEGIN
  IF auth.uid() IS NULL OR auth.role() <> 'authenticated' THEN
    RAISE EXCEPTION 'Customer authentication required' USING ERRCODE = '42501';
  END IF;
  SELECT id, display_name INTO v_customer, v_name FROM public.customers
    WHERE auth_user_id = auth.uid() AND deleted_at IS NULL;
  IF v_customer IS NULL THEN
    RAISE EXCEPTION 'Customer account not found' USING ERRCODE = '42501';
  END IF;
  RETURN v_name IS DISTINCT FROM 'ضيف مميز'
    OR EXISTS (SELECT 1 FROM public.customer_accounts WHERE customer_id = v_customer)
    OR EXISTS (SELECT 1 FROM public.customer_identities WHERE customer_id = v_customer)
    OR EXISTS (SELECT 1 FROM public.visits WHERE customer_id = v_customer)
    OR EXISTS (SELECT 1 FROM public.memories WHERE customer_id = v_customer)
    OR EXISTS (SELECT 1 FROM public.reward_events WHERE customer_id = v_customer);
END;
$$;
REVOKE ALL ON FUNCTION public.customer_has_saved_data() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.customer_has_saved_data() TO authenticated;
