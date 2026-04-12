const https = require('https');
const fs = require('fs');
const path = 'C:/Users/Administrator/.qclaw/workspace/agent-fa90ed19/donation-platform/frontend/src/pages/admin/AchievementManage.jsx';

const url = 'https://raw.githubusercontent.com/qclawqq/prd/master/frontend/src/pages/admin/AchievementManage.jsx';

https.get(url, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    fs.writeFileSync(path, data, 'utf8');
    console.log('Downloaded successfully!');
  });
}).on('error', (e) => {
  console.error('Download failed:', e.message);
});
