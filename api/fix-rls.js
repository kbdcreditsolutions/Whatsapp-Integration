const { Client } = require('pg');
require('dotenv').config();
const connectionString = `postgresql://postgres:${encodeURIComponent(process.env.SUPABASE_DB_PASSWORD)}@db.nspnbthqozzjewkgoeyn.supabase.co:5432/postgres`;

async function run() {
  const client = new Client({ connectionString });
  await client.connect();
  try {
    await client.query('ALTER TABLE contacts DISABLE ROW LEVEL SECURITY;');
    await client.query('ALTER TABLE messages DISABLE ROW LEVEL SECURITY;');
    console.log('RLS disabled on contacts and messages tables.');
  } catch (e) {
    console.error(e);
  } finally {
    await client.end();
  }
}
run();
