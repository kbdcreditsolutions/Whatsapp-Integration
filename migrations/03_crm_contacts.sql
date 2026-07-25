-- Phase 3 Migrations: Advanced CRM & Contact Management

-- 1. Add new columns to contacts table
ALTER TABLE public.contacts 
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS custom_attributes JSONB DEFAULT '{}'::jsonb;

-- Since the contacts table already exists and has RLS policies, 
-- we just need to make sure the user can select and update these new columns.
-- The existing policies on contacts (if any) should naturally cover these new columns.
