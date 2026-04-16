 
-- Add parent_id to profiles to link children to parents
ALTER TABLE public.profiles ADD COLUMN parent_id UUID REFERENCES auth.users(id);

-- Create behavior_logs table for Life Missions (listening to instructions, etc.)
CREATE TABLE public.behavior_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_id UUID REFERENCES auth.users(id) NOT NULL,
  child_id UUID REFERENCES auth.users(id) NOT NULL,
  points INTEGER NOT NULL CHECK (points > 0),
  reason TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.behavior_logs ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view relevant behavior logs" ON public.behavior_logs 
  FOR SELECT TO authenticated 
  USING (auth.uid() = parent_id OR auth.uid() = child_id);

CREATE POLICY "Parents can insert behavior logs" ON public.behavior_logs 
  FOR INSERT TO authenticated 
  WITH CHECK (
    auth.uid() = parent_id AND 
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'parent')
  );

-- Function to check daily behavior points limit (150)
CREATE OR REPLACE FUNCTION public.check_daily_behavior_limit()
RETURNS TRIGGER AS $$
DECLARE
  current_daily_total INTEGER;
BEGIN
  SELECT COALESCE(SUM(points), 0) INTO current_daily_total
  FROM public.behavior_logs
  WHERE child_id = NEW.child_id 
    AND created_at::date = CURRENT_DATE;

  IF (current_daily_total + NEW.points) > 150 THEN
    RAISE EXCEPTION 'Daily behavior points limit (150 XP) exceeded for this child.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to enforce the limit
CREATE TRIGGER enforce_behavior_limit
BEFORE INSERT ON public.behavior_logs
FOR EACH ROW EXECUTE FUNCTION public.check_daily_behavior_limit();
