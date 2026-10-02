ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS verification_type text, ADD COLUMN IF NOT EXISTS passout_year integer;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_verification_type_valid CHECK (verification_type IS NULL OR verification_type IN ('NEC', 'DEAN')) NOT VALID;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_passout_year_valid CHECK (passout_year IS NULL OR passout_year BETWEEN 1900 AND 2200) NOT VALID;
CREATE OR REPLACE FUNCTION public.protect_profile_verification() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    IF NEW.is_verified IS DISTINCT FROM OLD.is_verified THEN
      RAISE EXCEPTION 'Only an administrator can change verification status';
    END IF;
    IF NEW.verification_status IS DISTINCT FROM OLD.verification_status AND NEW.verification_status <> 'pending' THEN
      RAISE EXCEPTION 'Only an administrator can change verification status';
    END IF;
    IF NEW.verification_status = 'pending' AND NEW.verification_status IS DISTINCT FROM OLD.verification_status AND (NEW.verification_type IS NULL OR (NEW.verification_type = 'NEC' AND NULLIF(btrim(NEW.nec_number), '') IS NULL) OR (NEW.verification_type = 'DEAN' AND NULLIF(btrim(NEW.dean_number), '') IS NULL)) THEN
      RAISE EXCEPTION 'A professional registration number is required';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER protect_profile_verification BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.protect_profile_verification();