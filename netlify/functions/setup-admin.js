const { Pool } = require('pg')
const bcrypt = require('bcryptjs')

const DATABASE_URL = 'postgresql://neondb_owner:npg_mwRWqp8COBk2@ep-lucky-fire-a1fp6l8q-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'

async function setup() {
  const pool = new Pool({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 15000 })

  const hash = await bcrypt.hash('admin123', 10)
  console.log('Generated hash:', hash)

  // Update existing admin or insert
  const r = await pool.query("UPDATE admins SET password=$1 WHERE username='admin' RETURNING *", [hash])
  if (r.rowCount === 0) {
    await pool.query("INSERT INTO admins (username, password) VALUES ('admin', $1)", [hash])
    console.log('Inserted new admin')
  } else {
    console.log('Updated admin password')
  }

  // Test it
  const valid = await bcrypt.compare('admin123', hash)
  console.log('Password test:', valid ? 'PASS' : 'FAIL')

  await pool.end()
  console.log('Done!')
}

setup().catch(e => { console.error(e.message); process.exit(1) })
