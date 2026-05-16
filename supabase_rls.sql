-- Enable Row Level Security (RLS) on the tables
ALTER TABLE public.threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approved_replies ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to prevent errors if running multiple times)
DROP POLICY IF EXISTS "Users can only see their own threads" ON public.threads;
DROP POLICY IF EXISTS "Users can only insert their own threads" ON public.threads;
DROP POLICY IF EXISTS "Users can only update their own threads" ON public.threads;
DROP POLICY IF EXISTS "Users can only delete their own threads" ON public.threads;

DROP POLICY IF EXISTS "Users can only see their own replies" ON public.approved_replies;
DROP POLICY IF EXISTS "Users can only insert their own replies" ON public.approved_replies;
DROP POLICY IF EXISTS "Users can only update their own replies" ON public.approved_replies;
DROP POLICY IF EXISTS "Users can only delete their own replies" ON public.approved_replies;

-- --------------------------------------------------------
-- POLICIES FOR THREADS TABLE
-- --------------------------------------------------------

-- Select Policy: Users can only see rows where user_id matches their auth ID
CREATE POLICY "Users can only see their own threads" 
ON public.threads FOR SELECT 
USING (auth.uid() = user_id);

-- Insert Policy: Users can only insert rows where user_id matches their auth ID
CREATE POLICY "Users can only insert their own threads" 
ON public.threads FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Update Policy: Users can only update their own rows
CREATE POLICY "Users can only update their own threads" 
ON public.threads FOR UPDATE 
USING (auth.uid() = user_id);

-- Delete Policy: Users can only delete their own rows
CREATE POLICY "Users can only delete their own threads" 
ON public.threads FOR DELETE 
USING (auth.uid() = user_id);

-- --------------------------------------------------------
-- POLICIES FOR APPROVED_REPLIES TABLE
-- --------------------------------------------------------

-- Select Policy
CREATE POLICY "Users can only see their own replies" 
ON public.approved_replies FOR SELECT 
USING (auth.uid() = user_id);

-- Insert Policy
CREATE POLICY "Users can only insert their own replies" 
ON public.approved_replies FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Update Policy
CREATE POLICY "Users can only update their own replies" 
ON public.approved_replies FOR UPDATE 
USING (auth.uid() = user_id);

-- Delete Policy
CREATE POLICY "Users can only delete their own replies" 
ON public.approved_replies FOR DELETE 
USING (auth.uid() = user_id);

-- --------------------------------------------------------
-- SERVICE ROLE EXEMPTION (Optional but recommended)
-- Note: Supabase Service Role Keys automatically bypass RLS,
-- but the above policies explicitly lock down the public anon API.
-- --------------------------------------------------------
