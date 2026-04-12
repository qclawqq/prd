const fs = require('fs');
const path = 'C:/Users/Administrator/.qclaw/workspace/agent-fa90ed19/donation-platform/frontend/src/pages/admin/AchievementManage.jsx';

let content = fs.readFileSync(path, 'utf8');
const lines = content.split('\n');

console.log('Line 39 before:', lines[38]);

// Replace the garbled line 39 with a clean version
lines[38] = "  const handleDelete = async (a) => { if (confirm('Delete?')) { try { await deleteAchievement(a.id); } catch(e) { alert('Error'); } load(); } }";

console.log('Line 39 after:', lines[38]);

fs.writeFileSync(path, lines.join('\n'), 'utf8');
console.log('Written!');
