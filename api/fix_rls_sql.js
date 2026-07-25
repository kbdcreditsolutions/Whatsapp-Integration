require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function checkRLS() {
  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  console.log('Testing infinite recursion via REST API...');

  // 1. Get the user's ID
  const { data: { users }, error: uErr } = await supabase.auth.admin.listUsers();
  if (!users || users.length === 0) return console.log('No users found');
  const userId = users[0].id;
  
  // 2. Fetch profiles using ANON key, but simulating the user
  // (Wait, we need a JWT for that. Let's just create a custom JWT or use a direct query)
  // Actually, Supabase has an RPC endpoint if we want, but it's easier to just recreate the RLS policy!
  
  const sql = `
  DROP POLICY IF EXISTS "Users can view their own workspace" ON public.workspaces;
  DROP POLICY IF EXISTS "Users can view profiles in their workspace" ON public.profiles;

  CREATE POLICY "Users can view their own workspace" ON public.workspaces
      FOR SELECT USING (
          id = (SELECT workspace_id FROM public.profiles WHERE profiles.id = auth.uid() LIMIT 1)
      );

  CREATE POLICY "Users can view profiles in their workspace" ON public.profiles
      FOR SELECT USING (
          id = auth.uid() OR 
          workspace_id = (SELECT workspace_id FROM public.profiles p WHERE p.id = auth.uid() LIMIT 1)
      );
  `;
  
  console.log('Done.');
}
checkRLS();
