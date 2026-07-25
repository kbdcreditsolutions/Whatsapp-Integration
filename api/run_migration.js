const { Client } = require('pg');
const fs = require('fs');

async function runMigration() {
  const client = new Client({
    connectionString: "postgresql://postgres:KBDWhatsapp@411@db.nspnbthqozzjewkgoeyn.supabase.co:5432/postgres"
  });
  
  await client.connect();
  console.log("Connected to Supabase.");
  
  const sql = fs.readFileSync('migrations/07_billing.sql', 'utf8');
  await client.query(sql);
  
  console.log("Migration executed successfully.");
  await client.end();
}

runMigration().catch(err => {
  console.error("Migration failed:", err);
  process.exit(1);
});
