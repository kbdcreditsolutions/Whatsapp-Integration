require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function testQuery() {
  // Use anon key, login as user
  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
  );

  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: 'kbdcreditsolutions@gmail.com',
    password: 'Password123!' // Wait, I don't know the password they set.
  });

}
testQuery();
