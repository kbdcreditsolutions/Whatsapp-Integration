require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function linkExistingData() {
  console.log('Checking for existing data with no workspace...');

  // 1. Check if a default workspace already exists
  let { data: workspaces, error: wsError } = await supabase
    .from('workspaces')
    .select('*')
    .limit(1);

  if (wsError) {
    console.error('Error fetching workspaces:', wsError);
    return;
  }

  let defaultWorkspaceId;

  if (workspaces.length === 0) {
    console.log('No workspaces found. Creating a default workspace for existing data...');
    // Create a default workspace, assuming the env vars hold the current Meta keys
    const { data: newWorkspace, error: insertError } = await supabase
      .from('workspaces')
      .insert({
        name: 'Default Workspace',
        meta_phone_number_id: process.env.META_PHONE_NUMBER_ID || '',
        meta_access_token: process.env.META_ACCESS_TOKEN || ''
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating default workspace:', insertError);
      return;
    }
    defaultWorkspaceId = newWorkspace.id;
    console.log('Created Default Workspace:', defaultWorkspaceId);
  } else {
    defaultWorkspaceId = workspaces[0].id;
    console.log('Found existing workspace:', defaultWorkspaceId);
  }

  // 2. Update contacts
  console.log('Updating contacts without workspace_id...');
  const { error: contactsError } = await supabase
    .from('contacts')
    .update({ workspace_id: defaultWorkspaceId })
    .is('workspace_id', null);

  if (contactsError) {
    console.error('Error updating contacts:', contactsError);
  } else {
    console.log('Contacts updated successfully.');
  }

  // 3. Update messages
  console.log('Updating messages without workspace_id...');
  const { error: msgsError } = await supabase
    .from('messages')
    .update({ workspace_id: defaultWorkspaceId })
    .is('workspace_id', null);

  if (msgsError) {
    console.error('Error updating messages:', msgsError);
  } else {
    console.log('Messages updated successfully.');
  }

  console.log('Done linking existing data!');
}

linkExistingData();
