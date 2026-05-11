require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_KEY in server/.env');
  process.exit(1);
}

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Supabase tables should be created via the Supabase Dashboard SQL editor.
// This script verifies the expected tables exist and prints their status.
//
// To create the tables, run this SQL in your Supabase Dashboard → SQL Editor:
//
// CREATE TABLE IF NOT EXISTS buildings (
//   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
//   name TEXT NOT NULL UNIQUE,
//   address TEXT,
//   created_at TIMESTAMPTZ DEFAULT NOW()
// );
//
// CREATE TABLE IF NOT EXISTS floors (
//   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
//   building_id UUID REFERENCES buildings(id),
//   name TEXT NOT NULL,
//   floor_number INT NOT NULL,
//   map_json JSONB,
//   created_at TIMESTAMPTZ DEFAULT NOW()
// );
//
// CREATE TABLE IF NOT EXISTS nav_nodes (
//   id TEXT PRIMARY KEY,
//   floor_id UUID REFERENCES floors(id),
//   label TEXT,
//   x FLOAT NOT NULL,
//   y FLOAT NOT NULL,
//   type TEXT,
//   room_id TEXT
// );
//
// CREATE TABLE IF NOT EXISTS nav_edges (
//   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
//   floor_id UUID REFERENCES floors(id),
//   from_node TEXT REFERENCES nav_nodes(id),
//   to_node TEXT REFERENCES nav_nodes(id),
//   weight FLOAT NOT NULL
// );

async function verifyTables() {
  const tables = ['buildings', 'floors', 'nav_nodes', 'nav_edges'];
  console.log('Verifying Supabase tables...\n');

  for (const table of tables) {
    const { count, error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error(`  ✗ ${table} — ${error.message}`);
    } else {
      console.log(`  ✓ ${table} — OK (${count} rows)`);
    }
  }

  console.log('\nDone. If any table is missing, run the SQL above in your Supabase Dashboard.');
}

verifyTables();