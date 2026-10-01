ALTER TABLE public.records ADD COLUMN IF NOT EXISTS is_deleted boolean NOT NULL DEFAULT false;
ALTER TABLE public.records ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.records ADD COLUMN IF NOT EXISTS deleted_by uuid;

DROP POLICY IF EXISTS records_select_all ON public.records;
CREATE POLICY records_select_visible ON public.records FOR SELECT TO authenticated
  USING (NOT is_deleted OR public.has_role(auth.uid(), 'admin'::public.app_role));

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS dean_number text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS verification_status text NOT NULL DEFAULT 'none';
UPDATE public.profiles SET verification_status = CASE WHEN is_verified THEN 'verified' WHEN nec_number IS NOT NULL THEN 'pending' ELSE 'none' END;

CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  action_type text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  details text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY audit_logs_select_admin ON public.audit_logs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE INDEX audit_logs_created_idx ON public.audit_logs (created_at DESC);

CREATE OR REPLACE FUNCTION public.log_record_audit()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_logs(user_id, action_type, entity_type, entity_id, details)
    VALUES (auth.uid(), 'record_created', 'record', NEW.id, NEW.location_in_cadastral_map);
    IF NEW.image_url IS NOT NULL THEN
      INSERT INTO audit_logs(user_id, action_type, entity_type, entity_id, details)
      VALUES (auth.uid(), 'file_upload', 'record', NEW.id, 'Property photo');
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.is_deleted AND NOT OLD.is_deleted THEN
      INSERT INTO audit_logs(user_id, action_type, entity_type, entity_id, details)
      VALUES (auth.uid(), 'record_deleted', 'record', NEW.id, 'Moved to recycle bin');
    ELSIF OLD.is_deleted AND NOT NEW.is_deleted THEN
      INSERT INTO audit_logs(user_id, action_type, entity_type, entity_id, details)
      VALUES (auth.uid(), 'record_restored', 'record', NEW.id, NULL);
    ELSE
      INSERT INTO audit_logs(user_id, action_type, entity_type, entity_id, details)
      VALUES (auth.uid(), 'record_edited', 'record', NEW.id, NEW.location_in_cadastral_map);
      IF NEW.image_url IS DISTINCT FROM OLD.image_url AND NEW.image_url IS NOT NULL THEN
        INSERT INTO audit_logs(user_id, action_type, entity_type, entity_id, details)
        VALUES (auth.uid(), 'file_upload', 'record', NEW.id, 'Property photo');
      END IF;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO audit_logs(user_id, action_type, entity_type, entity_id, details)
    VALUES (auth.uid(), 'record_purged', 'record', OLD.id, 'Permanently deleted');
    RETURN OLD;
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER records_audit AFTER INSERT OR UPDATE OR DELETE ON public.records
  FOR EACH ROW EXECUTE FUNCTION public.log_record_audit();

CREATE OR REPLACE FUNCTION public.log_rate_audit()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO audit_logs(user_id, action_type, entity_type, entity_id, details)
  VALUES (auth.uid(), 'rate_contribution', 'government_rate', NEW.id, NEW.district_office || ' · FY ' || NEW.fiscal_year);
  IF NEW.pdf_url NOT LIKE 'http%' THEN
    INSERT INTO audit_logs(user_id, action_type, entity_type, entity_id, details)
    VALUES (auth.uid(), 'file_upload', 'government_rate', NEW.id, 'Rate PDF');
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER government_rates_audit AFTER INSERT ON public.government_rates
  FOR EACH ROW EXECUTE FUNCTION public.log_rate_audit();

REVOKE EXECUTE ON FUNCTION public.log_record_audit() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_rate_audit() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE _super boolean; _nec text; _dean text;
BEGIN
  _super := public.is_super_admin_email(NEW.email);
  _nec := NULLIF(NEW.raw_user_meta_data->>'nec_number','');
  _dean := NULLIF(NEW.raw_user_meta_data->>'dean_number','');
  INSERT INTO public.profiles (id, full_name, email, nec_number, dean_number, is_verified, verification_status)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email,'@',1)),
    NEW.email, _nec, _dean, _super,
    CASE WHEN _super THEN 'verified' WHEN _nec IS NOT NULL OR _dean IS NOT NULL THEN 'pending' ELSE 'none' END
  )
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, CASE WHEN _super THEN 'admin'::public.app_role ELSE 'user'::public.app_role END)
  ON CONFLICT DO NOTHING;
  IF _super THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin') ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END; $function$;