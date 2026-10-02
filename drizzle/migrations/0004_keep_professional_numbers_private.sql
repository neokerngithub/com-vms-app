CREATE OR REPLACE VIEW public.profile_directory AS SELECT id, full_name, is_verified FROM public.profiles;
GRANT SELECT ON public.profile_directory TO authenticated;
GRANT SELECT ON public.profile_directory TO service_role;
DROP POLICY IF EXISTS profiles_select ON public.profiles;
CREATE POLICY profiles_select_own_or_admin ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id OR public.has_role(auth.uid(), 'admin'::public.app_role));