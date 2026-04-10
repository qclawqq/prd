const { Pool } = require('pg')
const fs = require('fs')

const DATABASE_URL = 'postgresql://neondb_owner:npg_mwRWqp8COBk2@ep-lucky-fire-a1fp6l8q-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'

async function init() {
  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000,
  })

  try {
    await pool.query('SELECT 1')
    console.log('DB connected')
  } catch(e) {
    console.error('Connect error:', e.message)
    process.exit(1)
  }

  const sql = fs.readFileSync('C:/Users/Administrator/.qclaw/workspace/agent-fa90ed19/donation-platform/schema.sql', 'utf8')
  const statements = sql.split(/;\s*\n/)

  for (const stmt of statements) {
    const trimmed = stmt.trim()
    if (!trimmed) continue
    try {
      await pool.query(trimmed)
    } catch(e) {
      if (e.code === '42P07' || e.code === '23505' || e.code === '42710') {
        console.log('SKIP:', trimmed.slice(0, 50))
      } else {
        console.error('ERR:', trimmed.slice(0, 80), '->', e.message.slice(0, 80))
      }
    }
  }

  const tables = await pool.query("SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename")
  console.log('Tables:', tables.rows.map(r => r.tablename).join(', '))

  await pool.end()
  console.log('Done!')
}

init().catch(e => { console.error(e.message); process.exit(1) })
