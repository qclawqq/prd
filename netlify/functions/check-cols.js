const { Pool } = require('pg')

const DATABASE_URL = 'postgresql://neondb_owner:npg_mwRWqp8COBk2@ep-lucky-fire-a1fp6l8q-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'

async function check() {
  const pool = new Pool({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 15000 })
  
  const cols = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name='admins' ORDER BY ordinal_position")
  console.log('admins columns:', cols.rows)
  
  const pwHash = await pool.query("SELECT password FROM admins LIMIT 1")
  console.log('password col exists, sample:', pwHash.rows[0])
  
  await pool.end()
}

check().catch(e => console.error(e.message))
