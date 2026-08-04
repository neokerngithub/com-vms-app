
CREATE TYPE public.app_role AS ENUM ('admin','user');
CREATE TYPE public.area_unit AS ENUM ('Dhur','Kattha','Bigha','Ropani','Aana','Paisa','Daam','Sq. Ft.','Sq. M.');
CREATE TYPE public.road_type AS ENUM ('Pitched road','Gravelled road','Block / Paved road','RCC road','Earthen road');
CREATE TYPE public.locality_type AS ENUM ('Residential','Commercial','Commercial / Residential','Residential / Agricultural');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  email text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_roles_select" ON public.user_roles FOR SELECT TO authenticated USING (true);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email,'@',1)), NEW.email)
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user') ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TABLE public.records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_visited_by text NOT NULL DEFAULT '',
  location_in_cadastral_map text NOT NULL DEFAULT '',
  district text NOT NULL DEFAULT '',
  latitude double precision,
  longitude double precision,
  market_rate numeric NOT NULL DEFAULT 0,
  unit public.area_unit NOT NULL DEFAULT 'Dhur',
  road_width text,
  type_of_road public.road_type,
  locality public.locality_type,
  data_entry_date timestamptz NOT NULL DEFAULT now(),
  remarks text,
  image_url text,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reports_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.records TO authenticated;
GRANT ALL ON public.records TO service_role;
ALTER TABLE public.records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "records_select_all" ON public.records FOR SELECT TO authenticated USING (true);
CREATE POLICY "records_insert_own" ON public.records FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "records_update_own" ON public.records FOR UPDATE TO authenticated USING (auth.uid() = created_by) WITH CHECK (auth.uid() = created_by);
CREATE POLICY "records_delete_admin" ON public.records FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER records_updated_at BEFORE UPDATE ON public.records FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.record_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  record_id uuid NOT NULL REFERENCES public.records(id) ON DELETE CASCADE,
  reported_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (record_id, reported_by)
);
GRANT SELECT, INSERT ON public.record_reports TO authenticated;
GRANT ALL ON public.record_reports TO service_role;
ALTER TABLE public.record_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reports_select" ON public.record_reports FOR SELECT TO authenticated USING (reported_by = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "reports_insert_own" ON public.record_reports FOR INSERT TO authenticated WITH CHECK (auth.uid() = reported_by);

CREATE OR REPLACE FUNCTION public.bump_reports_count()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.records SET reports_count = reports_count + 1 WHERE id = NEW.record_id;
  RETURN NEW;
END; $$;
CREATE TRIGGER record_reports_bump AFTER INSERT ON public.record_reports FOR EACH ROW EXECUTE FUNCTION public.bump_reports_count();

CREATE TABLE public.government_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fiscal_year text NOT NULL,
  district_office text NOT NULL,
  pdf_url text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.government_rates TO authenticated;
GRANT ALL ON public.government_rates TO service_role;
ALTER TABLE public.government_rates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "gov_rates_select" ON public.government_rates FOR SELECT TO authenticated USING (true);
CREATE POLICY "gov_rates_admin_write" ON public.government_rates FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

INSERT INTO public.government_rates (fiscal_year, district_office, pdf_url) VALUES
('2082-83','Biratnagar, Morang','https://ird.gov.np/'),
('2082-83','Inaruwa, Sunsari','https://ird.gov.np/'),
('2082-83','Damak, Jhapa','https://ird.gov.np/'),
('2081-82','Biratnagar, Morang','https://ird.gov.np/'),
('2081-82','Inaruwa, Sunsari','https://ird.gov.np/'),
('2081-82','Dhankuta, Dhankuta','https://ird.gov.np/'),
('2080-81','Biratnagar, Morang','https://ird.gov.np/'),
('2080-81','Damak, Jhapa','https://ird.gov.np/');
