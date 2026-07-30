CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY,
  full_name TEXT NOT NULL DEFAULT '',
  farm_name TEXT,
  state TEXT,
  district TEXT,
  village TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  farm_size NUMERIC,
  area_unit TEXT NOT NULL DEFAULT 'ha',
  onboarded BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile" ON public.profiles FOR ALL TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE TABLE public.field_blocks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  area_ha NUMERIC NOT NULL DEFAULT 1,
  soil_type TEXT NOT NULL DEFAULT 'Loam',
  crop TEXT,
  sowing_date DATE,
  soil_n NUMERIC NOT NULL DEFAULT 160,
  soil_p NUMERIC NOT NULL DEFAULT 28,
  soil_k NUMERIC NOT NULL DEFAULT 260,
  soil_ph NUMERIC NOT NULL DEFAULT 6.8,
  organic_carbon NUMERIC NOT NULL DEFAULT 0.55,
  moisture NUMERIC NOT NULL DEFAULT 50,
  health INTEGER NOT NULL DEFAULT 75,
  disease_risk INTEGER NOT NULL DEFAULT 20,
  last_scan_date DATE,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.field_blocks TO authenticated;
GRANT ALL ON public.field_blocks TO service_role;
ALTER TABLE public.field_blocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own blocks" ON public.field_blocks FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  block_id UUID REFERENCES public.field_blocks(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  detail TEXT,
  kind TEXT NOT NULL DEFAULT 'other',
  due_date DATE,
  done BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tasks TO authenticated;
GRANT ALL ON public.tasks TO service_role;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own tasks" ON public.tasks FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.action_completions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  action_id TEXT NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, action_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.action_completions TO authenticated;
GRANT ALL ON public.action_completions TO service_role;
ALTER TABLE public.action_completions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own completions" ON public.action_completions FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;
CREATE TRIGGER profiles_touch BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();