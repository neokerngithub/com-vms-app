ALTER TABLE public.government_rates ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS government_rates_fy_office_uniq
  ON public.government_rates (lower(fiscal_year), lower(district_office));

DROP POLICY IF EXISTS gov_rates_admin_write ON public.government_rates;

CREATE POLICY gov_rates_insert_authenticated ON public.government_rates
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY gov_rates_update_own_or_admin ON public.government_rates
  FOR UPDATE TO authenticated
  USING (auth.uid() = created_by OR has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (auth.uid() = created_by OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY gov_rates_delete_admin ON public.government_rates
  FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));