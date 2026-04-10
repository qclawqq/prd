const http = require('http')

function get(path) {
  return new Promise((resolve, reject) => {
    http.get('http://127.0.0.1:3001' + path, res => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(data) }))
    }).on('error', reject)
  })
}

async function test() {
  try {
    const health = await get('/api/health')
    console.log('GET /api/health:', health.status, JSON.stringify(health.body))

    const projects = await get('/api/projects')
    console.log('GET /api/projects:', projects.status, JSON.stringify(projects.body))
  } catch(e) {
    console.error('Error:', e.message)
  }
}

test()
