require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data, error } = await supabase.from('contacts').select('phone_number').limit(1);
  if (data && data.length > 0) {
    console.log("Type of phone_number:", typeof data[0].phone_number);
  }
}
check();
