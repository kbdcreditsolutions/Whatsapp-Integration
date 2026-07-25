require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const phone = '1234567890';
  const workspace_id = 'd78b8396-bc1b-4179-815d-ace4a927a7e7';
  
  console.log("Trying to insert into internal_notes...");
  const { data, error } = await supabase
      .from('internal_notes')
      .insert([{
        contact_phone: phone,
        workspace_id: workspace_id,
        author_id: 'c9ff5fe6-3983-45fb-b392-5ce1fbe5c291',
        note_text: 'Test note'
      }])
      .select()
      .single();
      
  if (error) console.log("Insert internal_notes Error:", error);
  else console.log("Insert internal_notes Success:", data);

  console.log("Trying to upsert contacts...");
  const { data: data2, error: error2 } = await supabase
      .from('contacts')
      .upsert(
        { phone_number: phone, workspace_id: workspace_id, assigned_to: null, category: 'Customer' },
        { onConflict: 'phone_number' }
      )
      .select()
      .single();
      
  if (error2) console.log("Upsert contacts Error:", error2);
  else console.log("Upsert contacts Success:", data2);
}
run();
