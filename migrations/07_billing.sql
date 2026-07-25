-- Phase 7 Migrations: SaaS Billing & Usage Tracking

-- 1. Add Stripe fields to Workspaces
ALTER TABLE public.workspaces 
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS plan_type TEXT DEFAULT 'free',
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'inactive',
ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMP WITH TIME ZONE;

-- 2. Create Billing Usage Table (Optional, for efficient tracking)
CREATE TABLE IF NOT EXISTS public.workspace_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE UNIQUE,
    messages_sent_this_month INT DEFAULT 0,
    contacts_count INT DEFAULT 0,
    last_reset_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. RLS Policies for Usage
ALTER TABLE public.workspace_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own workspace usage" ON public.workspace_usage
    FOR SELECT USING (
        workspace_id IN (SELECT workspace_id FROM public.profiles WHERE profiles.id = auth.uid())
    );

-- 4. Function to auto-create usage record when workspace is created
CREATE OR REPLACE FUNCTION public.handle_new_workspace_usage()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.workspace_usage (workspace_id)
  VALUES (new.id);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Trigger for new workspaces
DROP TRIGGER IF EXISTS on_workspace_created_usage ON public.workspaces;
CREATE TRIGGER on_workspace_created_usage
  AFTER INSERT ON public.workspaces
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_workspace_usage();

-- Backfill usage records for existing workspaces
INSERT INTO public.workspace_usage (workspace_id)
SELECT id FROM public.workspaces
ON CONFLICT (workspace_id) DO NOTHING;
