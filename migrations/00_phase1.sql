-- Phase 1 Migrations: Multi-Tenant Architecture

-- 1. Create Workspaces Table
CREATE TABLE IF NOT EXISTS public.workspaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    name TEXT NOT NULL,
    meta_phone_number_id TEXT,
    meta_access_token TEXT
);

-- 2. Create Profiles Table (Ties Auth Users to Workspaces)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'agent',
    full_name TEXT
);

-- 3. Add workspace_id to existing tables
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE;

-- 4. Enable RLS
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 5. Policies
CREATE POLICY "Users can view their own workspace" ON public.workspaces
    FOR SELECT USING (
        id IN (SELECT workspace_id FROM public.profiles WHERE profiles.id = auth.uid())
    );

CREATE POLICY "Users can view profiles in their workspace" ON public.profiles
    FOR SELECT USING (
        workspace_id IN (SELECT workspace_id FROM public.profiles WHERE profiles.id = auth.uid())
    );
