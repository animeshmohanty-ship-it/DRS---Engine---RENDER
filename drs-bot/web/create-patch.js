const fs = require('fs');
const file = 'c:/Users/Animesh.Mohanty/Desktop/DRS-RENDER/drs-bot/web/app/page.jsx';
let code = fs.readFileSync(file, 'utf8');

// 1. Add state
code = code.replace(
  'const [loading, setLoading] = useState({});',
  'const [loading, setLoading] = useState({});\n  const [abortControllers, setAbortControllers] = useState({});'
);

// 2. Add cancel helper before generatePlan
code = code.replace(
  'const generatePlan = async (baseInput) => {',
  'const cancelGeneration = (key) => {\n    if (abortControllers[key]) {\n      abortControllers[key].abort();\n      setAbortControllers(prev => {\n        const next = { ...prev };\n        delete next[key];\n        return next;\n      });\n    }\n  };\n\n  const generatePlan = async (baseInput) => {'
);

// 3. Inject signal into ALL fetch('/api/generate' calls
code = code.replace(/fetch\('\/api\/generate',\s*\{([\s\S]*?body:\s*JSON\.stringify\([^)]+\)[\s\S]*?)\}\);/g, (match, inner) => {
  // If it already has signal, skip
  if (inner.includes('signal:')) return match;
  // Determine the key based on context (hacky but works for this specific file)
  return match.replace('});', '  signal: controller.signal\n        });');
});

fs.writeFileSync('patch.js', code);
console.log('Done script generation');
