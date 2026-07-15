// Stage 2 — Geography Intelligence & Rollout (per DRS-SKILL.md §3 Stage 2).
// Exposes prompts for the split-call architecture:
//   1. buildStage2SearchPrompt — grounded search query for raw numbers (HORECA, demographics)
//   2. buildStage2FinalizePrompt — standard fast query to compile zones, phases, and rationales

function getSearchAnchors(country, state) {
  const target = state ? `${state}, ${country}` : country;
  const cLower = country.toLowerCase();
  
  if (cLower === 'india') {
    return [
      `NRAI (National Restaurant Association of India) Food Services Report for ${target}`,
      `Excise Department liquor licensing registry for ${target}`,
      `FHRAI (Federation of Hotel & Restaurant Associations of India) hotel lists`,
      `Ministry of MSME registered retail counts for ${target}`
    ];
  }
  
  if (cLower === 'romania') {
    return [
      `INSSE (National Institute of Statistics Romania) business census for ${target}`,
      `Horeca Romania association statistics`,
      `ANAT (National Association of Travel Agencies Romania) registered units`
    ];
  }

  if (cLower === 'ireland') {
    return [
      `CSO (Central Statistics Office Ireland) retail and hospitality counts for ${target}`,
      `Fáilte Ireland registered accommodation list`,
      `LVA (Licensed Vintners Association) or VFI licensed premises database`
    ];
  }

  if (cLower === 'brazil' || cLower === 'brasil') {
    return [
      `IBGE (Instituto Brasileiro de Geografia e Estatística) cadastro de empresas para ${target}`,
      `Ministério do Turismo (Cadastur) hotéis e restaurantes registrados para ${target}`,
      `ABRASEL (Associação Brasileira de Bares e Restaurantes) dados e estatísticas`
    ];
  }

  // Default fallback for any other country (e.g. UK, Germany, USA, etc.):
  return [
    `National Statistics Office registered business census in ${target}`,
    `Ministry of Tourism registered hotels and HORECA lists for ${target}`,
    `National Retail Federation and local hotel association reports in ${target}`,
    `Excise and licensing department trade database for ${target}`
  ];
}

// Location-specific MRF (Material Recovery Facility) search anchors
function getMRFAnchors(country, state) {
  const target = state ? `${state}, ${country}` : country;
  const cLower = country.toLowerCase();

  if (cLower === 'india') {
    return [
      `Swachh Bharat Mission registered Material Recovery Facilities (MRFs) in ${target}`,
      `SPCB (State Pollution Control Board) authorised waste sorting facilities in ${target}`,
      `Urban Local Bodies (ULBs) with operational MRFs under Swachhatam portal in ${target}`,
      `CPCB registered civic collection depots and secondary storage points in ${target}`
    ];
  }

  if (cLower === 'romania') {
    return [
      `ANPM (Agentia Nationala pentru Protectia Mediului) registered sorting facilities in ${target}`,
      `ANRSC licensed waste collection operators in ${target}`,
      `Selective waste collection (colectare selectiva) points under Judet Council in ${target}`
    ];
  }

  if (cLower === 'ireland') {
    return [
      `EPA (Environmental Protection Agency Ireland) licensed waste facilities in ${target}`,
      `REPAK-registered packaging collection points in ${target}`,
      `Local Authority Household Waste Recycling Centres (HWRCs) in ${target}`
    ];
  }

  if (cLower === 'brazil' || cLower === 'brasil') {
    return [
      `SINIR (Sistema Nacional de Informacoes sobre Residuos) registered MRFs in ${target}`,
      `IBAMA registered recycling cooperatives and sorting facilities in ${target}`,
      `Coleta Seletiva municipal collection depots registered in ${target}`
    ];
  }

  // Generic international fallback
  return [
    `National Environment Agency registered waste sorting and MRF facilities in ${target}`,
    `Registered packaging / deposit-return collection points in ${target}`,
    `Municipal recycling depot count registered under local government authority in ${target}`
  ];
}

// Prompt 1: Grounded search query (extracts raw numbers)
export function buildStage2SearchPrompt(input) {
  const {
    country = 'India',
    state,
    cascadedDemographics = null,
    calendarMonths = []
  } = input;

  const isNat = !state || state.toLowerCase() === 'national' || state.toLowerCase().includes('whole country');
  const targetLocation = isNat ? country : `${state}, ${country}`;
  const locationPromptLabel = isNat ? `the country of "${country}"` : `the region of "${state}", "${country}"`;

  const anchors = getSearchAnchors(country, state);

  return `You are the DRS (Deposit Return System) roadmap engine for Recykal. You are performing geographical research for the target location: "${targetLocation}".

[CRITICAL GEOGRAPHIC SEGREGATION RULE]
Your report must be strictly and exclusively for "${targetLocation}".
Do NOT mix in, reuse, or reference data, counts, or government bodies from other countries (such as India or Romania) if you are currently generating a report for a different target like Brazil, Ireland, etc. 
If search results return non-relevant regional entries, discard them.

YOUR TASK:
Perform a web search to find the LATEST active counts and statistics (prioritizing recent data from 2024 to 2026) of:
1. Retail stores, supermarkets, grocery/kirana shops, and general stores in ${locationPromptLabel}.
2. Liquor outlets, bars, pubs, and liquor shops in ${locationPromptLabel}.
3. HORECA (hotels, lodging facilities, standalone restaurants, fast food, and cafes) in ${locationPromptLabel}.
4. Formally registered Material Recovery Facilities (MRFs), civic waste sorting centres, and government-authorised recycling depots in ${locationPromptLabel}. To find accurate MRF counts, search these official registries:
${getMRFAnchors(country, state).map((a, i) => `   ${i + 1}. ${a}`).join('\n')}
5. The latest official population of ${locationPromptLabel}, and the official current list of active districts/provinces, their subdivisions (talukas/tehsils), and their populations.
6. Major seasonal holidays, festivals, peak tourist months, weather conditions, or operational challenges in ${locationPromptLabel} during the calendar months: ${calendarMonths.join(', ')}.

To get the most accurate, high-credibility data, explicitly search for registered counts within these official local authorities and trade associations:
${anchors.map((a, i) => `${i + 1}. ${a}`).join('\n')}

[UNIVERSAL 3-TIER ADMINISTRATIVE MAPPING]
Regardless of the country, map its administrative structure strictly to this 3-Tier standard:
- Level 1: Primary macro-division (e.g., States, Provinces, Regions).
- Level 2: Secondary sub-division (e.g., Districts, Counties, Municipalities).
- Level 3: Local civic body (e.g., Wards, Communes, Panchayats).

When filling out the stateSummary JSON below:
- Place the total count of Level 1 divisions inside the "districts" key (ignore the literal Indian terminology of the key).
- Place the total count of Level 2 divisions inside the "talukasOrTehsils" key (ignore the literal Indian terminology of the key).

${cascadedDemographics ? `
CRITICAL CASCADED DEMOGRAPHICS CONSTRAINT (Strict Override):
This is a sub-project launched from a parent plan. You MUST restrict counts to fit these limits:
- Target Population: ${cascadedDemographics.population}
- Maximum allowable Touchpoints Universe Total: ${cascadedDemographics.childLimits?.universeTotal || 'limited'}
- Category Limit Caps:
  ${cascadedDemographics.childLimits?.groups?.map(g => `* ${g.group}: max ${g.limit}`).join('\n  ')}
` : ''}

Do NOT rely on outdated 2011 census information if newer estimates are available.

[CRITICAL SOURCE CITATION RULE]
For EVERY number you return, you MUST cite the exact URL of the web page you found that number on.
- Use the "source" field for the direct URL (e.g. "https://fhrai.com/statistics")
- Use the "sourceTitle" field for the name of the page or organisation (e.g. "FHRAI Hotel Count 2024")
- If you cannot find a credible URL for a specific number, set "source": null and "sourceTitle": null
- NEVER fabricate or guess a source URL. Only use URLs from actual search results.

Return ONLY a single valid JSON object (no markdown fences, no prose) with EXACTLY this structure:
{
  "touchpoints": {
    "groups": [
      {
        "group": "Liquor outlets",
        "total": <number>,
        "source": "<exact URL where you found this count, or null>",
        "sourceTitle": "<name of the source page or organisation, or null>",
        "subtypes": [
          { "label": "Bars / Pubs", "count": <number> },
          { "label": "Liquor shops", "count": <number> }
        ]
      },
      {
        "group": "HORECA",
        "total": <number>,
        "source": "<exact URL where you found this count, or null>",
        "sourceTitle": "<name of the source page or organisation, or null>",
        "subtypes": [
          { "label": "Hotels", "count": <number> },
          { "label": "Restaurants", "count": <number> },
          { "label": "Cafés", "count": <number> },
          { "label": "Fast food", "count": <number> }
        ]
      },
      {
        "group": "Retail / Kirana",
        "total": <number>,
        "source": "<exact URL where you found this count, or null>",
        "sourceTitle": "<name of the source page or organisation, or null>",
        "subtypes": [
          { "label": "Organized Retail (Supermarkets & Chain Stores)", "count": <number> },
          { "label": "Unorganized Retail (Traditional Kirana & Local Shops)", "count": <number> }
        ]
      },
      {
        "group": "Civic Infrastructure",
        "total": <number>,
        "source": "<exact URL where you found this count, or null>",
        "sourceTitle": "<name of the source page or organisation, or null>",
        "subtypes": [
          { "label": "Material Recovery Facilities (MRFs)", "count": <number> }
        ]
      }
    ],
    "universeTotal": <number, must equal sum of the 4 group totals above>
  },
  "stateSummary": {
    "population": {
      "value": <number|null>,
      "unit": "people",
      "confidence": "Verified",
      "source": "<exact URL where you found this population figure, or null>",
      "sourceTitle": "<name of the source, or null>"
    },
    "districts": {
      "value": <number|null>,
      "confidence": "Verified",
      "note": "If Target Location is a Country, return total States count. If Target Location is a State/Province, return total Districts/Counties count.",
      "source": "<exact URL where you found this districts count, or null>",
      "sourceTitle": "<name of the source, or null>"
    },
    "talukasOrTehsils": {
      "value": <number|null>,
      "confidence": "Verified",
      "note": "If Target Location is a Country, return total Districts count. If Target Location is a State/Province, return total local subdivisions (Tehsils/Talukas/Mandals/Wards) count.",
      "source": "<exact URL where you found this subdivisions count, or null>",
      "sourceTitle": "<name of the source, or null>"
    },
    "tourismLevel": { "value": "High|Medium|Low", "confidence": "Verified", "note": "<short caveat>" },
    "regulatoryContext": "<2-3 sentence grounded summary of the DRS / plastic-waste / excise regulatory status in this country/state>"
  }
}`;
}

// Prompt 2: Standard fast compile query (extracts phases, rollout, and rationales)
export function buildStage2FinalizePrompt(input, touchpoints, stateSummary) {
  const {
    country = 'India',
    state,
    implementationModel = 'End-to-End DRS (Scheme Operator)',
    materials = ['Liquor', 'MLP', 'Cans', 'PET'],
    objective = ''
  } = input;

  const isNat = !state || state.toLowerCase() === 'national' || state.toLowerCase().includes('whole country');
  const targetLocation = isNat ? country : state;

  const tpSummary = touchpoints.groups
    ? touchpoints.groups.map((g) => `- ${g.group}: ${g.total} (${g.subtypes.map((s) => `${s.label} ${s.count}`).join(', ')})`).join('\n')
    : '';

  const geoSchemaInstructions = `"level1": "<the official local term for Level 1 (Primary macro-division), e.g., State|Province|Region>", "level2": "<the official local term for Level 2 (Secondary sub-division), e.g., District|County|Municipality>", "level3": "<the official local term for Level 3 (Local body), e.g., Ward|Commune|Panchayat>"`;

  return `You are the DRS (Deposit Return System) roadmap engine for Recykal. You are finalizing STAGE 2 — Geography Intelligence & Rollout.

PROJECT CONTEXT:
- Target Location: ${targetLocation}
- Implementation Model: ${implementationModel}
- Materials: ${materials.join(', ')}

[UNIVERSAL 3-TIER ADMINISTRATIVE MAPPING]
Regardless of the country, map its administrative structure strictly to this 3-Tier standard:
- Level 1: Primary macro-division (e.g., States, Provinces, Regions).
- Level 2: Secondary sub-division (e.g., Districts, Counties, Municipalities).
- Level 3: Local civic body (e.g., Wards, Communes, Panchayats).
In the geoSchema JSON below, provide the exact local name for these 3 tiers in ${targetLocation}.
- Business objective: ${objective || '(not specified)'}

EXTRACTED GEOGRAPHICAL NUMBERS FOR ${targetLocation}:
- Population: ${stateSummary.population?.value} ${stateSummary.population?.unit || 'people'}
- Districts: ${stateSummary.districts?.value}
- Subdivisions (Talukas/Tehsils): ${stateSummary.talukasOrTehsils?.value}
- Tourism Level: ${stateSummary.tourismLevel?.value}
- Regulatory Context: ${stateSummary.regulatoryContext}

TOUCHPOINT DATABASE:
${tpSummary}
- Total Touchpoint Universe: ${touchpoints.universeTotal}

YOUR TASK:
Compile the consumption models, districts hierarchy list, and rollout zone sequence for ${targetLocation}.
Follow these rules:
1. Reason over the HORECA and Liquor counts to recommend rollout sequence (higher density districts in Phase 1).
2. Align hierarchy lists with the official count of districts (${stateSummary.districts?.value || 2}).

Return ONLY a single valid JSON object (no markdown fences, no prose) with EXACTLY this structure:
{
  "geoSchema": {
    ${geoSchemaInstructions}
  },
  "consumptionPerMaterial": [
    { "material": "Liquor", "value": <number|null>, "unit": "units/year", "confidence": "Verified", "basis": "<how derived from population>" }
    // one entry per material in: ${materials.join(', ')}
  ],
  "hierarchy": [
    { "district": "<real district/province name in ${targetLocation}>", "population": <number|null>, "populationConfidence": "Verified",
      "talukas": <number|null>, "recommendedPhase": "Phase 1|Phase 2|Phase 3",
      "rationale": "<one line tied to HORECA / tourism / touchpoint density>" }
    // list the real districts of ${targetLocation}
  ],
  "rolloutSequence": [
    { "phase": "Phase 1", "zones": ["<district/zone name>"], "rationale": "<data-backed reason>" },
    { "phase": "Phase 2", "zones": ["..."], "rationale": "..." },
    { "phase": "Phase 3", "zones": ["..."], "rationale": "..." }
  ],
  "notes": "<any caveats, gaps, or operational validations for Recykal managers>"
}`;
}

// Keep old exports to maintain build compatibility
export function buildStage2Prompt(input, touchpoints) {
  return '';
}
export function buildUnifiedStage2Prompt(input) {
  return '';
}
