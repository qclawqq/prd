'use strict'

require('express-async-errors')
const express = require('express')
const cors = require('cors')
const { Pool } = require('pg')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
require('dotenv').config()

const app = express()
const PORT = process.env.PORT || 3001
const JWT_SECRET = process.env.JWT_SECRET || 'donation-platform-secret-key-change-in-production'
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_mwRWqp8COBk2@ep-lucky-fire-a1fp6l8q-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 15000,
})

// ── Middleware ──────────────────────────────────────────────
app.use(cors())
app.use(express.json())

// Auth middleware
function requireAuth(req, res, next) {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: '未授权' })
  }
  try {
    const token = header.slice(7)
    req.admin = jwt.verify(token, JWT_SECRET)
    next()
  } catch {
    return res.status(401).json({ error: 'Token 无效' })
  }
}

// ── DB Helpers ──────────────────────────────────────────────
async function query(text, params) {
  const r = await pool.query(text, params)
  return r
}

async function calcGoalValue(project) {
  const goodsValue = Number(project.goods_target_qty || 0) * Number(project.goods_price || 0)
  const moneyValue = Number(project.money_target || 0)
  return goodsValue + moneyValue
}

async function calcCurrentValue(progress, project) {
  const goodsValue = Number(progress?.current_goods_qty || 0) * Number(project.goods_price || 0)
  const moneyValue = Number(progress?.current_money || 0)
  return goodsValue + moneyValue
}

// ── Certificate Code Generator ──────────────────────────────
function genCertCode() {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let suffix = ''
  for (let i = 0; i < 6; i++) suffix += chars[Math.floor(Math.random() * chars.length)]
  return `CERT-${date}-${suffix}`
}

// ── Project helpers ─────────────────────────────────────────
async function ensureProgress(projectId) {
  await query(`INSERT INTO project_progress (project_id) VALUES ($1) ON CONFLICT DO NOTHING`, [projectId])
}

async function checkAutoEnd(projectId) {
  const p = await query(`SELECT * FROM projects WHERE id=$1`, [projectId])
  if (!p.rows[0]) return
  const prog = await query(`SELECT * FROM project_progress WHERE project_id=$1`, [projectId])
  const progress = prog.rows[0] || {}
  const currentValue = await calcCurrentValue(progress, p.rows[0])
  const goalValue = await calcGoalValue(p.rows[0])
  if (currentValue >= goalValue && p.rows[0].status === 'ongoing') {
    await query(`UPDATE projects SET status='ended', updated_at=NOW() WHERE id=$1`, [projectId])
  }
}

// ═══════════════════════════════════════════════════════════════
//  AUTH
// ═══════════════════════════════════════════════════════════════
app.post('/api/admin/login', async (req, res) => {
  const { username, password } = req.body
  if (!username || !password) return res.status(400).json({ error: '用户名和密码必填' })

  const r = await query(`SELECT * FROM admins WHERE username=$1`, [username])
  const admin = r.rows[0]
  if (!admin) return res.status(401).json({ error: '用户名或密码错误' })

  const valid = await bcrypt.compare(password, admin.password)
  if (!valid) return res.status(401).json({ error: '用户名或密码错误' })

  const token = jwt.sign({ id: admin.id, username: admin.username }, JWT_SECRET, { expiresIn: '7d' })
  res.json({ token, username: admin.username })
})

// ═══════════════════════════════════════════════════════════════
//  PUBLIC – Projects
// ═══════════════════════════════════════════════════════════════
app.get('/api/projects', async (req, res) => {
  const r = await query(`
    SELECT p.*,
      COALESCE(pg.current_goods_qty,0) as current_goods_qty,
      COALESCE(pg.current_money,0) as current_money,
      COALESCE(pg.current_volunteer,0) as current_volunteer
    FROM projects p
    LEFT JOIN project_progress pg ON p.id=pg.project_id
    WHERE p.status='ongoing'
    ORDER BY p.created_at DESC
  `)
  res.json(r.rows)
})

app.get('/api/projects/:id', async (req, res) => {
  const { id } = req.params
  const r = await query(`
    SELECT p.*,
      COALESCE(pg.current_goods_qty,0) as current_goods_qty,
      COALESCE(pg.current_money,0) as current_money,
      COALESCE(pg.current_volunteer,0) as current_volunteer
    FROM projects p
    LEFT JOIN project_progress pg ON p.id=pg.project_id
    WHERE p.id=$1
  `, [id])
  if (!r.rows[0]) return res.status(404).json({ error: '项目不存在' })
  res.json(r.rows[0])
})

// ═══════════════════════════════════════════════════════════════
//  PUBLIC – Donations (submit)
// ═══════════════════════════════════════════════════════════════
app.post('/api/donations', async (req, res) => {
  const { projectId, donorName, donorContact, type, amount, goodsQty, goodsName, volunteerSkill, message, isAnonymous } = req.body
  if (!projectId) return res.status(400).json({ error: '缺少项目ID' })
  if (!type) return res.status(400).json({ error: '缺少捐赠类型' })

  const proj = await query(`SELECT * FROM projects WHERE id=$1`, [projectId])
  if (!proj.rows[0]) return res.status(404).json({ error: '项目不存在' })
  if (proj.rows[0].status !== 'ongoing') return res.status(400).json({ error: '项目当前不开放捐赠' })

  const name = isAnonymous ? '匿名' : (donorName || '热心人士')

  const dr = await query(
    `INSERT INTO donations (project_id, donor_name, donor_contact, type, amount, goods_name, goods_qty, volunteer_skill, message, is_anonymous, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'pending') RETURNING *`,
    [projectId, name, donorContact, type, amount || null, goodsName || proj.rows[0].goods_name, goodsQty || null, volunteerSkill || null, message || null, isAnonymous || false]
  )
  const donation = dr.rows[0]

  await ensureProgress(projectId)
  if (type === 'goods' && proj.rows[0].project_type !== 'money_only') {
    await query(`UPDATE project_progress SET current_goods_qty=current_goods_qty+($1) WHERE project_id=$2`, [goodsQty || 0, projectId])
  } else if (type === 'money' && proj.rows[0].project_type !== 'goods_only') {
    await query(`UPDATE project_progress SET current_money=current_money+($1) WHERE project_id=$2`, [amount || 0, projectId])
  } else if (type === 'volunteer') {
    await query(`UPDATE project_progress SET current_volunteer=current_volunteer+1 WHERE project_id=$1`, [projectId])
  }

  await checkAutoEnd(projectId)

  res.json({ success: true, donationId: donation.id })
})

// ═══════════════════════════════════════════════════════════════
//  PUBLIC – Achievements
// ═══════════════════════════════════════════════════════════════
app.get('/api/achievements', async (req, res) => {
  const { project_id, limit } = req.query
  const params = []
  let sql = `SELECT a.*, p.title as project_title FROM achievements a LEFT JOIN projects p ON a.project_id=p.id`
  if (project_id) { params.push(project_id); sql += ` WHERE a.project_id=$${params.length}` }
  sql += ` ORDER BY a.write_date DESC`
  if (limit) { params.push(Number(limit)); sql += ` LIMIT $${params.length}` }
  const r = await query(sql, params)
  res.json(r.rows)
})

// ═══════════════════════════════════════════════════════════════
//  PUBLIC – Love Stories
// ═══════════════════════════════════════════════════════════════
app.get('/api/love-stories', async (req, res) => {
  const { limit, page = 1 } = req.query
  const offset = (Number(page) - 1) * Number(limit || 12)
  if (limit) {
    const r = await query(`SELECT * FROM love_stories WHERE is_active=true ORDER BY sort_order ASC, created_at DESC LIMIT $1 OFFSET $2`, [Number(limit), offset])
    return res.json(r.rows)
  }
  const r = await query(`SELECT * FROM love_stories WHERE is_active=true ORDER BY sort_order ASC, created_at DESC`)
  res.json(r.rows)
})

// ═══════════════════════════════════════════════════════════════
//  PUBLIC – Love Wall
// ═══════════════════════════════════════════════════════════════
app.get('/api/love-wall', async (req, res) => {
  const r = await query(`
    SELECT lw.*, d.donor_name
    FROM love_wall lw
    LEFT JOIN donations d ON lw.donation_id=d.id
    WHERE lw.is_active=true
    ORDER BY lw.sort_order ASC, lw.created_at DESC
  `)
  res.json(r.rows)
})

// ═══════════════════════════════════════════════════════════════
//  ADMIN – Projects
// ═══════════════════════════════════════════════════════════════
app.get('/api/admin/projects', requireAuth, async (req, res) => {
  const { status, type, search } = req.query
  const params = []
  let sql = `
    SELECT p.*,
      COALESCE(pg.current_goods_qty,0) as current_goods_qty,
      COALESCE(pg.current_money,0) as current_money,
      COALESCE(pg.current_volunteer,0) as current_volunteer
    FROM projects p
    LEFT JOIN project_progress pg ON p.id=pg.project_id
    WHERE 1=1
  `
  if (status) { params.push(status); sql += ` AND p.status=$${params.length}` }
  if (type) { params.push(type); sql += ` AND p.project_type=$${params.length}` }
  if (search) { params.push(`%${search}%`); sql += ` AND p.title LIKE $${params.length}` }
  sql += ` ORDER BY p.updated_at DESC`
  const r = await query(sql, params)
  res.json(r.rows)
})

app.post('/api/admin/projects', requireAuth, async (req, res) => {
  const { title, background, project_type, goods_name, goods_unit, goods_price, goods_target_qty, money_target, volunteer_target, deadline, status, media_urls, remarks } = req.body
  if (!title || !project_type || !deadline) return res.status(400).json({ error: '缺少必填字段' })
  if (!['goods_only','money_only','mixed'].includes(project_type)) return res.status(400).json({ error: '无效项目类型' })

  const r = await query(
    `INSERT INTO projects (title, background, project_type, goods_name, goods_unit, goods_price, goods_target_qty, money_target, volunteer_target, deadline, status, media_urls, remarks)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
    [title, background||null, project_type, goods_name||null, goods_unit||null, goods_price||null, goods_target_qty||null, money_target||null, volunteer_target||0, deadline, status||'draft', JSON.stringify(media_urls||[]), remarks||null]
  )
  await ensureProgress(r.rows[0].id)
  res.json(r.rows[0])
})

app.put('/api/admin/projects/:id', requireAuth, async (req, res) => {
  const { id } = req.params
  const fields = ['title','background','project_type','goods_name','goods_unit','goods_price','goods_target_qty','money_target','volunteer_target','deadline','status','media_urls','remarks']
  const updates = []
  const vals = []
  fields.forEach(f => {
    if (req.body[f] !== undefined) {
      vals.push(f === 'media_urls' ? JSON.stringify(req.body[f]) : req.body[f])
      updates.push(`${f}=$${vals.length}`)
    }
  })
  if (!updates.length) return res.status(400).json({ error: '没有更新字段' })
  vals.push(id)
  const r = await query(`UPDATE projects SET ${updates.join(',')}, updated_at=NOW() WHERE id=$${vals.length} RETURNING *`, vals)
  if (!r.rows[0]) return res.status(404).json({ error: '项目不存在' })
  res.json(r.rows[0])
})

app.delete('/api/admin/projects/:id', requireAuth, async (req, res) => {
  const { id } = req.params
  const r = await query(`SELECT status FROM projects WHERE id=$1`, [id])
  if (!r.rows[0]) return res.status(404).json({ error: '项目不存在' })
  if (r.rows[0].status !== 'draft') return res.status(400).json({ error: '只能删除草稿状态的项目' })
  await query(`DELETE FROM projects WHERE id=$1`, [id])
  res.json({ success: true })
})

app.post('/api/admin/projects/:id/end', requireAuth, async (req, res) => {
  const { id } = req.params
  await query(`UPDATE projects SET status='ended', updated_at=NOW() WHERE id=$1 AND status IN ('ongoing','reviewing')`, [id])
  res.json({ success: true })
})

app.get('/api/admin/projects/:id/stock', requireAuth, async (req, res) => {
  const { id } = req.params
  const proj = await query(`SELECT * FROM projects WHERE id=$1`, [id])
  if (!proj.rows[0]) return res.status(404).json({ error: '项目不存在' })

  const prog = await query(`SELECT * FROM project_progress WHERE project_id=$1`, [id])
  const progress = prog.rows[0] || { current_goods_qty: 0, current_money: 0 }

  const out = await query(`
    SELECT
      COALESCE(SUM(CASE WHEN out_type='goods' THEN quantity ELSE 0 END),0) as goods_out,
      COALESCE(SUM(CASE WHEN out_type='money' THEN quantity ELSE 0 END),0) as money_out
    FROM stock_out_orders WHERE project_id=$1
  `, [id])

  const goodsOut = Number(out.rows[0]?.goods_out || 0)
  const moneyOut = Number(out.rows[0]?.money_out || 0)

  res.json({
    goods_stock: Number(progress.current_goods_qty) - goodsOut,
    money_balance: Number(progress.current_money) - moneyOut,
    goods_out: goodsOut,
    money_out: moneyOut,
    current_goods_qty: Number(progress.current_goods_qty),
    current_money: Number(progress.current_money),
    current_volunteer: Number(progress.current_volunteer),
  })
})

// ═══════════════════════════════════════════════════════════════
//  ADMIN – Donations
// ═══════════════════════════════════════════════════════════════
app.get('/api/admin/donations', requireAuth, async (req, res) => {
  const { project_id, type, status, search } = req.query
  const params = []
  let sql = `SELECT d.*, p.title as project_title FROM donations d LEFT JOIN projects p ON d.project_id=p.id WHERE 1=1`
  if (project_id) { params.push(project_id); sql += ` AND d.project_id=$${params.length}` }
  if (type) { params.push(type); sql += ` AND d.type=$${params.length}` }
  if (status) { params.push(status); sql += ` AND d.status=$${params.length}` }
  if (search) { params.push(`%${search}%`); sql += ` AND d.donor_name LIKE $${params.length}` }
  sql += ` ORDER BY d.created_at DESC`
  const r = await query(sql, params)
  res.json(r.rows)
})

app.get('/api/admin/donations/:id', requireAuth, async (req, res) => {
  const { id } = req.params
  const r = await query(`
    SELECT d.*, p.title as project_title, p.project_type, p.goods_name, p.goods_unit
    FROM donations d LEFT JOIN projects p ON d.project_id=p.id
    WHERE d.id=$1
  `, [id])
  if (!r.rows[0]) return res.status(404).json({ error: '捐赠记录不存在' })
  res.json(r.rows[0])
})

app.put('/api/admin/donations/:id', requireAuth, async (req, res) => {
  const { id } = req.params
  const { status } = req.body
  const r = await query(`UPDATE donations SET status=$1 WHERE id=$2 RETURNING *`, [status, id])
  res.json(r.rows[0])
})

app.post('/api/admin/donations/manual', requireAuth, async (req, res) => {
  const { projectId, donorName, donorContact, type, amount, goodsQty, goodsName, volunteerSkill, message } = req.body
  if (!type) return res.status(400).json({ error: '缺少类型' })

  const dr = await query(
    `INSERT INTO donations (project_id, donor_name, donor_contact, type, amount, goods_name, goods_qty, volunteer_skill, message, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'fulfilled') RETURNING *`,
    [projectId||null, donorName||'线下捐赠', donorContact||null, type, amount||null, goodsName||null, goodsQty||null, volunteerSkill||null, message||null]
  )
  const donation = dr.rows[0]

  if (projectId) {
    const proj = await query(`SELECT * FROM projects WHERE id=$1`, [projectId])
    if (proj.rows[0]) {
      await ensureProgress(projectId)
      if (type === 'goods' && proj.rows[0].project_type !== 'money_only') {
        await query(`UPDATE project_progress SET current_goods_qty=current_goods_qty+($1) WHERE project_id=$2`, [goodsQty||0, projectId])
      } else if (type === 'money' && proj.rows[0].project_type !== 'goods_only') {
        await query(`UPDATE project_progress SET current_money=current_money+($1) WHERE project_id=$2`, [amount||0, projectId])
      } else if (type === 'volunteer') {
        await query(`UPDATE project_progress SET current_volunteer=current_volunteer+1 WHERE project_id=$1`, [projectId])
      }
      await checkAutoEnd(projectId)
    }
  }

  res.json(donation)
})

app.post('/api/admin/donations/:id/generate-certificate', requireAuth, async (req, res) => {
  const { id } = req.params
  const d = await query(`SELECT certificate_code FROM donations WHERE id=$1`, [id])
  if (!d.rows[0]) return res.status(404).json({ error: '不存在' })
  const code = d.rows[0].certificate_code || genCertCode()
  await query(`UPDATE donations SET certificate_code=$1, certificate_generated_at=NOW() WHERE id=$2`, [code, id])
  res.json({ certificateCode: code })
})

// ═══════════════════════════════════════════════════════════════
//  ADMIN – Stock Out
// ═══════════════════════════════════════════════════════════════
app.post('/api/admin/stock-out', requireAuth, async (req, res) => {
  const { projectId, outType, goodsName, quantity, recipient, purpose, orderDate } = req.body
  if (!outType || !quantity) return res.status(400).json({ error: '缺少必填字段' })

  if (projectId) {
    const stock = await query(`
      SELECT
        COALESCE(pg.current_goods_qty,0) as cur_goods,
        COALESCE(pg.current_money,0) as cur_money,
        COALESCE((SELECT SUM(quantity) FROM stock_out_orders WHERE project_id=$1 AND out_type='goods'),0) as goods_out,
        COALESCE((SELECT SUM(quantity) FROM stock_out_orders WHERE project_id=$1 AND out_type='money'),0) as money_out
      FROM project_progress pg WHERE pg.project_id=$1
    `, [projectId])

    const curGoods = Number(stock.rows[0]?.cur_goods || 0)
    const curMoney = Number(stock.rows[0]?.cur_money || 0)
    const goodsOut = Number(stock.rows[0]?.goods_out || 0)
    const moneyOut = Number(stock.rows[0]?.money_out || 0)

    if (outType === 'goods' && Number(quantity) > curGoods - goodsOut) {
      return res.status(400).json({ error: '物资库存不足' })
    }
    if (outType === 'money' && Number(quantity) > curMoney - moneyOut) {
      return res.status(400).json({ error: '资金余额不足' })
    }
  }

  const r = await query(
    `INSERT INTO stock_out_orders (project_id, out_type, goods_name, quantity, recipient, purpose, order_date, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [projectId||null, outType, goodsName||null, quantity, recipient||null, purpose||null, orderDate||new Date().toISOString().slice(0,10), req.admin.id]
  )
  res.json(r.rows[0])
})

app.get('/api/admin/stock-out', requireAuth, async (req, res) => {
  const { project_id } = req.query
  let sql = `SELECT so.*, p.title as project_title FROM stock_out_orders so LEFT JOIN projects p ON so.project_id=p.id WHERE 1=1`
  const params = []
  if (project_id) { params.push(project_id); sql += ` AND so.project_id=$${params.length}` }
  sql += ` ORDER BY so.created_at DESC`
  const r = await query(sql, params)
  res.json(r.rows)
})

// ═══════════════════════════════════════════════════════════════
//  ADMIN – Achievements
// ═══════════════════════════════════════════════════════════════
app.get('/api/admin/achievements', requireAuth, async (req, res) => {
  const { project_id } = req.query
  let sql = `SELECT a.*, p.title as project_title FROM achievements a LEFT JOIN projects p ON a.project_id=p.id`
  const params = []
  if (project_id) { params.push(project_id); sql += ` WHERE a.project_id=$${params.length}` }
  sql += ` ORDER BY a.write_date DESC`
  const r = await query(sql, params)
  res.json(r.rows)
})

app.post('/api/admin/achievements', requireAuth, async (req, res) => {
  const { projectId, title, subtitle, paragraph1, media_urls, conclusion, writeDate } = req.body
  if (!title || !writeDate) return res.status(400).json({ error: '缺少必填字段' })
  const r = await query(
    `INSERT INTO achievements (project_id, title, subtitle, paragraph1, media_urls, conclusion, write_date)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [projectId||null, title, subtitle||null, paragraph1||null, JSON.stringify(media_urls||[]), conclusion||null, writeDate]
  )
  res.json(r.rows[0])
})

app.put('/api/admin/achievements/:id', requireAuth, async (req, res) => {
  const { id } = req.params
  const { projectId, title, subtitle, paragraph1, media_urls, conclusion, writeDate } = req.body
  const r = await query(
    `UPDATE achievements SET project_id=$1, title=$2, subtitle=$3, paragraph1=$4, media_urls=$5, conclusion=$6, write_date=$7 WHERE id=$8 RETURNING *`,
    [projectId||null, title, subtitle||null, paragraph1||null, JSON.stringify(media_urls||[]), conclusion||null, writeDate, id]
  )
  res.json(r.rows[0])
})

app.delete('/api/admin/achievements/:id', requireAuth, async (req, res) => {
  await query(`DELETE FROM achievements WHERE id=$1`, [req.params.id])
  res.json({ success: true })
})

// ═══════════════════════════════════════════════════════════════
//  ADMIN – Love Stories
// ═══════════════════════════════════════════════════════════════
app.get('/api/admin/love-stories', requireAuth, async (req, res) => {
  const r = await query(`SELECT * FROM love_stories ORDER BY sort_order ASC, created_at DESC`)
  res.json(r.rows)
})

app.post('/api/admin/love-stories', requireAuth, async (req, res) => {
  const { title, type, media_url, donor_name, sort_order, is_active } = req.body
  if (!title || !media_url) return res.status(400).json({ error: '缺少必填字段' })
  const r = await query(
    `INSERT INTO love_stories (title, type, media_url, donor_name, sort_order, is_active)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [title, type||'image', media_url, donor_name||null, sort_order||0, is_active!==false]
  )
  res.json(r.rows[0])
})

app.put('/api/admin/love-stories/:id', requireAuth, async (req, res) => {
  const { id } = req.params
  const { title, type, media_url, donor_name, sort_order, is_active } = req.body
  const r = await query(
    `UPDATE love_stories SET title=$1, type=$2, media_url=$3, donor_name=$4, sort_order=$5, is_active=$6 WHERE id=$7 RETURNING *`,
    [title, type||'image', media_url, donor_name||null, sort_order||0, is_active!==false, id]
  )
  res.json(r.rows[0])
})

app.delete('/api/admin/love-stories/:id', requireAuth, async (req, res) => {
  await query(`DELETE FROM love_stories WHERE id=$1`, [req.params.id])
  res.json({ success: true })
})

app.put('/api/admin/love-stories/reorder', requireAuth, async (req, res) => {
  const { items } = req.body
  if (!Array.isArray(items)) return res.status(400).json({ error: '需要数组' })
  for (const item of items) {
    await query(`UPDATE love_stories SET sort_order=$1 WHERE id=$2`, [item.sort_order, item.id])
  }
  res.json({ success: true })
})

// ═══════════════════════════════════════════════════════════════
//  ADMIN – Love Wall
// ═══════════════════════════════════════════════════════════════
app.get('/api/admin/love-wall', requireAuth, async (req, res) => {
  const r = await query(`
    SELECT lw.*, d.donor_name
    FROM love_wall lw LEFT JOIN donations d ON lw.donation_id=d.id
    ORDER BY lw.sort_order ASC, lw.created_at DESC
  `)
  res.json(r.rows)
})

app.post('/api/admin/love-wall', requireAuth, async (req, res) => {
  const { type, media_url, title, description, donation_id, sort_order, is_active } = req.body
  if (!media_url) return res.status(400).json({ error: '缺少媒体URL' })
  const r = await query(
    `INSERT INTO love_wall (type, media_url, title, description, donation_id, sort_order, is_active)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [type||'image', media_url, title||null, description||null, donation_id||null, sort_order||0, is_active!==false]
  )
  res.json(r.rows[0])
})

app.put('/api/admin/love-wall/:id', requireAuth, async (req, res) => {
  const { id } = req.params
  const { type, media_url, title, description, donation_id, sort_order, is_active } = req.body
  const r = await query(
    `UPDATE love_wall SET type=$1, media_url=$2, title=$3, description=$4, donation_id=$5, sort_order=$6, is_active=$7 WHERE id=$8 RETURNING *`,
    [type||'image', media_url, title||null, description||null, donation_id||null, sort_order||0, is_active!==false, id]
  )
  res.json(r.rows[0])
})

app.delete('/api/admin/love-wall/:id', requireAuth, async (req, res) => {
  await query(`DELETE FROM love_wall WHERE id=$1`, [req.params.id])
  res.json({ success: true })
})

// ═══════════════════════════════════════════════════════════════
//  ADMIN – Media
// ═══════════════════════════════════════════════════════════════
app.get('/api/admin/media', requireAuth, async (req, res) => {
  const r = await query(`SELECT * FROM media_assets ORDER BY upload_time DESC`)
  res.json(r.rows)
})

app.post('/api/admin/media/upload', requireAuth, async (req, res) => {
  const { file_url, file_type, original_name } = req.body
  if (!file_url) return res.status(400).json({ error: '缺少文件URL' })
  const r = await query(
    `INSERT INTO media_assets (file_url, file_type, original_name) VALUES ($1,$2,$3) RETURNING *`,
    [file_url, file_type||'image', original_name||null]
  )
  res.json(r.rows[0])
})

app.put('/api/admin/media/:id/replace', requireAuth, async (req, res) => {
  const { id } = req.params
  const { new_file_url } = req.body
  if (!new_file_url) return res.status(400).json({ error: '缺少新文件URL' })
  const old = await query(`SELECT file_url FROM media_assets WHERE id=$1`, [id])
  if (!old.rows[0]) return res.status(404).json({ error: '素材不存在' })

  // Update media_assets
  await query(`UPDATE media_assets SET file_url=$1 WHERE id=$2`, [new_file_url, id])

  // Update references in projects table
  const projects = await query(`SELECT id, media_urls FROM projects WHERE media_urls::text LIKE $1`, [`%${old.rows[0].file_url}%`])
  for (const proj of projects.rows) {
    const urls = proj.media_urls || []
    const newUrls = urls.map(u => u === old.rows[0].file_url ? new_file_url : u)
    await query(`UPDATE projects SET media_urls=$1, updated_at=NOW() WHERE id=$2`, [JSON.stringify(newUrls), proj.id])
  }

  // Update achievements
  const achievements = await query(`SELECT id, media_urls FROM achievements WHERE media_urls::text LIKE $1`, [`%${old.rows[0].file_url}%`])
  for (const ach of achievements.rows) {
    const urls = ach.media_urls || []
    const newUrls = urls.map(u => u === old.rows[0].file_url ? new_file_url : u)
    await query(`UPDATE achievements SET media_urls=$1 WHERE id=$2`, [JSON.stringify(newUrls), ach.id])
  }

  res.json({ success: true })
})

// ═══════════════════════════════════════════════════════════════
//  ADMIN – Dashboard
// ═══════════════════════════════════════════════════════════════
app.get('/api/admin/dashboard', requireAuth, async (req, res) => {
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0,10)

  const [projCount, moneySum, donationCount, volunteerCount] = await Promise.all([
    query(`SELECT COUNT(*) as cnt FROM projects WHERE status='ongoing'`),
    query(`SELECT COALESCE(SUM(amount),0) as total FROM donations WHERE status IN ('paid','fulfilled','pending') AND created_at >= $1 AND type='money'`, [monthStart]),
    query(`SELECT COUNT(*) as cnt FROM donations WHERE status IN ('paid','fulfilled','pending') AND created_at >= $1`, [monthStart]),
    query(`SELECT COUNT(*) as cnt FROM donations WHERE status='pending' AND type='volunteer' AND created_at >= $1`, [monthStart]),
  ])

  const recentDonations = await query(`
    SELECT d.*, p.title as project_title
    FROM donations d LEFT JOIN projects p ON d.project_id=p.id
    ORDER BY d.created_at DESC LIMIT 5
  `)

  const warnings = await query(`
    SELECT p.id, p.title, p.goods_name, COALESCE(pg.current_goods_qty,0) as current_goods_qty, p.goods_target_qty
    FROM projects p LEFT JOIN project_progress pg ON p.id=pg.project_id
    WHERE p.status='ongoing' AND p.goods_target_qty > 0
    AND (COALESCE(pg.current_goods_qty,0) / p.goods_target_qty) < 0.1
  `)

  res.json({
    ongoingProjects: Number(projCount.rows[0]?.cnt || 0),
    monthDonationMoney: Number(moneySum.rows[0]?.total || 0),
    monthDonationCount: Number(donationCount.rows[0]?.cnt || 0),
    pendingVolunteers: Number(volunteerCount.rows[0]?.cnt || 0),
    recentDonations: recentDonations.rows,
    stockWarnings: warnings.rows,
  })
})

// ── Health check ─────────────────────────────────────────────
app.get('/api/health', async (req, res) => {
  try {
    await query(`SELECT 1`)
    res.json({ ok: true, time: new Date().toISOString() })
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message })
  }
})

// ── Start server ──────────────────────────────────────────────
if (require.main === module) {
  app.listen(PORT, '0.0.0.0', (err) => {
    if (err) { console.error('Server error:', err); process.exit(1) }
    console.log(`API server running on http://0.0.0.0:${PORT}`)
  }).on('error', e => { console.error('Listen error:', e); process.exit(1) })
}

module.exports = app
