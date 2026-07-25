-- Phase 2 Migrations: Team Collaboration

-- 1. Add assigned_to to contacts
ALTER TABLE public.contacts 
ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 2. Create internal_notes table
CREATE TABLE IF NOT EXISTS public.internal_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_phone TEXT REFERENCES public.contacts(phone_number) ON DELETE CASCADE,
    author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
    note_text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Enable RLS on internal_notes
ALTER TABLE public.internal_notes ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policy for internal_notes
CREATE POLICY "Users can view internal notes in their workspace" ON public.internal_notes
    FOR SELECT USING (
        workspace_id = public.get_user_workspace_id()
    );

CREATE POLICY "Users can insert internal notes in their workspace" ON public.internal_notes
    FOR INSERT WITH CHECK (
        workspace_id = public.get_user_workspace_id()
    );
