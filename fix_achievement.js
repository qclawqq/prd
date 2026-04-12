// Temporary script to fix AchievementManage.jsx
const fs = require('fs');
const path = 'C:/Users/Administrator/.qclaw/workspace/agent-fa90ed19/donation-platform/frontend/src/pages/admin/AchievementManage.jsx';

let content = fs.readFileSync(path, 'utf8');

// Fix the handleDelete line - replace with clean ASCII version
content = content.replace(
  /const handleDelete = async \(a\) => \{ if \(confirm\('[^']*'\)\) \{ await deleteAchievement\(a\.id\)\.catch\(e => alert\('[^']*'\)\); load\(\) \} \}/,
  "const handleDelete = async (a) => { if (confirm('Delete?')) { try { await deleteAchievement(a.id); } catch(e) { alert('Failed'); } load(); } }"
);

fs.writeFileSync(path, content, 'utf8');
console.log('Fixed!');
