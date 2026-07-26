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
      if (msg.profile_name && msg.profile_name !== 'null') {
        contactsToUpsert[msg.phone_number].name = msg.profile_name;
      }
    }
  }

  // Update existing contacts directly
  for (const contact of Object.values(contactsToUpsert)) {
    if (contact.name) {
      const { error: updateError } = await supabase.from('contacts').update({ name: contact.name }).eq('phone_number', contact.phone_number);
      if (updateError) {
        console.error("Update error for", contact.phone_number, updateError);
      } else {
        console.log("Successfully updated contact", contact.phone_number, "with name", contact.name);
      }
    }
  }
  console.log("Sync complete");
}
sync();
