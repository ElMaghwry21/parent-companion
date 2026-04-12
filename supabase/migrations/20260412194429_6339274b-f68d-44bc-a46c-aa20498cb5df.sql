
-- Create profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('parent', 'child')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles viewable by all authenticated" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Create tasks table
CREATE TABLE public.tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  points INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('simple', 'time-based')),
  total_hours NUMERIC,
  requires_proof BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tasks viewable by all authenticated" ON public.tasks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Parents can create tasks" ON public.tasks FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'parent')
);
CREATE POLICY "Parents can delete tasks" ON public.tasks FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'parent')
);

-- Create task_submissions table
CREATE TABLE public.task_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
  child_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  hours_spent NUMERIC,
  earned_points INTEGER NOT NULL,
  proof_image_url TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.task_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Submissions viewable by all authenticated" ON public.task_submissions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Children can create submissions" ON public.task_submissions FOR INSERT TO authenticated WITH CHECK (
  auth.uid() = child_id AND
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'child')
);
CREATE POLICY "Parents can update submissions" ON public.task_submissions FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'parent')
);

-- Create redemptions table
CREATE TABLE public.redemptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  child_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reward_id TEXT NOT NULL,
  points_spent INTEGER NOT NULL,
  redeemed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Redemptions viewable by all authenticated" ON public.redemptions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Children can create redemptions" ON public.redemptions FOR INSERT TO authenticated WITH CHECK (
  auth.uid() = child_id AND
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'child')
);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup via trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'child')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Storage bucket for proof images
INSERT INTO storage.buckets (id, name, public) VALUES ('task-proofs', 'task-proofs', true);

CREATE POLICY "Anyone can view proofs" ON storage.objects FOR SELECT USING (bucket_id = 'task-proofs');
CREATE POLICY "Authenticated can upload proofs" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'task-proofs');
