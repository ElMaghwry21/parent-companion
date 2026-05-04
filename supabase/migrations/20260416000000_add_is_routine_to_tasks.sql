
-- Add is_routine to tasks table
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS is_routine BOOLEAN NOT NULL DEFAULT false;

-- Update RLS for submissions to be more specific if needed
-- (Existing policies are already quite broad for SELECT)
