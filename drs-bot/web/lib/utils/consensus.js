// Helper utility to calculate the statistical consensus (mode) of multiple AI generation runs.

/**
 * Calculates the statistical mode (most frequent value) from an array of values.
 */
function getMode(arr) {
  if (!Array.isArray(arr) || arr.length === 0) return null;
  const frequency = {};
  let maxFreq = 0;
  let mode = arr[0];

  for (const val of arr) {
    if (val === null || val === undefined) continue;
    // Normalize text values for comparison
    const key = typeof val === 'string' ? val.trim().toLowerCase() : String(val);
    frequency[key] = (frequency[key] || 0) + 1;
    if (frequency[key] > maxFreq) {
      maxFreq = frequency[key];
      mode = val;
    }
  }
  return mode;
}

/**
 * Recursively merges an array of JSON objects into a single consensus object.
 */
export function calculateConsensus(runs) {
  if (!Array.isArray(runs) || runs.length === 0) return null;
  if (runs.length === 1) return runs[0];

  const firstRun = runs[0];
  if (typeof firstRun !== 'object' || firstRun === null) {
    return getMode(runs);
  }

  if (Array.isArray(firstRun)) {
    // If it's an array, we match items by identifying properties (like 'group', 'district', 'front', 'material', 'name', 'phase')
    const mergedArray = [];
    const itemMap = new Map();

    // Collect all unique identifying keys across all arrays in all runs
    runs.forEach(run => {
      if (!Array.isArray(run)) return;
      run.forEach(item => {
        if (!item || typeof item !== 'object') return;
        const key = item.group || item.district || item.front || item.material || item.name || item.phase || item.label || item.threat || item.title || JSON.stringify(item);
        if (!itemMap.has(key)) {
          itemMap.set(key, []);
        }
        itemMap.get(key).push(item);
      });
    });

    // Recursively resolve consensus for each unique item
    for (const [key, items] of itemMap.entries()) {
      if (items.length > 0) {
        mergedArray.push(calculateConsensus(items));
      }
    }
    return mergedArray;
  }

  // If it's an object, merge properties recursively
  const consensusObj = {};
  const allKeys = new Set();
  runs.forEach(run => {
    if (run && typeof run === 'object') {
      Object.keys(run).forEach(key => allKeys.add(key));
    }
  });

  for (const key of allKeys) {
    const valuesAtKey = runs
      .map(run => run ? run[key] : undefined)
      .filter(v => v !== undefined);

    if (valuesAtKey.length === 0) continue;

    // Check if the values at this key are nested objects/arrays
    const firstVal = valuesAtKey[0];
    if (typeof firstVal === 'object' && firstVal !== null) {
      consensusObj[key] = calculateConsensus(valuesAtKey);
    } else {
      // For leaf nodes (numbers, strings, booleans), calculate the mode
      consensusObj[key] = getMode(valuesAtKey);
    }
  }

  return consensusObj;
}
