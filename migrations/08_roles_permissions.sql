-- Phase 8 Migrations: Roles & Permissions

-- 1. Ensure profiles have a default role if not set
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'agent';

-- 2. Create Workspace Invitations table
CREATE TABLE IF NOT EXISTS public.workspace_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'agent',
    token TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'pending', -- pending, accepted
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. RLS Policies for Invitations
ALTER TABLE public.workspace_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view and manage their workspace invitations" ON public.workspace_invitations
    FOR ALL USING (
        workspace_id IN (
            SELECT workspace_id FROM public.profiles 
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

-- Allow public read access to verify tokens without being logged in (needed for the accept flow)
CREATE POLICY "Anyone can verify an invitation token" ON public.workspace_invitations
    FOR SELECT USING (
        status = 'pending' AND expires_at > NOW()
    );

-- 4. Enable RLS on profiles if not already enabled (should be, but just to be safe)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Note: Profile updates (like accepting an invite) are usually handled by the Service Role 
-- via the backend API because the user might not have a workspace_id yet to pass RLS,
-- but they can select their own profile.

-- Optionally add an index to token for faster lookups
CREATE INDEX IF NOT EXISTS idx_workspace_invitations_token ON public.workspace_invitations(token);
