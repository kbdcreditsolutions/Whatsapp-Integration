-- Phase 5 Migrations: Automation & Chatbots

CREATE TABLE IF NOT EXISTS public.automations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    trigger_type TEXT NOT NULL, -- 'keyword', 'out_of_office', 'ai_agent'
    trigger_config JSONB DEFAULT '{}'::jsonb,
    action_config JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.automations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage workspace automations"
    ON public.automations FOR ALL
    USING (workspace_id = get_user_workspace_id())
    WITH CHECK (workspace_id = get_user_workspace_id());
