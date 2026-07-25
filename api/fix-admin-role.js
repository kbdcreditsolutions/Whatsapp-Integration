require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixAdminRole() {
  // Find the profile for kbdcreditsolutions@gmail.com
  // Actually, we can just find all users who have a workspace_id but no role, or update a specific one.
  // Wait, we don't have emails in the profiles table usually. We can just set the role to 'admin' for the user whose email is kbdcreditsolutions@gmail.com.
  // The easiest way is to use Supabase Admin API to get the user ID.
  
  const { data: users, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    console.error('Error listing users:', listError);
    return;
  }
  
  const user = users.users.find(u => u.email === 'kbdcreditsolutions@gmail.com');
  if (!user) {
    console.log('User not found!');
    return;
  }
  
  console.log(`Found user: ${user.id}`);
  
  // Update the profile
  const { data, error } = await supabase
    .from('profiles')
    .update({ role: 'admin' })
    .eq('id', user.id)
    .select();
    
  if (error) {
    console.error('Error updating profile:', error);
  } else {
    console.log('Successfully updated profile to admin:', data);
  }
}

fixAdminRole();
