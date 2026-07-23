const fs = require('fs');
const file = 'c:/Users/Animesh.Mohanty/Desktop/DRS-RENDER/drs-bot/web/app/page.jsx';
let code = fs.readFileSync(file, 'utf8');

// 1. Fix Stage 16 re-draft
code = code.replace(
  /onClick=\{\(\) => generateStage\(16\)\} disabled=\{loading\[16\]\}>\s*\{loading\[16\] \? '.*?Re-drafting\.\.\.' : '.*?Re-draft all from research'\}/,
  \className={\\\copilot-toggle-btn \\\\} style={loading[16] ? {background: '#dc2626', borderColor: '#b91c1c', color: '#fff'} : { background: 'var(--grey-soft)', border: '1px solid var(--line)' }} onClick={() => loading[16] ? cancelGeneration(16) : generateStage(16)}>
                      {loading[16] ? <>?? Stop Generating</> : '? Re-draft all from research'}\
);

// 2. Fix Stage 17 re-draft empty state
code = code.replace(
  /<button className="btn" onClick=\{\(\) => generateStage\(17\)\} disabled=\{loading\[17\]\}>\{loading\[17\] \? 'Re-drafting\.' : '.*? Re-draft plan'\}<\/button>/,
  \<button className={\\\tn \\\\} style={loading[17] ? {background: '#dc2626', borderColor: '#b91c1c', color: '#fff'} : {}} onClick={() => loading[17] ? cancelGeneration(17) : generateStage(17)}>
                      {loading[17] ? <>?? Stop Generating</> : '? Re-draft plan'}
                    </button>\
);

// 3. Fix Stage 17 re-draft bottom
code = code.replace(
  /onClick=\{\(\) => generateStage\(17\)\} disabled=\{loading\[17\]\}>\s*\{loading\[17\] \? '.*?Re-drafting\.\.\.' : '.*?Re-draft plan from brief'\}/,
  \className={\\\copilot-toggle-btn \\\\} style={loading[17] ? {background: '#dc2626', borderColor: '#b91c1c', color: '#fff'} : { background: 'var(--grey-soft)', border: '1px solid var(--line)' }} onClick={() => loading[17] ? cancelGeneration(17) : generateStage(17)}>
                    {loading[17] ? <>?? Stop Generating</> : '? Re-draft plan from brief'}\
);

// 4. Fix Regenerate Stage conditionally rendered button
code = code.replace(
  /\{isStageStale\(activeStageNum\) && !loading\[activeStageNum\] && \(\s*<button className="btn outline" onClick=\{\(\) => generateStage\(activeStageNum\)\}>Regenerate Stage<\/button>\s*\)\}/,
  \{isStageStale(activeStageNum) && (
                  <button className={\\\tn outline \\\\} style={loading[activeStageNum] ? {background: '#dc2626', borderColor: '#b91c1c', color: '#fff'} : {}} onClick={() => loading[activeStageNum] ? cancelGeneration(activeStageNum) : generateStage(activeStageNum)}>
                    {loading[activeStageNum] ? <>?? Stop Generating</> : 'Regenerate Stage'}
                  </button>
                )}\
);

// 5. Fix generateAllResearch conditionally rendered button
code = code.replace(
  /<button className="btn" onClick=\{generateAllResearch\} disabled=\{researchGenerating\}>\s*\{researchGenerating \? <><span className="spinner" \/> Generating\.</ : '.*? Generate All Research'\}/,
  \<button className={\\\tn \\\\} style={researchGenerating ? {background: '#dc2626', borderColor: '#b91c1c', color: '#fff'} : {}} onClick={() => researchGenerating ? cancelGeneration('all_research') : generateAllResearch()}>
                  {researchGenerating ? <>?? Stop Generating</> : '? Generate All Research'}\
);

fs.writeFileSync(file, code);
console.log('Buttons updated successfully');
