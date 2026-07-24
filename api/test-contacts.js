const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY); // Using ANON key like the frontend
async function run() {
  const { data, error } = await supabase.from('contacts').upsert({ phone_number: "917619671728", category: "Lead" }, { onConflict: 'phone_number' });
  if (error) {
    console.error("Error with anon key:", error);
  } else {
    console.log("Success with anon key!");
  }
}
run();
