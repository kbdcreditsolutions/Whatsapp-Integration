require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const workspace_id = 'd78b8396-bc1b-4179-815d-ace4a927a7e7';
  const { data, error } = await supabase
      .from('contacts')
      .select('*, assigned_to_profile:profiles(full_name)')
      .eq('workspace_id', workspace_id)
      .order('created_at', { ascending: false });
  console.log("Error:", error);
  console.log("Data:", data);
}
check();
