require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data, error } = await supabase.from('contacts').select('*');
  console.log("Contacts count:", data?.length);
  console.log("Contacts:", data);
  if (error) console.error(error);
}
check();
