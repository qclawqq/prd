const http = require('http')

function post(path, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body)
    const options = {
      hostname: '127.0.0.1',
      port: 3001,
      path,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
    }
    const req = http.request(options, res => {
      let d = ''
      res.on('data', c => d += c)
      res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(d) }))
    })
    req.on('error', reject)
    req.write(data)
    req.end()
  })
}

async function test() {
  try {
    // Test login
    const login = await post('/api/admin/login', { username: 'admin', password: 'admin123' })
    console.log('POST /api/admin/login:', login.status, JSON.stringify(login.body))
    
    if (login.body.token) {
      // Test dashboard
      const dashboard = await get('/api/admin/dashboard', login.body.token)
      console.log('GET /api/admin/dashboard:', dashboard.status, JSON.stringify(dashboard.body))
    }
  } catch(e) {
    console.error('Error:', e.message)
  }
}

function get(path, token) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: '127.0.0.1', port: 3001, path,
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    }
    http.get(options, res => {
      let d = ''
      res.on('data', c => d += c)
      res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(d) }))
    }).on('error', reject)
  })
}

test()
