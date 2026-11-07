const fs = require('fs');
let c = fs.readFileSync('constants.tsx', 'utf-8');

// Replace A0 with Pre-A1 in CEFR_LEVELS
c = c.replace(/id:\s*'A0'/, "id: 'Pre-A1'");
c = c.replace(/code:\s*'A0'/, "code: 'Pre-A1'");
c = c.replace(/badge:\s*'A0'/, "badge: 'Pre-A1'");
c = c.replace(/fa:\s*'پایه صفر'/, "fa: 'پایه مقدماتی (Pre-A1)'");

fs.writeFileSync('constants.tsx', c, 'utf-8');
console.log('Updated constants.tsx with Pre-A1');
