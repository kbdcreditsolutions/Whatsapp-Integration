require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function sync() {
  const { data: messages, error } = await supabase.from('messages').select('phone_number, workspace_id, profile_name').not('phone_number', 'is', null);
  if (error) {
    console.error("Error fetching messages:", error);
    return;
  }
  
  const contactsToUpsert = {};
  for (const msg of messages) {
    if (msg.phone_number && msg.workspace_id) {
      if (!contactsToUpsert[msg.phone_number]) {
        contactsToUpsert[msg.phone_number] = {
          phone_number: msg.phone_number,
          workspace_id: msg.workspace_id,
        };
      }
      if (msg.profile_name) {
        contactsToUpsert[msg.phone_number].name = msg.profile_name;
      }
    }
  }

  const payload = Object.values(contactsToUpsert);
  console.log(`Found ${payload.length} unique contacts to sync.`);
  
  if (payload.length > 0) {
    const { data, error: upsertError } = await supabase.from('contacts').upsert(payload, { onConflict: 'phone_number', ignoreDuplicates: true });
    if (upsertError) {
      console.error("Upsert error:", upsertError);
    } else {
      console.log("Successfully synced contacts.");
    }
  }
}
sync();
