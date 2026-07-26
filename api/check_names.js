require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data, error } = await supabase.from('messages').select('phone_number, profile_name').not('phone_number', 'is', null);
  console.log("Messages:", data);
}
check();
