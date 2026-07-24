require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function assignUsers() {
  console.log('Fetching users and workspaces...');
  
  const { data: workspaces } = await supabase.from('workspaces').select('id').limit(1);
  if (!workspaces || workspaces.length === 0) return console.log('No workspaces found');
  const defaultWorkspaceId = workspaces[0].id;

  // Supabase admin API to list users
  const { data: { users }, error } = await supabase.auth.admin.listUsers();
  if (error) return console.error('Error fetching users:', error);

  console.log(`Found ${users.length} users. Assigning to workspace ${defaultWorkspaceId}...`);

  for (const user of users) {
    const { error: upsertError } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        workspace_id: defaultWorkspaceId,
        full_name: user.user_metadata?.full_name || user.email
      });
      
    if (upsertError) {
      console.error(`Failed to assign user ${user.email}:`, upsertError);
    } else {
      console.log(`Successfully assigned ${user.email}`);
    }
  }
}

assignUsers();
