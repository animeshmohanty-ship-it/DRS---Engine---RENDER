const fs = require('fs');
const file = 'c:/Users/Animesh.Mohanty/Desktop/DRS-RENDER/drs-bot/web/app/page.jsx';
let code = fs.readFileSync(file, 'utf8');

// 1. Add state & cancel helper
code = code.replace(
  'const [loading, setLoading] = useState({});',
  const [loading, setLoading] = useState({});
  const [abortControllers, setAbortControllers] = useState({});
  
  const cancelGeneration = (stageNum) => {
    if (abortControllers[stageNum]) {
      abortControllers[stageNum].abort();
      setAbortControllers(prev => {
        const next = { ...prev };
        delete next[stageNum];
        return next;
      });
    }
  };
);

// 2. generatePlan setup
code = code.replace(
  "const generatePlan = async (baseInput) => {\n    setPlanProgress('Generating strategy & campaigns.');\n    setLoading(prev => ({ ...prev, 17: true }));",
  const generatePlan = async (baseInput) => {
    const controller = new AbortController();
    setAbortControllers(prev => ({ ...prev, 17: controller }));
    setPlanProgress('Generating strategy & campaigns.');
    setLoading(prev => ({ ...prev, 17: true }));
);

// 3. generatePlan catch
code = code.replace(
  "    } catch (e) {\n      console.error(e);\n      setError(Planning failed: );",
      } catch (e) {
      if (e.name === 'AbortError') {
        setError('Generation for Campaign Plan was stopped.');
      } else {
        console.error(e);
        setError(\Planning failed: \\);
      }
);

// 4. generateStage setup
code = code.replace(
  "const generateStage = async (stageNum) => {\n    setError(null);\n    setLoading(prev => ({ ...prev, [stageNum]: true }));",
  const generateStage = async (stageNum) => {
    setError(null);
    const controller = new AbortController();
    setAbortControllers(prev => ({ ...prev, [stageNum]: controller }));
    setLoading(prev => ({ ...prev, [stageNum]: true }));
);

// 5. generateStage catch
code = code.replace(
  "    } catch (e) {\n      setError(Stage  Generation Failed: );\n    } finally {",
      } catch (e) {
      if (e.name === 'AbortError') {
        setError(\Generation for Stage \ was stopped.\);
      } else {
        setError(\Stage \ Generation Failed: \\);
      }
    } finally {
);

// 6. UI Button
code = code.replace(
  '<button className="btn" onClick={() => generateStage(activeStageNum)} disabled={loading[activeStageNum]}>\n                {loading[activeStageNum] ? <><span className="spinner" /> Generating...</>',
  <button className={\tn \\} style={loading[activeStageNum] ? {background: '#dc2626', borderColor: '#b91c1c', color: '#fff'} : {}} onClick={() => loading[activeStageNum] ? cancelGeneration(activeStageNum) : generateStage(activeStageNum)}>
                {loading[activeStageNum] ? <>?? Stop Generating</>
);

// 7. Inject signal: controller.signal into fetch calls
code = code.replace(/projectId: projectId\s*\n\s*\})\s*\n\s*\}\);/g, "projectId: projectId\n          }),\n          signal: controller.signal\n        });");
code = code.replace(/projectId\s*\}\),\s*\n\s*\}\);/g, "projectId }),\n      signal: controller.signal\n    });");
code = code.replace(/projectId\s*\}\),\s*\}\);/g, "projectId }),\n          signal: controller.signal\n        });");


fs.writeFileSync(file, code);
console.log('Done script generation');
