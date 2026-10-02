CREATE OR REPLACE FUNCTION public.protect_profile_verification() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE credentials_changed boolean;
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    credentials_changed := NEW.verification_type IS DISTINCT FROM OLD.verification_type OR NEW.nec_number IS DISTINCT FROM OLD.nec_number OR NEW.dean_number IS DISTINCT FROM OLD.dean_number;
    IF NEW.is_verified IS DISTINCT FROM OLD.is_verified OR (NEW.verification_status IS DISTINCT FROM OLD.verification_status AND NEW.verification_status <> 'pending') THEN
      RAISE EXCEPTION 'Only an administrator can change verification status';
    END IF;
    IF NEW.verification_status = 'pending' AND (NEW.verification_type IS NULL OR (NEW.verification_type = 'NEC' AND NULLIF(btrim(NEW.nec_number), '') IS NULL) OR (NEW.verification_type = 'DEAN' AND NULLIF(btrim(NEW.dean_number), '') IS NULL)) THEN
      RAISE EXCEPTION 'A professional registration number is required';
    END IF;
    IF credentials_changed AND OLD.is_verified THEN
      NEW.is_verified := false;
      NEW.verification_status := CASE WHEN NEW.verification_type = 'NEC' AND NULLIF(btrim(NEW.nec_number), '') IS NOT NULL OR NEW.verification_type = 'DEAN' AND NULLIF(btrim(NEW.dean_number), '') IS NOT NULL THEN 'pending' ELSE 'none' END;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;