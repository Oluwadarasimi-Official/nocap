-- NoCap schema (nc_ prefixed to coexist with other apps in this shared project)
-- All timestamps timestamptz. RLS enabled on every table.
-- Applied via run-sql to the shared Supabase project.

-- ============ TABLES ============

CREATE TABLE IF NOT EXISTS public.nc_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE,
  name text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.nc_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  category text NOT NULL,
  difficulty text NOT NULL CHECK (difficulty IN ('Beginner','Intermediate','Advanced')),
  type text NOT NULL CHECK (type IN ('code','mcq','open')),
  prompt text NOT NULL,
  starter_code text,
  options jsonb NOT NULL DEFAULT '[]'::jsonb,
  correct_option text,
  rubric jsonb NOT NULL DEFAULT '[]'::jsonb,
  time_limit_minutes integer NOT NULL DEFAULT 20,
  points integer NOT NULL DEFAULT 100,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.nc_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  public_code text UNIQUE NOT NULL,
  challenge_id uuid NOT NULL REFERENCES public.nc_challenges(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress','submitted','graded','failed')),
  code_submission text,
  mcq_answer text,
  open_answer text,
  blur_count integer NOT NULL DEFAULT 0,
  time_taken_seconds integer,
  started_at timestamptz NOT NULL DEFAULT now(),
  submitted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.nc_grades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id uuid NOT NULL UNIQUE REFERENCES public.nc_attempts(id) ON DELETE CASCADE,
  total_score numeric NOT NULL,
  max_score numeric NOT NULL,
  breakdown jsonb NOT NULL DEFAULT '[]'::jsonb,
  ai_model text,
  ai_feedback text,
  graded_at timestamptz NOT NULL DEFAULT now()
);

-- ============ INDEXES ============

CREATE INDEX IF NOT EXISTS nc_attempts_user_idx ON public.nc_attempts(user_id);
CREATE INDEX IF NOT EXISTS nc_attempts_challenge_idx ON public.nc_attempts(challenge_id);
CREATE INDEX IF NOT EXISTS nc_attempts_code_idx ON public.nc_attempts(public_code);
CREATE INDEX IF NOT EXISTS nc_grades_attempt_idx ON public.nc_grades(attempt_id);
CREATE INDEX IF NOT EXISTS nc_challenges_active_idx ON public.nc_challenges(is_active);

-- ============ RLS ============

ALTER TABLE public.nc_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nc_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nc_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nc_grades ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS nc_profiles_read ON public.nc_profiles;
CREATE POLICY nc_profiles_read ON public.nc_profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS nc_profiles_write_own ON public.nc_profiles;
CREATE POLICY nc_profiles_write_own ON public.nc_profiles FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS nc_challenges_read ON public.nc_challenges;
CREATE POLICY nc_challenges_read ON public.nc_challenges FOR SELECT USING (true);

DROP POLICY IF EXISTS nc_attempts_own ON public.nc_attempts;
CREATE POLICY nc_attempts_own ON public.nc_attempts FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS nc_grades_read ON public.nc_grades;
CREATE POLICY nc_grades_read ON public.nc_grades FOR SELECT USING (true);
