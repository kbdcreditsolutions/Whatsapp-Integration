require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("Fetching table info...");
  // Let's just try to select from internal_notes
  const { error: err1 } = await supabase.from('internal_notes').select('id').limit(1);
  console.log("internal_notes exist error:", err1 ? err1.message : "None (Table exists)");

  const { error: err2 } = await supabase.from('contacts').select('assigned_to, category').limit(1);
  console.log("contacts columns error:", err2 ? err2.message : "None (Columns exist)");
}
run();
