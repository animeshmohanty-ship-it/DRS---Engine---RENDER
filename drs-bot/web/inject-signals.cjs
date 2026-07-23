const fs = require('fs');
const file = 'c:/Users/Animesh.Mohanty/Desktop/DRS-RENDER/drs-bot/web/app/page.jsx';
let code = fs.readFileSync(file, 'utf8');

// Inject into generateStage fetch calls
code = code.replace(/projectId: projectId\r?\n\s*\}\)\r?\n\s*\}\);/g, "projectId: projectId\n          }),\n          signal: controller.signal\n        });");
code = code.replace(/projectId\s*\}\),\r?\n\s*\}\);/g, "projectId }),\n      signal: controller.signal\n    });");
code = code.replace(/projectId\s*\}\),\r?\n\s*\}\);/g, "projectId }),\n          signal: controller.signal\n        });");

fs.writeFileSync(file, code);
console.log('Signals injected successfully');
