const fs = require('fs');
const path = 'C:/Users/Administrator/.qclaw/workspace/agent-fa90ed19/donation-platform/frontend/src/pages/admin/AchievementManage.jsx';

let content = fs.readFileSync(path, 'utf8');

// Find and replace the garbled handleDelete line
const garbagePattern = /const handleDelete = async \(a\) => \{ if \(confirm\('[^']*'\)\) \{ await deleteAchievement\(a\.id\)\.catch\(e => alert\('[^']*'\)\); load\(\) \}/;
const fixedLine = "const handleDelete = async (a) => { if (confirm('Delete?')) { try { await deleteAchievement(a.id); } catch(e) { alert('Error'); } load(); } }";

if (garbagePattern.test(content)) {
  content = content.replace(garbagePattern, fixedLine);
  fs.writeFileSync(path, content, 'utf8');
  console.log('Fixed! New content:', content.match(/const handleDelete.*/)?.[0]);
} else {
  console.log('Pattern not found, checking line 39...');
  const lines = content.split('\n');
  console.log('Line 39:', lines[38]?.substring(0, 80));
}
