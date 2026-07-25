-- Fix Infinite Recursion in RLS

-- 1. Drop the recursive policies
DROP POLICY IF EXISTS "Users can view their own workspace" ON public.workspaces;
DROP POLICY IF EXISTS "Users can view profiles in their workspace" ON public.profiles;

-- 2. Create a SECURITY DEFINER function to bypass RLS when checking a user's workspace
CREATE OR REPLACE FUNCTION public.get_user_workspace_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT workspace_id FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;

-- 3. Recreate the policies using the function
CREATE POLICY "Users can view their own workspace" ON public.workspaces
    FOR SELECT USING (
        id = public.get_user_workspace_id()
    );

CREATE POLICY "Users can view profiles in their workspace" ON public.profiles
    FOR SELECT USING (
        id = auth.uid() OR workspace_id = public.get_user_workspace_id()
    );
