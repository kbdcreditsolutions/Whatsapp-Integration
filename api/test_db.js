const { Client } = require('pg');

const regions = [
  'ap-south-1',
  'us-east-1',
  'us-west-1',
  'eu-west-1',
  'eu-central-1',
  'ap-southeast-1',
  'ap-southeast-2'
];

async function testConnection() {
  for (const region of regions) {
    const connectionString = `postgres://postgres.nspnbthqozzjewkgoeyn:KBDWhatsapp%40411@aws-0-${region}.pooler.supabase.com:6543/postgres`;
    const client = new Client({ connectionString, connectionTimeoutMillis: 5000 });
    try {
      console.log(`Trying ${region}...`);
      await client.connect();
      console.log(`SUCCESS connected to ${region}!`);
      await client.end();
      return region;
    } catch (e) {
      console.log(`Failed ${region}: ${e.message}`);
    }
  }
  console.log('All failed');
}

testConnection();
