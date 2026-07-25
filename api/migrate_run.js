const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

module.exports = async (req, res) => {
  const client = new Client({
    connectionString: 'postgresql://postgres:KBDWhatsapp@411@db.nspnbthqozzjewkgoeyn.supabase.co:5432/postgres'
  });

  try {
    await client.connect();
    const sqlPath = path.join(__dirname, '../migrations/07_billing.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    await client.query(sql);
    await client.end();
    res.status(200).send('Migration successful');
  } catch (error) {
    res.status(500).send('Migration failed: ' + error.message);
  }
};
