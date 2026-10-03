ALTER TABLE public.government_rates ADD COLUMN approval_status text NOT NULL DEFAULT 'published';
ALTER TABLE public.government_rates ADD CONSTRAINT government_rates_approval_status_check CHECK (approval_status IN ('pending_approval', 'published', 'declined'));

CREATE OR REPLACE FUNCTION public.guard_government_rate_approval()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF auth.uid() IS NOT NULL THEN
      IF NEW.created_by IS DISTINCT FROM auth.uid() THEN
        RAISE EXCEPTION 'Cannot publish on behalf of another user';
      END IF;
      NEW.approval_status := CASE WHEN public.has_role(auth.uid(), 'admin'::public.app_role) THEN 'published' ELSE 'pending_approval' END;
    END IF;
  ELSIF auth.uid() IS NOT NULL THEN
    IF NEW.created_by IS DISTINCT FROM OLD.created_by THEN
      RAISE EXCEPTION 'Cannot transfer publication ownership';
    END IF;
    IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
      RAISE EXCEPTION 'Only administrators can edit rate contributions';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER guard_government_rate_approval BEFORE INSERT OR UPDATE ON public.government_rates FOR EACH ROW EXECUTE FUNCTION public.guard_government_rate_approval();

DROP POLICY IF EXISTS gov_rates_select ON public.government_rates;
DROP POLICY IF EXISTS gov_rates_update_own_or_admin ON public.government_rates;
CREATE POLICY gov_rates_select_visible ON public.government_rates FOR SELECT TO authenticated USING (approval_status = 'published' OR created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY gov_rates_update_admin ON public.government_rates FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE OR REPLACE FUNCTION public.log_rate_review()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.approval_status IS DISTINCT FROM OLD.approval_status THEN
    INSERT INTO public.audit_logs(user_id, action_type, entity_type, entity_id, details)
    VALUES (auth.uid(), 'rate_' || NEW.approval_status, 'government_rate', NEW.id, NEW.district_office || ' · FY ' || NEW.fiscal_year);
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER government_rates_review_audit AFTER UPDATE ON public.government_rates FOR EACH ROW EXECUTE FUNCTION public.log_rate_review();