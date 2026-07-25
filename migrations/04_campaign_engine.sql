-- Phase 4 Migrations: Broadcasts & Campaign Engine

-- 1. Create templates table
CREATE TABLE IF NOT EXISTS public.templates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    language TEXT NOT NULL,
    category TEXT NOT NULL,
    components JSONB DEFAULT '[]'::jsonb,
    status TEXT DEFAULT 'PENDING',
    meta_template_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(workspace_id, name, language)
);

-- 2. Create campaigns table
CREATE TABLE IF NOT EXISTS public.campaigns (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    template_id UUID REFERENCES public.templates(id) ON DELETE CASCADE,
    audience_tags TEXT[] DEFAULT '{}',
    status TEXT DEFAULT 'DRAFT', -- DRAFT, SENDING, COMPLETED
    analytics JSONB DEFAULT '{"sent": 0, "delivered": 0, "read": 0, "failed": 0}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create campaign_logs table
CREATE TABLE IF NOT EXISTS public.campaign_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE,
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
    contact_phone TEXT NOT NULL,
    status TEXT DEFAULT 'pending', -- pending, sent, delivered, read, failed
    message_id TEXT,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Set up Row Level Security
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage workspace templates"
    ON public.templates FOR ALL
    USING (workspace_id = get_user_workspace_id())
    WITH CHECK (workspace_id = get_user_workspace_id());

CREATE POLICY "Users can manage workspace campaigns"
    ON public.campaigns FOR ALL
    USING (workspace_id = get_user_workspace_id())
    WITH CHECK (workspace_id = get_user_workspace_id());

CREATE POLICY "Users can manage workspace campaign logs"
    ON public.campaign_logs FOR ALL
    USING (workspace_id = get_user_workspace_id())
    WITH CHECK (workspace_id = get_user_workspace_id());
