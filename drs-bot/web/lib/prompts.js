// Prompts for Stages 2 to 10 of the DRS Roadmap Engine (per DRS-SKILL.md).
// Generates prompts asking for strict JSON structures representing the roadmap stages.

export function buildStagePrompt(stageNum, input, projectData = {}, action = null) {
  const {
    country = 'India',
    state = '',
    implementationModel = 'End-to-End DRS (Scheme Operator)',
    materials = ['Liquor', 'MLP', 'Cans', 'PET'],
    objective = '',
    cascadedDemographics = null,
    operationsStatus = 'Greenfield',
    projectStartMonth = 'October',
    projectStartYear = '2026',
    targetTimeline = '180 Days',
    calendarMonths = [],
    customConstraints = ''
  } = input;

  const isNat = !state || state.toLowerCase() === 'national' || state.toLowerCase().includes('whole country');
  const targetLocation = isNat ? country : state;
  const level1 = isNat ? 'State / Province' : (projectData?.stage2?.intel?.geoSchema?.level1 || 'District');
  const level2 = isNat ? 'District / County' : (projectData?.stage2?.intel?.geoSchema?.level2 || 'Taluka');
  const level3 = isNat ? 'Municipality / City' : (projectData?.stage2?.intel?.geoSchema?.level3 || 'Gram Panchayat');

  const nonIndiaWarning = country.toLowerCase() !== 'india' ? `
CRITICAL GEOGRAPHIC COMPLIANCE WARNING:
- The target country is ${country} (NOT India).
- You MUST NOT use any Indian regulatory names, terminology, or examples (such as SPCB, State Pollution Control Board, Gram Panchayat, Panchayat, Excise Commissioner, Miramar Beach, or Dabolim).
- Instead, map them to the real local equivalents in ${country} (e.g. EU regulations, National/Local Environmental Agencies, credit/debit card transfers or standard bank wires instead of UPI, and actual local cities/towns in ${country}).
` : '';

  const contextHeader = `CONTEXT (from Stage 1 Setup):
- Country: ${country}
- State/region: ${isNat ? 'National Level (Whole Country)' : state}
- Implementation model: ${implementationModel}
- Materials: ${materials.join(', ')}
- Business objective: ${objective || '(not specified)'}
- Operations status: ${operationsStatus}
- Project Timeline: ${targetTimeline} (Starting ${projectStartMonth} ${projectStartYear})
- Project Calendar Months: ${calendarMonths.join(', ')}
- Local constraints & weather conditions: ${customConstraints || 'None specified'}
- Geographic Hierarchy: Level 1 (Macro) is named "${level1}", Level 2 (Sub-division) is named "${level2}", Level 3 (Local Body) is named "${level3}"
${cascadedDemographics ? `
CASCADED DEMOGRAPHICS CONSTRAINT (Strict Override):
This is a sub-project launched from a parent master plan. Use these exact counts in your projections/calculations:
- Population of ${state}: ${cascadedDemographics.population}
- Sub-divisions count: ${cascadedDemographics.subDivisions}
` : ''}
${nonIndiaWarning}

MODEL SPECIFICS (Crucial):
If the implementation model is "Tech Solutions", focus all generation outputs (descriptions, items, templates, and actions) on SaaS software, database registries, IoT device integration APIs, merchant scanner apps, central Escrow account clearances, consumer wallet flows, and material/transaction traceability (tracking QRs from factory checkouts to recycler validation), rather than physical warehousing, truck operations, or hardware shipping.
${objective ? `\nPRIMARY BUSINESS OBJECTIVE — every output must visibly serve this goal:\n"${objective}"` : ''}

BRIEF ADHERENCE MANDATE (non-negotiable — output that ignores the brief is a failure):
- MATERIALS: Reason ONLY about the selected materials (${materials.join(', ')}). Do not introduce, cost, or plan for any material outside this list.
- IMPLEMENTATION MODEL: Every recommendation must be executable within the "${implementationModel}" model. Do not propose activities that model does not support (e.g. no truck logistics for "Tech Solutions"; no pure-software plays for "RVM-only").
- CONSTRAINTS: You MUST explicitly account for the stated local constraints${customConstraints ? `: "${customConstraints}"` : ' where relevant'}.
- TAILORING: Generic, location-agnostic output is unacceptable. Every section must tie concretely to ${targetLocation} and the brief above.`;

  switch (Number(stageNum)) {
    case 3:
      return `You are the DRS (Deposit Return System) roadmap engine for Recykal.
You are generating STAGE 3 — Market Intelligence — for a real implementation plan.

${contextHeader}

YOUR TASK:
Use Google Search grounding to pull REAL regulatory, economic, environmental, and competitor data for ${targetLocation} regarding the selected materials: ${materials.join(', ')}.
Build the deep evidence base and business case for the DRS, per material. Do NOT repeat the touchpoints/geography from Stage 2.

Return ONLY a single valid JSON object (no markdown fences, no prose) with EXACTLY this shape:
{
  "opportunityScores": {
    ${materials.map((m) => `"${m}": <number between 0 and 100>`).join(',\n    ')}
  },
  "materials": {
    ${materials.map((m) => `"${m}": {
      "marketSize": "<2-3 words, e.g. ~9 Cr bottles/yr>",
      "recoveryOpportunity": "<2-3 words, e.g. High litter area>",
      "regulatoryDriver": "Strong|Medium|Weak",
      "oneLineRead": "<one sentence overview of the opportunity>",
      "sections": {
        "impactCase": "<1-2 paragraphs detailing environment & landfill savings, beach/marine pollution impacts, and recyclate value>",
        "policyRegulatory": "<1-2 paragraphs detailing the actual laws/rules, e.g. Excise laws for liquor, Plastic Waste Management Rules 2016 for PET/MLP>",
        "benchmarks": "<1-2 paragraphs detailing international DRS models for this material, average return rates (e.g. 80-90%), and deposit values>",
        "competitorLandscape": "<1-2 paragraphs identifying existing PROs, waste collectors, and plastic recyclers active in ${targetLocation}>",
        "consumerBehaviour": "<1-2 paragraphs explaining consumer willingness, tourist transience, and return-mechanic friction>",
        "businessCase": "<1-2 paragraphs with economic modeling, including recommended deposit value per unit, and collection/offtake economics>"
      }
    }`).join(',\n    ')}
  }
}`;

    case 4:
      return `You are a senior Stakeholder & Public Affairs analyst for Recykal's DRS, applying a rigorous Power/Interest mapping method.
You are generating STAGE 4 — Stakeholder & Partner Intelligence — for a real implementation plan.

${contextHeader}
${projectData.stage3 ? `STAGE 3 EVIDENCE (opportunity scores — use to tailor each pitch):\n${JSON.stringify(projectData.stage3.opportunityScores)}` : ''}

RECYKAL / RETEARN CAPABILITY (use as the concrete leverage you offer stakeholders — name the actual product):
- Retearn (Recykal's technology arm): reklaim Pro and reklaim Mini return units; QR-based container tracking; computer-vision material ID; connected-device network; a digital Deposit Refund System with secured payouts; merchant scanner apps.
- Recykal: nationwide collection/aggregation network, marketplace, and traceability muscle (already running a live DRS deployment in Goa).

YOUR TASK:
Use Google Search grounding to map the real stakeholders (government bodies, producers/brands, trade associations, waste recyclers, AND the informal collection sector) in ${targetLocation} for ${materials.join(', ')}.

METHOD & RIGOR (mandatory):
1. Map each stakeholder on a Power/Interest grid — quadrant is one of: Manage Closely, Keep Satisfied, Keep Informed, Monitor.
2. NEVER fabricate. For each stance, state the evidence and label confidence as "Verified" (found in search), "Inferred" (reasoned from their position), or "Assumption". If unsure of a specific entity name, describe the role and mark confidence "Assumption".
3. For every stakeholder, identify their economic LOSS AVERSION (the money fear driving their stance) and the SPECIFIC Recykal/Retearn capability that neutralises it (name the actual product).
4. You MUST include at least one "Informal Sector / Waste-pickers" stakeholder — in DRS this group is make-or-break.
5. Generate a minimum of 6 stakeholders, covering every major blocker and champion.

Return ONLY a single valid JSON object (no markdown fences, no prose) with EXACTLY this shape:
{
  "executiveSummary": "<2-3 lines: the overall alignment picture and the single highest-priority stakeholder move>",
  "alignmentReadiness": {
    "overall": <number between 0 and 100>,
    "materials": {
      ${materials.map((m) => `"${m}": <number between 0 and 100>`).join(',\n      ')}
    }
  },
  "stakeholders": [
    {
      "category": "Government / Regulatory|Producers / Brands|Trade Association|Collection / Recyclers|Informal Sector / Waste-pickers",
      "name": "<real named entity, e.g. Goa Excise Department, Hotel & Restaurant Association of Goa>",
      "role": "<who they are + scale; mark any figure as (estimate) if not verified>",
      "powerInterestQuadrant": "Manage Closely|Keep Satisfied|Keep Informed|Monitor",
      "influence": "High|Medium|Low",
      "stance": "Champion|Blocker|Neutral|Unknown",
      "stanceEvidence": { "basis": "<why we believe this stance>", "confidence": "Verified|Inferred|Assumption" },
      "theirLossAversion": "<the economic fear driving their stance>",
      "recykalLeverage": "<the specific Recykal/Retearn capability that addresses it — name the product>",
      "whatToSecure": "<the concrete instrument/agreement needed from them>",
      "concession": "<what Recykal offers to win them over>",
      "priority": "P0|P1|P2",
      "nextAction": "<concrete next outreach step, with timing>"
    }
  ],
  "champions": ["<name of champion stakeholder>"],
  "blockers": ["<name of blocker stakeholder>"],
  "engagementSequence": ["<ordered list of stakeholder names by priority>"],
  "assumptions": ["<key assumptions this map rests on>"],
  "dataGaps": ["<what must be confirmed via primary research (interviews/surveys)>"]
}`;

    case 6:
      return `You are the DRS (Deposit Return System) roadmap engine for Recykal.
You are generating STAGE 6 — Resistance Intelligence — for a real implementation plan.

${contextHeader}
${projectData.stage2 ? `GEOGRAPHY EVIDENCE:
- Touchpoint counts database: ${JSON.stringify(projectData.stage2.touchpoints)}` : ''}
${projectData.stage3 ? `MARKET EVIDENCE:
- Stage 3 Opportunity Scores: ${JSON.stringify(projectData.stage3.opportunityScores)}` : ''}
${projectData.stage4 ? `STAKEHOLDER EVIDENCE:
- Stakeholder Blockers: ${JSON.stringify(projectData.stage4.blockers)}` : ''}

YOUR TASK:
Assess resistance across 7 fronts: Government/Regulatory, Retail/Trade, Consumer, Brand, Media, Political, Operational.
Highlight specific friction points in ${targetLocation} (e.g., tourist transience, glass reverse-logistics, retail pushback, lobbyist action) and mitigation plans.

CRITICAL EVALUATION RULES (LOGICAL REASONING ANCHORS):
1. Government / Regulatory Risk:
   - Examine environmental regulations in ${targetLocation}. If there are active deposit/return mandates, packaging recovery targets, or single-use plastic regulations (like the Plastic Waste Management Rules), the Government/Regulatory risk for PET and MLP must be evaluated as HIGH.
2. Retail / Trade Risk:
   - Cross-reference Stage 2 touchpoint counts. If unorganized retail stores (traditional Kiranas/small shops) outnumber organized supermarkets (modern trade) by more than 3:1, the Retail/Trade risk must be evaluated as HIGH across all materials due to acute storage space constraints, cash-flow friction, and manual collection bags logistics.
3. Political / Consumer Risk:
   - Check the regional tourism profile in Stage 2. If the tourism level is HIGH (e.g., Goa, beach/coastal zones, major tourist hubs), consumer risk and political risk must be evaluated as HIGH or MEDIUM because highly transient tourists are less likely to return packaging for a deposit, leading to lobbyist actions by hotel and restaurant associations.

Return ONLY a single valid JSON object (no markdown fences, no prose) with EXACTLY this shape:
{
  "resistanceIndex": {
    "overall": <number between 0 and 100>,
    "materials": {
      ${materials.map((m) => `"${m}": <number between 0 and 100>`).join(',\n      ')}
    }
  },
  "register": [
    {
      "front": "Government / Regulatory|Retail / Trade|Consumer|Brand|Media|Political|Operational",
      "material": "All|Liquor|PET|Cans|MLP",
      "rootCause": "<why they are resisting, e.g. fear of deposit handling cost or lack of space in traditional retail shops>",
      "impact": "<short explanation of impact>",
      "probability": "High|Medium|Low",
      "severity": "High|Medium|Low",
      "mitigation": "<concrete plan to defuse resistance>",
      "owner": "<who leads the mitigation>",
      "status": "Open|Mitigating|Resolved",
      "reviewDate": "2026-07-31"
    }
  ],
  "predictedFutureResistance": [
    {
      "front": "<front>",
      "threat": "<AI predicted future threat>",
      "mitigation": "<pre-emptive action>"
    }
  ]
}`;

    case 7: {
      const level3Name = isNat ? 'Municipality' : (projectData?.stage2?.intel?.geoSchema?.level3 || 'Gram Panchayat');
      const population = projectData?.stage2?.intel?.stateSummary?.population?.value || 1500000;
      
      return `You are the DRS (Deposit Return System) roadmap engine for Recykal.
You are generating STAGE 7 — Narrative & Alignment — acting as a ruthless, highly pragmatic Public Affairs and Economics strategist.

${contextHeader}
${projectData.stage4 ? `STAKEHOLDERS:\n${JSON.stringify(projectData.stage4)}` : ''}

TONE MANDATE:
Do NOT use generic corporate buzzwords like "synergy", "green", "empower", or "eco-friendly". You are speaking to cut-throat local politicians and tired shopkeepers. Be ruthless, economic, and grounded in raw political and financial reality. Frame the narrative around LOSS AVERSION and ECONOMIC THREAT/OPPORTUNITY.

YOUR TASK:
Create the Narrative Core Pillars, Friction Personas, and Hostile Objection Kit to align aggressive stakeholders in ${targetLocation}.

Return ONLY a single valid JSON object (no markdown fences, no prose) with EXACTLY this shape:
{
  "corePillars": {
    "triggerEvent": "The burning platform: Why does ${targetLocation} need DRS right now? (e.g. 'impending landfill collapse' or 'tourist revenue threat due to litter')",
    "economicAnchor": "How does this make or save money for the state/businesses (2 sentences)?",
    "politicalWin": "The exact 'ribbon-cutting' headline local politicians can claim."
  },
  "frictionPersonas": [
    {
      "personaName": "A specific, high-friction opponent (e.g., 'Skeptical Liquor Distributor Union', 'Coastal Shack Owners')",
      "coreFear": "Their underlying loss-aversion trigger (e.g., 'Fear of bearing deposit float costs')",
      "counterNarrative": "The aggressive, economic script to dismantle their fear.",
      "concession": "What the DRS operator is willing to compromise on to win them over (e.g., 'Waive first month scanner fees')."
    }
  ],
  "hostileObjectionKit": [
    {
      "hostileQuestion": "A cynical, difficult question from the media or public (e.g., 'Isn't this just a hidden tax on the poor?')",
      "publicAnswer": "The polished, data-backed PR response.",
      "internalReality": "The actual operational truth the project team must manage behind the scenes."
    }
  ]
}`;
    }

    case 8: {
      const selectedWorkstreamsList = input.selectedWorkstreams || [1, 2, 3, 4, 5, 6, 7];
      const level3Name = isNat ? 'Municipality' : (projectData?.stage2?.intel?.geoSchema?.level3 || 'Gram Panchayat');
      const level2Name = isNat ? 'District' : (projectData?.stage2?.intel?.geoSchema?.level2 || 'Taluka');

      return `You are the DRS (Deposit Return System) roadmap engine for Recykal.
You are generating STAGE 8 — Execution Blueprint — for a real implementation plan.

${contextHeader}
${projectData.stage2 ? `GEOGRAPHY REALITY:\n- Hierarchy: ${JSON.stringify(projectData.stage2.intel?.hierarchy)}` : ''}

YOUR TASK:
Create the master Gantt timeline and workstream objectives for ONLY the following active workstreams requested in Setup:
${selectedWorkstreamsList.map(id => `Workstream ${id}`).join(', ')}.

IMPORTANT REGULATORY TIMELINE RULE:
Since Government & Regulatory alignment is unpredictable and takes several months or years of legislative track, you MUST NOT list it on the Gantt chart timeline (do not add it to the 'timeline' array). Instead, model it as a set of asynchronous "policyGates" that act as pre-requisites for physical and brand operations.

You MUST customize the sequence dynamically:
1. PURE DEPENDENCY EXECUTION: Do NOT generate arbitrary day-counts. Structure the rollout as a sequence of Phases. Each Phase MUST be blocked by a specific Policy Gate.
   - You MUST tailor the Policy Gates to the specific local government bodies of the target location (e.g., specific State Pollution Control Boards in India, EPA in Ireland, IBAMA in Brazil). Do not use generic terms if local equivalents exist in your knowledge base or the Stage 2 data.
2. OPERATIONS STATUS: If operations status is "Brownfield", omit basic greenfield setups (like depot scouting or initial NOC approvals); instead focus on system migration, density scaling, and operational optimizations.
3. CALENDAR AWARENESS: Align phase tasks and milestones with the project calendar months: ${calendarMonths.join(', ')}. Factor in any monsoons, festival congestion (e.g. Diwali, Christmas, New Year), or peak tourism periods detected for those calendar months in ${targetLocation} to adjust collection capacity spikes.

  Return ONLY a single valid JSON object (no markdown fences, no prose) with EXACTLY this shape:
  {
    "blueprintSummary": {
      "currentPhase": "Phase 1 - Planning",
      "criticalPathAlert": "<major blocker on critical path, e.g. Local consent delay is blocking depot setup>"
    },
    "policyGates": [
      {
        "gateId": "GATE-1",
        "name": "Gazette Notification Mandate",
        "requiredFor": "Brand Escrow setup and legal producer enforcement",
        "estimatedRegulatoryTimeline": "6-12 Months (Legislative Track)",
        "status": "Pending Cabinet Clearance"
      },
      {
        "gateId": "GATE-2",
        "name": "Environmental Consent & Local clearances",
        "requiredFor": "Physical Depot setting up and RVM site wiring in the ${level3Name}s",
        "estimatedRegulatoryTimeline": "3-6 Months (Administrative Track)",
        "status": "Awaiting local body validation"
      }
    ],
    "executionSequence": [
      // Sequence of operational phases driven by gates
      {
        "phase": "Phase 1: Foundation & Escrow",
        "blockingGate": "GATE-1 (Gazette Notification Mandate)",
        "activeWorkstreams": ["Brand/Producer & Deposit", "Consumer Awareness (Teaser)"]
      },
      {
        "phase": "Phase 2: Touchpoint & Infrastructure Rollout",
        "blockingGate": "GATE-2 (Environmental Consent & Local clearances)",
        "activeWorkstreams": ["Touchpoint Onboarding", "Infrastructure & RVM Deployment"]
      },
      {
        "phase": "Phase 3: Operations & Scale",
        "blockingGate": "GATE-3 (Operational NOCs from Local Bodies)",
        "activeWorkstreams": ["Operations & Collection", "Launch & Scale", "Consumer Awareness (Full)"]
      }
    ],
    "workstreams": [
      // Provide objectives only for the active workstreams (from IDs 2 to 7):
      {
        "id": 2,
        "name": "Brand/Producer & Deposit",
        "objective": "<objective description>",
        "keyActions": "Establish deposit refund values; Brand participation agreements",
        "owner": "Producer Lead",
        "entryGate": "GATE-1 Gazette Notification",
        "exitGate": "Producer Escrow Capitalized",
        "status": "Not Started"
      },
      {
        "id": 3,
        "name": "Touchpoint Onboarding",
        "objective": "<objective description>",
        "keyActions": "Onboard shacks, bars, and retail touchpoints across all ${level2Name}s",
        "owner": "Onboarding Lead",
        "entryGate": "GATE-2 Environmental Consent",
        "exitGate": "75% of Touchpoints Registered",
        "status": "Not Started"
      },
    {
      "id": 4,
      "name": "Infrastructure & RVM Deployment",
      "objective": "<objective description>",
      "keyActions": "Siting surveys; RVM procurement & shipping; install compactors",
      "owner": "Ops Lead",
      "dependencies": "Touchpoint Onboarding agreements",
      "status": "Not Started"
    },
    {
      "id": 5,
      "name": "Consumer Awareness",
      "objective": "<objective description>",
      "keyActions": "Kiosk setup; beach campaigns; airport tourist signs; local flyers",
      "owner": "Marketing Lead",
      "dependencies": "Infrastructure deployment",
      "status": "Not Started"
    },
    {
      "id": 6,
      "name": "Operations & Collection",
      "objective": "<objective description>",
      "keyActions": "Reverse logistics contract; collection routes; recycler agreements",
      "owner": "Logistics Lead",
      "dependencies": "Infrastructure deployment",
      "status": "Not Started"
    },
    {
      "id": 7,
      "name": "Launch & Scale",
      "objective": "<objective description>",
      "keyActions": "Launch day checklist; go-live monitor; plan expansion rollout",
      "owner": "Project Manager",
      "dependencies": "Operations and collections setup",
      "status": "Not Started"
    }
  ]
}
`;
    }

    case 9: {
      const touchpoints = projectData.stage2?.touchpoints || {};
      const groups = touchpoints.groups || [];
      const retailCount = groups.find(g => g.group.toLowerCase().includes('retail'))?.total || 100;
      const horecaCount = groups.find(g => g.group.toLowerCase().includes('horeca'))?.total || 100;
      const civicCount = groups.find(g => g.group.toLowerCase().includes('collection') || g.group.toLowerCase().includes('civic'))?.total || 10;
      const subDivisionsCount = cascadedDemographics?.subDivisions || projectData.stage2?.intel?.stateSummary?.talukasOrTehsils?.value || 10;
      const selectedWorkstreamsList = input.selectedWorkstreams || [1, 2, 3, 4, 5, 6, 7];
      const isTechSolutions = implementationModel === 'Tech Solutions';
      
      const wsConfigs = {
        1: { id: 1, name: isTechSolutions ? 'Government & Escrow' : 'Government & Regulatory', key: 'regulatoryReadiness' },
        2: { id: 2, name: isTechSolutions ? 'Brand QR & API' : 'Brand/Producer & Deposit', key: 'brandOnboarding' },
        3: { id: 3, name: 'Touchpoint Onboarding', key: 'touchpointOnboarding' },
        4: { id: 4, name: 'Infrastructure & RVM Deployment', key: 'infrastructure' },
        5: { id: 5, name: 'Logistics & Collection', key: 'logistics' },
        6: { id: 6, name: 'Processing & Recycler', key: 'processing' },
        7: { id: 7, name: 'IT & Traceability', key: 'itSystems' }
      };

      return `You are the DRS (Deposit Return System) roadmap engine for Recykal.
You are generating STAGE 9 — Detailed Workstream Execution Plans — for a real implementation plan.

${contextHeader}

YOUR TASK:
Flesh out detailed actions, targets, and actual templates of legal agreements or notifications for ONLY the following active workstreams:
${selectedWorkstreamsList.map(id => `Workstream ${id}`).join(', ')}.

Return a complete phase-wise operational playbook (phase1, phase2, phase3) for each active workstream.
You MUST enforce these geography, count, and terminology overrides:
- Terminology overrides:
  * For Level 1 admin division, you MUST call it "${level1}".
  * For Level 2 admin division, you MUST call it "${level2}".
  * For Level 3 admin division, you MUST call it "${level3}".
- Exact target counts (no placeholders!):
  * Target total ${level2} subdivisions to onboard: exactly ${subDivisionsCount}
  * Target total HORECA sites: exactly ${horecaCount}
  * Target total Retail/General stores: exactly ${retailCount}
  * Target total Collection/Recycling sites: exactly ${civicCount}

Return ONLY a single valid JSON object (no markdown fences, no prose) with EXACTLY this shape (fill in only active workstream fields; return null or empty for inactive ones):
{
  "regulatoryReadiness": {
    "phase1": {
      "target": "Draft representation and secure cabinet approval for ${targetLocation}",
      "actions": ["Consult with SPCB on single-use rules", "Schedule consultation with Excise Commissioner"],
      "generatedDocs": {
        "title": "Excise Representing Proposal Draft",
        "doc": "..."
      }
    },
    "phase2": {
      "target": "Release gazette notification",
      "actions": ["Draft gazette notification text", "Formally publish notification in state gazette"],
      "generatedDocs": {
        "title": "Official State Gazette Draft",
        "doc": "..."
      }
    },
    "phase3": {
      "target": "System audits and regulatory edits",
      "actions": ["Perform monthly compliance audits", "Amend rules based on trade comments"],
      "generatedDocs": {
        "title": "Policy Amendment Draft",
        "doc": "..."
      }
    }
  },
  "brandOnboarding": {
    "phase1": {
      "target": "Engage major brands for materials: ${materials.join(', ')}",
      "actions": ["Host round-table with major packaging producers", "Distribute QR specification templates"],
      "generatedDocs": {
        "title": "Producer Participation Agreement",
        "doc": "..."
      }
    },
    "phase2": {
      "target": "Finalize escrow deposits and packaging specs",
      "actions": ["Finalize barcode lookup registry", "Validate printer test sheets from brands"],
      "generatedDocs": {
        "title": "Packaging QR Printing Specs",
        "doc": "..."
      }
    },
    "phase3": {
      "target": "Audit compliance and process reconciliation",
      "actions": ["Audit producer deposits against sales data", "Resolve brand offset discrepancies"],
      "generatedDocs": {
        "title": "Reconciliation Protocol",
        "doc": "..."
      }
    }
  },
  "touchpointOnboarding": {
    "phase1": {
      "target": "Secure in-principle NOC clearances across all ${subDivisionsCount} ${level2}s",
      "actions": ["Draft NOC templates for local ${level3} councils", "Host town-halls with local merchants"],
      "generatedDocs": {
        "title": "Standard Local Council Consent Request",
        "doc": "..."
      }
    },
    "phase2": {
      "target": "Onboard HORECA (exactly ${horecaCount} sites) and Retail (exactly ${retailCount} sites) partners",
      "actions": ["Conduct site surveys in panchayats", "Sign pickup contracts with beach shacks and bars"],
      "generatedDocs": {
        "title": "HORECA Collection Agreement",
        "doc": "..."
      }
    },
    "phase3": {
      "target": "Performance audit of collection sites",
      "actions": ["Review RVM return data per site", "Optimize collection nodes based on volume"],
      "generatedDocs": {
        "title": "Site Optimization SOP",
        "doc": "..."
      }
    }
  },
  "infrastructure": {
    "phase1": {
      "target": "Map exact sites for the ${civicCount} collection centers",
      "actions": ["Inspect power grid stability at candidate spots", "Confirm network coverage for RVM nodes"],
      "generatedDocs": {
        "title": "Site Inspection Checklist",
        "doc": "..."
      }
    },
    "phase2": {
      "target": "Procure and deploy RVM units at candidate sites",
      "actions": ["Import or manufacture compactors", "Install waterproof shields for outdoor sites"],
      "generatedDocs": {
        "title": "Installation Specification Layout",
        "doc": "..."
      }
    },
    "phase3": {
      "target": "Preventative maintenance program",
      "actions": ["Schedule routine cleaning of sensor optics", "Audit compactor blade wear metrics"],
      "generatedDocs": {
        "title": "Maintenance Schedule SOP",
        "doc": "..."
      }
    }
  },
  "consumerAwareness": {
    "phase1": {
      "target": "Design core campaign assets and consumer FAQs",
      "actions": ["Draft clean-up FAQs", "Design physical signage board art"],
      "generatedDocs": {
        "title": "Signage Copy Sheet",
        "doc": "..."
      }
    },
    "phase2": {
      "target": "Launch BTL campaigns targeting transit and leisure spots",
      "actions": ["Deploy kiosks at tourist airports", "Run roadshows on beaches during peak periods"],
      "generatedDocs": {
        "title": "Tourist Awareness Flyer Copy",
        "doc": "..."
      }
    },
    "phase3": {
      "target": "Sustenance campaigns and local events",
      "actions": ["Launch school plastic collection contests", "Audit awareness levels via surveys"],
      "generatedDocs": {
        "title": "School Collection Program Rules",
        "doc": "..."
      }
    }
  },
  "operations": {
    "phase1": {
      "target": "Logistics bidding and recycler partnerships",
      "actions": ["Draft RFP for transport services", "Engage local authorized recycling companies"],
      "generatedDocs": {
        "title": "Recycler Offtake RFP",
        "doc": "..."
      }
    },
    "phase2": {
      "target": "Go-live pickup and reverse logistics routing",
      "actions": ["Configure route planning software for collectors", "Establish custody logs for drivers"],
      "generatedDocs": {
        "title": "SOP for Container Custody Tracking",
        "doc": "..."
      }
    },
    "phase3": {
      "target": "Process scale and offtake optimization",
      "actions": ["Audit recycler process efficiency", "Negotiate bulk pricing adjustments for material batches"],
      "generatedDocs": {
        "title": "Bulk Offtake Contract Addendum",
        "doc": "..."
      }
    }
  },
  "launchScale": {
    "phase1": {
      "target": "Pre-launch dry runs",
      "actions": ["Simulate RVM drop-offs", "Test UPI payout clearances"],
      "generatedDocs": {
        "title": "Dry Run Checklist",
        "doc": "..."
      }
    },
    "phase2": {
      "target": "Official system launch",
      "actions": ["Host launch event at Miramar Beach with environment minister", "Enable live digital transaction logging"],
      "generatedDocs": {
        "title": "Go-Live Event Guide",
        "doc": "..."
      }
    },
    "phase3": {
      "target": "Statewide scale phase",
      "actions": ["Expand RVM network to remaining subdivisions", "Compile project performance data for next region blueprint"],
      "generatedDocs": {
        "title": "Expansion Strategy Outline",
        "doc": "..."
      }
    }
  }
}`;
    }

    case 10: {
      return `You are the DRS (Deposit Return System) roadmap engine for Recykal.
You are generating STAGE 10 — Launch Readiness (T-Minus Gate) — acting as a strict Project Director.

${contextHeader}
${projectData.stage9 ? `WORKSTREAMS:\n${JSON.stringify(projectData.stage9)}` : ''}

YOUR TASK:
Generate a T-Minus countdown checklist and a strict 'Cardinal Rule' Go/No-Go Gate assessment for launching DRS in ${targetLocation}.

Return ONLY a single valid JSON object (no markdown fences, no prose) with EXACTLY this shape:
{
  "readinessScore": 85,
  "goNoGoStatus": "HOLD",
  "tMinusTracker": [
    {
      "phase": "T-30 Days",
      "milestone": "All core RVMs installed and tested",
      "owner": "Infrastructure",
      "status": "Completed"
    },
    {
      "phase": "T-15 Days",
      "milestone": "Retailer payout escrow funded",
      "owner": "Finance",
      "status": "Pending"
    }
  ],
  "cardinalRuleBlockers": [
    {
      "issue": "Escrow account not finalized",
      "resolutionRequired": "Must be funded before public announcement to guarantee retailer payouts."
    }
  ]
}`;
    }

    case 11: {
      const funnelName = action === 'branding' ? 'Branding (Awareness)' 
                       : action === 'acquisition' ? 'Acquisition (Onboarding)' 
                       : action === 'engagement' ? 'Engagement (Loyalty/Retention)'
                       : 'Branding, Acquisition, and Engagement';
                       
      let funnelJson = '';
      if (action === 'branding') {
        funnelJson = `  "branding": [\n    {\n      "phase": "Day 1-2|Day 3-4|Day 5-6|...",\n      "objective": "<specific micro-objective>",\n      "activity": "<tactical branding task with real location names>",\n      "channel": "OOH / Billboards|Paid Social Ads|PR / Press|Radio Jingle",\n      "targetAudience": "Tourists|Local Residents|Store Owners",\n      "successKpi": "<measurable success metric>"\n    }\n  ]`;
      } else if (action === 'acquisition') {
        funnelJson = `  "acquisition": [\n    {\n      "phase": "Day 1-2|Day 3-4|Day 5-6|...",\n      "objective": "<specific micro-objective>",\n      "activity": "<tactical onboarding/sign-up task with real location names>",\n      "channel": "Direct Field Onboarding|Distributor Referral|Partner Sign-up",\n      "targetAudience": "Beach Shack Owners|Kirana Owners|Liquor Retailers",\n      "successKpi": "<measurable success metric>"\n    }\n  ]`;
      } else if (action === 'engagement') {
        funnelJson = `  "engagement": [\n    {\n      "phase": "Day 1-2|Day 3-4|Day 5-6|...",\n      "objective": "<specific micro-objective>",\n      "activity": "<tactical retention task with reward triggers>",\n      "channel": "WhatsApp Business|App Push Notification|Payout Trigger|Leaderboard Event",\n      "targetAudience": "Onboarded Merchants|App Users|Recycling Consumers",\n      "successKpi": "<measurable success metric>"\n    }\n  ]`;
      } else {
        funnelJson = `  "branding": [\n    {\n      "phase": "Day 1-2|Day 3-4|Day 5-6|...",\n      "objective": "<specific micro-objective>",\n      "activity": "<tactical branding task with real location names>",\n      "channel": "OOH / Billboards|Paid Social Ads|PR / Press|Radio Jingle",\n      "targetAudience": "Tourists|Local Residents|Store Owners",\n      "successKpi": "<measurable success metric>"\n    }\n  ],\n  "acquisition": [\n    {\n      "phase": "Day 1-2|Day 3-4|Day 5-6|...",\n      "objective": "<specific micro-objective>",\n      "activity": "<tactical onboarding/sign-up task with real location names>",\n      "channel": "Direct Field Onboarding|Distributor Referral|Partner Sign-up",\n      "targetAudience": "Beach Shack Owners|Kirana Owners|Liquor Retailers",\n      "successKpi": "<measurable success metric>"\n    }\n  ],\n  "engagement": [\n    {\n      "phase": "Day 1-2|Day 3-4|Day 5-6|...",\n      "objective": "<specific micro-objective>",\n      "activity": "<tactical retention task with reward triggers>",\n      "channel": "WhatsApp Business|App Push Notification|Payout Trigger|Leaderboard Event",\n      "targetAudience": "Onboarded Merchants|App Users|Recycling Consumers",\n      "successKpi": "<measurable success metric>"\n    }\n  ]`;
      }

      return `You are an elite, world-class Director of Marketing and GTM Strategy for Recykal's DRS (Deposit Return System).
You are generating STAGE 11 — GTM Launch & Funnel Execution — acting as a master strategist. Your plan must comprehensively account for all stakeholders (government, consumers, brands, merchants, and recyclers), local constraints, and behavioral psychology to drive mass adoption.

${contextHeader}
${projectData.stage2 ? `GEOGRAPHY EVIDENCE:
- State Summary: ${JSON.stringify(projectData.stage2.intel?.stateSummary)}` : ''}

YOUR TASK:
Create a highly tactical, exhaustive, spreadsheet-style execution schedule specifically for the ${funnelName} funnel.
CRITICAL INSTRUCTION: You MUST generate a completely detailed and exhaustive list of activities. Do NOT take shortcuts, do NOT combine days lazily, and do NOT leave the array empty.
The funnel MUST be broken down into a 2-day micro-schedule (e.g. Day 1-2, Day 3-4, Day 5-6) covering the entire selected target timeline: ${targetTimeline}. 
Customize the activities dynamically:
1. GEOGRAPHY REALISM: Use real-world locations, beach names, commercial zones, or regional agencies in ${targetLocation} (refer to Stage 2 context).
2. MATERIAL CUSTOMIZATION:
   - If "Liquor" or "Glass" is selected, focus Acquisition on taverns, bars, shacks, and excise outlets.
   - If "PET" or "Cans" are selected, target Kiranas, supermarkets, and beach points.
   - If "MLP" is selected, target schools and residential associations.
3. IMPLEMENTATION MODEL CUSTOMIZATION:
   - If "End-to-End DRS" is chosen, focus activities on Recykal collection trucks and hubs.
   - If "RVM-only" is chosen, focus on machine usage training, scanner app testing, and kiosk assistance.
   - If "Tech Solutions" is chosen, focus on onboarding merchant apps, testing QR codes, and API verifications.

Return ONLY a single valid JSON object (no markdown fences, no prose) with EXACTLY this shape:
{
${funnelJson}
}`;
    }

    case 12:
      return `You are the DRS (Deposit Return System) roadmap engine for Recykal.
You are generating STAGE 12 — Engagement & BTL Activation Playbook — for a real implementation plan.

${contextHeader}
${projectData.stage8 ? `TOUCHPOINTS:\n- Onboarded: ${JSON.stringify(projectData.stage8.touchpointOnboarding)}` : ''}

YOUR TASK:
Use Google Search grounding to identify major transit, leisure, community, educational, and gathering spots in ${targetLocation} (e.g., specific airports, main railway stations, tourist beaches, prominent colleges).
Create a highly detailed below-the-line (BTL) activity plan per venue type to drive return behaviour.

You MUST customize the campaigns:
1. CALENDAR ALIGNMENT: Ensure the campaign timing / calendar details (e.g. "Pre-launch W3-W4", "Sustenance Month 1") specify actual actions aligning with the holidays or tourism peaks matching these project months: ${calendarMonths.join(', ')}. E.g., if December is Month 3, schedule airport/beach kiosk promotions for Christmas/New Year tourist waves.
2. OPERATIONAL REALISM: If custom constraints are specified (like rain or power drops), list how campaigns are adjusted.

Return ONLY a single valid JSON object (no markdown fences, no prose) with EXACTLY this shape:
{
  "btlReachScore": {
    "overall": <number between 0 and 100>,
    "talukas": {
      ${materials.map((m) => `"${m}": <number between 0 and 100>`).join(',\n      ')}
    }
  },
  "locations": [
    {
      "name": "<e.g. Dabolim Airport, Panaji Bus Stand, Calangute Beach, Carmel College>",
      "type": "Transit / high-footfall|Tourism / leisure|Community / residential|Education / youth|Civic / institutional",
      "taluka": "<e.g. Bardez|Salcete|Tiswadi>",
      "footfall": "<description of volume, e.g. 15,000 visitors/day>",
      "relevance": "High|Medium|Low",
      "priorityRollout": "Phase 1 - Immediate|Phase 2 - Secondary"
    }
  ],
  "btlActivities": [
    {
      "venueType": "Transit / high-footfall|Tourism / leisure|Community / residential|Education / youth|Civic / institutional",
      "activity": "<description of engagement event/booth>",
      "calendar": "Pre-launch W3-W4|Launch Week|Sustenance Month 1",
      "owner": "BTL Execution Agency",
      "reach": "<e.g. ~10,000 people>",
      "permissions": "<e.g. Airport Authority NOC>",
      "vendor": "Local event vendor",
      "budget": "<e.g. ₹1,50,000>"
    }
  ]
}`;

    case 13:
      return `You are the DRS (Deposit Return System) roadmap engine for Recykal.
You are generating STAGE 13 — Reputation Management — acting as a Crisis Comms Lead.

${contextHeader}

YOUR TASK:
Generate a Service Level Agreement (SLA) threshold matrix and a Rapid Response Playbook for managing public reputation post-launch in ${targetLocation}.

Return ONLY a single valid JSON object (no markdown fences, no prose) with EXACTLY this shape:
{
  "slaThresholds": [
    {
      "incidentType": "Machine Full / Overflowing",
      "slaHours": 4,
      "escalationPath": "Route Supervisor -> Zonal Manager"
    },
    {
      "incidentType": "Delayed Payouts",
      "slaHours": 24,
      "escalationPath": "Finance -> Project Director"
    }
  ],
  "rapidResponseTemplates": [
    {
      "scenario": "Viral social media post about overflowing RVM",
      "draftStatement": "We apologize for the inconvenience. Due to overwhelming positive response, this machine reached capacity faster than expected. A collection team is en route.",
      "channels": ["Twitter/X", "Instagram Comments"]
    }
  ]
}`;

    case 14:
      return `You are the DRS (Deposit Return System) roadmap engine for Recykal.
You are generating STAGE 14 — Performance Framework & Escalation Thresholds — for a real implementation plan.

${contextHeader}
${projectData.stage3 ? `BENCHMARKS:\n- Benchmarks: ${JSON.stringify(projectData.stage3.materials)}` : ''}

YOUR TASK:
Define the complete performance framework including leading indicator targets and lagging targets.
Incorporate the North Star metric (Return Rate) and a DRS Performance Index (0-100 score).

LOCALIZATION RULES:
1. Ensure any regional onboarding KPI (like local bodies or municipalities) matches the localized Level 3 name: "${level3}". Do not use 'Panchayat' or 'Gram Panchayat' if the target location is outside India (e.g. use 'Municipality Onboarding %' or 'City/County Onboarding %' for Ireland).

Return ONLY a single valid JSON object (no markdown fences, no prose) with EXACTLY this shape:
{
  "performanceIndex": {
    "overall": <number between 0 and 100>,
    "materials": {
      ${materials.map((m) => `"${m}": <number between 0 and 100>`).join(',\n      ')}
    }
  },
  "kpis": [
    {
      "name": "Return Rate|Active Participants|Cost per Container|${level3} Onboarding %|RVM Uptime",
      "type": "Leading|Lagging",
      "definition": "<description of KPI>",
      "formula": "<formula code or text>",
      "source": "RVM system logs|Collector logs|Finance audits",
      "cadence": "Daily|Weekly|Monthly",
      "targetLevel": "<value, e.g. 80%>",
      "warningThreshold": "<value, e.g. 60%>",
      "criticalThreshold": "<value, e.g. 40%>",
      "correctiveSOP": "<escalation or corrective action, e.g. Deploy localized BTL street campaigns or review collection frequency>",
      "owner": "Ops Director|Product Team|Financial Auditor"
    }
  ]
}`;

    case 16:
      return `You are a senior Campaign / Strategy Director for Recykal's DRS.
You are generating PRE-PLANNING — the Campaign Brief (Charter) — for ${targetLocation}.

${contextHeader}
${projectData.stage2 ? `GEOGRAPHY INTEL:\n${JSON.stringify(projectData.stage2.intel?.stateSummary || projectData.stage2.intel || {})}` : ''}
${projectData.stage3 ? `MARKET OPPORTUNITY:\n${JSON.stringify(projectData.stage3.opportunityScores || {})}` : ''}
${projectData.stage4 ? `STAKEHOLDERS:\n${JSON.stringify({ champions: projectData.stage4.champions, blockers: projectData.stage4.blockers })}` : ''}
${projectData.stage5 ? `COMPETITORS:\n${JSON.stringify(projectData.stage5.positioningVerdict || '')}` : ''}
${projectData.stage6 ? `RESISTANCE:\n${JSON.stringify(projectData.stage6.register?.slice(0, 5) || [])}` : ''}

YOUR TASK:
Synthesize ALL of the Market Research above into (1) a SWOT snapshot and (2) a first draft of the 7-section Campaign Brief. This brief is the contract the downstream plan must obey — decide WHAT, WHY, FOR WHOM, and WITHIN WHAT LIMITS, never HOW.

RULES:
- Ground every point in the research above. Never fabricate. Where a human decision is needed (real budget, hard dates, leadership mandates), leave a clear prompt like "[Decision needed: ...]" for the human to complete.
- The Ask = the single core message/behaviour. Objectives must be measurable (return rate, merchants, timeline) with the North Star being Return Rate.
- Tie everything to ${targetLocation}, the selected materials, and the "${implementationModel}" model.

Return ONLY a single valid JSON object (no markdown fences, no prose) with EXACTLY this shape:
{
  "swot": {
    "strengths": ["<internal Recykal/Retearn advantage>"],
    "weaknesses": ["<internal gap>"],
    "opportunities": ["<external market opening>"],
    "threats": ["<external risk>"]
  },
  "brief": {
    "situation": "<why this DRS, why here, why now — 2-3 lines from research>",
    "challenge": "<the core problem the campaign must crack>",
    "objectives": "<measurable goals + North Star (Return Rate); mark human targets as [Decision needed]>",
    "audience": "<priority stakeholders + consumer/merchant segments to move first>",
    "ask": "<the single core message/behaviour we want>",
    "scope": "<what this campaign covers and explicitly does NOT cover>",
    "mandatories": "<non-negotiables: budget boundary, hard dates, brand/regulatory guardrails — mark unknowns as [Decision needed]>"
  }
}`;

    case 17:
      return `You are a senior Campaign Planning Director for Recykal's DRS.
You are generating PLANNING — the actionable 360° Campaign Plan — for ${targetLocation}.

${contextHeader}
${projectData.stage16 ? `LOCKED CAMPAIGN BRIEF (obey this):\n${JSON.stringify(projectData.stage16.data?.brief || {})}` : 'NOTE: No campaign brief found — infer objectives from the setup context.'}
${projectData.stage2 ? `GEOGRAPHY:\n${JSON.stringify(projectData.stage2.intel?.stateSummary || {})}` : ''}
${projectData.stage4 ? `STAKEHOLDER PRIORITIES (for target sequencing):\n${JSON.stringify({ champions: projectData.stage4.champions, blockers: projectData.stage4.blockers, stakeholders: (projectData.stage4.stakeholders || []).map((s) => ({ name: s.name, influence: s.influence, stance: s.stance, priority: s.priority })) })}` : ''}
${projectData.stage5 ? `COMPETITIVE POSITION (for the wedge):\n${JSON.stringify({ verdict: projectData.stage5.positioningVerdict, porter: projectData.stage5.porterFiveForces, competitors: (projectData.stage5.competitors || []).map((c) => ({ name: c.name, threat: c.threatLevel })) })}` : ''}

YOUR TASK:
Turn the brief into a STRATEGIC, actionable 360° plan. Lead with the MARKET-ENTRY STRATEGY, then the funnel, then the schedule. Strategy first: how we enter THIS market, and who we win first.

RULES:
- MARKET ENTRY IS THE CORE, and the WHOLE strategy branches on Operations Status = "${operationsStatus}":
  * GREENFIELD (no existing presence) -> build-from-zero: secure the enabling mandate/regulator FIRST, deploy infrastructure, brand from scratch, land 2-3 anchor champions, THEN broaden. Expect a longer ramp and heavier early Branding.
  * BROWNFIELD (we already operate here) -> leverage-and-expand: convert existing partners/assets first, use existing data & relationships, faster Acquisition, emphasize conversion + retention over cold branding.
  Name the real incumbent(s) (e.g. TOMRA) from the competitive data and state our differentiated WEDGE. Derive the target SEQUENCING (Beachhead -> Expand -> Scale) from the P0/P1/P2 stakeholder priorities (win mandate/regulator/anchors before broad public).
- FUNNEL: tag every campaign and content row with its funnel stage (Branding|Acquisition|Engagement), sequenced to serve the entry strategy (e.g. Greenfield early Branding targets mandate-holders + anchors, NOT broad public).
- Everything must serve the brief's objectives and North Star (Return Rate) and stay within its scope + mandatories.
- MOMENTS (3-5): use the calendar months (${calendarMonths.join(', ') || 'the project timeline'}) to find real festivals/seasons/events in ${targetLocation}. Ground them; do not invent.
- CONTENT CALENDAR: 8-12 rows MAX covering the key weeks. Each row is an atomic task; keep "hook"/"objective" to one short line; assign a realistic executor; include at least 2 on-ground/BTL rows (executor "BTL Agency (human)"). Tie to materials (${materials.join(', ')}) and the "${implementationModel}" model.
- NARRATIVE: from the brief's "Ask" — 3 pillars, 2-3 personas, 2-3 objections, one line each.
- CAMPAIGN CALENDAR: 3-6 campaigns. Keep the ENTIRE JSON compact so it is never truncated. Never fabricate metrics; where a human number is needed, write [Decision needed].

Return ONLY a single valid JSON object (no markdown fences, no prose) with EXACTLY this shape:
{
  "marketEntry": {
    "operationsBasis": "Greenfield|Brownfield",
    "posture": "<how we enter given the market, incumbents, and greenfield/brownfield — 2 lines>",
    "differentiation": "<our wedge vs the named incumbent(s), grounded in the competitive data>",
    "targetSequencing": [
      { "phase": "Beachhead", "target": "<who we win FIRST>", "why": "<why them first>", "secure": "<what we need from them>" },
      { "phase": "Expand", "target": "<next>", "why": "<why>", "secure": "<what>" },
      { "phase": "Scale", "target": "<broad>", "why": "<why>", "secure": "<what>" }
    ],
    "implications": "<honest trade-offs of the ${operationsStatus} choice — ramp time, where spend goes, key risk>"
  },
  "funnelStrategy": {
    "branding": { "objective": "<awareness goal>", "channels": "<primary channels>", "keyMessage": "<one line>", "kpi": "<metric>" },
    "acquisition": { "objective": "<sign-up / first-return goal>", "channels": "<primary channels>", "keyMessage": "<one line>", "kpi": "<metric>" },
    "engagement": { "objective": "<retention / loyalty goal>", "channels": "<primary channels>", "keyMessage": "<one line>", "kpi": "<metric>" }
  },
  "moments": [
    { "moment": "<festival/season/event>", "dates": "<when>", "why": "<why it matters for DRS here>", "angle": "<how to capitalize>" }
  ],
  "campaignCalendar": [
    { "campaign": "<name>", "funnel": "Branding|Acquisition|Engagement", "objective": "<from the brief>", "window": "<dates/phase>", "audience": "<who>", "channels": "<e.g. Social, WhatsApp, BTL, PR, Ads>", "moment": "<moment it rides>", "kpi": "<measurable KPI>" }
  ],
  "contentCalendar": [
    { "week": "<e.g. Wk 1 (Oct 1-7)>", "campaign": "<parent campaign>", "funnel": "Branding|Acquisition|Engagement", "channel": "<Social|WhatsApp|Email|Ads|BTL|PR>", "format": "<reel/post/broadcast/booth/op-ed>", "hook": "<message/festival tie-in>", "objective": "<awareness|acquisition|engagement|returns>", "audience": "<who>", "owner": "<accountable role>", "executor": "Social bot|WhatsApp bot|Ad Campaign Runner|BTL Agency (human)|PR (human)" }
  ],
  "narrative": {
    "corePillars": ["<3 core message pillars grounded in the brief's Ask>"],
    "frictionPersonas": [ { "persona": "<who resists>", "fear": "<their loss-aversion>", "counter": "<the counter-message>" } ],
    "objectionKit": [ { "objection": "<hostile question>", "response": "<the answer>" } ]
  }
}`;

    case 15:
      return `You are the DRS (Deposit Return System) roadmap engine for Recykal.
You are generating STAGE 15 — Knowledge / Reusable Blueprint — for a real implementation plan.

${contextHeader}
${projectData.stage2 ? `GEOGRAPHY:\n- State: ${projectData.stage2.input?.state}` : ''}
${projectData.stage8 ? `EXECUTION:\n- Documents: ${JSON.stringify(projectData.stage8.regulatoryReadiness?.enablers?.[0]?.generatedDocs)}` : ''}

YOUR TASK:
Consolidate the completed roadmap into a Reusable Geography Blueprint playbook and outline best practices / lessons learned from configuring ${targetLocation}.

Return ONLY a single valid JSON object (no markdown fences, no prose) with EXACTLY this shape:
{
  "blueprintCompleteness": <number between 0 and 100>,
  "playbook": {
    "evidence": "<1-2 paragraphs summarizing the market evidence gathered>",
    "narrative": "<1-2 paragraphs of the core execution narrative for ${targetLocation}>",
    "lessons": "<3 key lessons learned regarding public and government resistance>",
    "bestPractices": "<3 operational best practices for deploying RVMs and pickup logistics in high-tourism zones>"
  }
}`;

  }
}

export function buildStage6SearchPrompt(input, projectData = {}) {
  const {
    country = 'India',
    state = '',
    materials = ['Liquor', 'MLP', 'Cans', 'PET']
  } = input;

  const isNat = !state || state.toLowerCase() === 'national' || state.toLowerCase().includes('whole country');
  const targetLocation = isNat ? country : state;

  return `You are the DRS (Deposit Return System) roadmap engine for Recykal.
You are performing web search research for STAGE 6 — Resistance Intelligence — in "${targetLocation}".

YOUR TASK:
Perform a web search to find actual active local issues, regulatory friction points, and political resistance for deploying a DRS in "${targetLocation}" for: ${materials.join(', ')}.
Specifically research local news, government filings, and trade association press releases regarding:
1. Government/Regulatory: Local excise regulations (e.g. Excise Department constraints on liquor bottles) and plastic waste regulations (e.g. Pollution Control Board fines or deposit/recovery targets on PET and MLP).
2. Retail/Trade: Local shopkeeper/merchant association protests against empty container storage space and deposit handling costs.
3. Consumer: Tourist behavior, compliance resistance in returning bottles, and public litter habits.
4. Brand: Beverage producer pushback against deposit float costs and label/QR compliance costs for the deposit scheme.
5. Media: Local environmental activist campaigns, beach or city litter reports, and press coverage.
6. Political: Lobbying by tourist associations, restaurant lobbies, and municipal council discussions.
7. Operational: Waste picker (kabadiwala) concerns over losing high-value scrap materials to automated RVMs.

[CRITICAL TIME-SAVING RULE]
To prevent server timeouts, you MUST limit your Google Search grounding to a MAXIMUM of 3 combined queries. Group multiple topics together in a single query (e.g. search "DRS regulations AND retailer pushback AND recycling protests in ${targetLocation}"). Do not perform 7 separate searches.

Write a structured, factual report detailing the specific issues you found on these 7 fronts in "${targetLocation}", listing the actual organizations involved and citing your sources.`;
}

export function buildStage6FinalizePrompt(input, searchReport, projectData = {}) {
  const {
    country = 'India',
    state = '',
    materials = ['Liquor', 'MLP', 'Cans', 'PET'],
    objective = '',
    operationsStatus = 'Greenfield',
    targetTimeline = '180 Days'
  } = input;

  const isNat = !state || state.toLowerCase() === 'national' || state.toLowerCase().includes('whole country');
  const targetLocation = isNat ? country : state;

  const tpSummary = projectData.stage2?.touchpoints?.groups
    ? projectData.stage2.touchpoints.groups.map((g) => `- ${g.group}: ${g.total} (${g.subtypes.map((s) => `${s.label} ${s.count}`).join(', ')})`).join('\n')
    : '';

  return `You are the DRS (Deposit Return System) roadmap engine for Recykal.
You are finalizing STAGE 6 — Resistance Intelligence — for a real implementation plan in "${targetLocation}".

CONTEXT:
- Country: ${country}
- State: ${state}
- Implementation model: ${input.implementationModel}
- Materials: ${materials.join(', ')}

TOUCHPOINT PROFILE FROM STAGE 2:
${tpSummary}
- Total Touchpoints: ${projectData.stage2?.touchpoints?.universeTotal || 0}

FACTUAL SEARCH REPORT GATHERED:
---
${searchReport}
---

YOUR TASK:
Compile the finalized resistance index, risk register, predicted threats, and a PESTLE macro-environment scan (the "so what" context behind the register).
You must follow these strict logical reasoning rules to assign the SEVERITY ("High"|"Medium"|"Low") of each front:

1. Government / Regulatory Front:
   - Examine the search report. If the target region has active packaging waste rules, deposit/return mandates, or strict liquor licensing controls, evaluate Government/Regulatory severity as HIGH for those materials (especially PET, MLP, and Liquor).
2. Retail / Trade Front:
   - If traditional/unorganized shops dominate the Stage 2 touchpoints, evaluate Retail/Trade severity as HIGH for all materials because small outlets lack storage space and reverse-logistics infrastructure.
3. Consumer / Political Front:
   - If the region is tourist-heavy, evaluate Consumer and Political severity as HIGH or MEDIUM because transient tourists create high deposit leakage and local hotel/bar associations lobby against deposit administration.

Return ONLY a single valid JSON object (no markdown fences, no prose) with EXACTLY this structure:
{
  "resistanceIndex": {
    "overall": <number between 0 and 100>,
    "materials": {
      ${materials.map((m) => `"${m}": <number between 0 and 100>`).join(',\n      ')}
    }
  },
  "register": [
    {
      "front": "Government / Regulatory|Retail / Trade|Consumer|Brand|Media|Political|Operational",
      "material": "All|Liquor|PET|Cans|MLP",
      "rootCause": "<why they are resisting, e.g. lack of space in traditional shops or compliance fees>",
      "impact": "<short explanation of impact>",
      "probability": "High|Medium|Low",
      "severity": "High|Medium|Low",
      "mitigation": "<concrete plan to defuse resistance>",
      "owner": "<who leads the mitigation>",
      "status": "Open|Mitigating|Resolved",
      "reviewDate": "2026-07-31"
    }
    // Make sure you output one entry for each of the 7 fronts for a complete Heat Map!
  ],
  "predictedFutureResistance": [
    {
      "front": "<front>",
      "threat": "<AI predicted future threat>",
      "mitigation": "<pre-emptive action>"
    }
  ],
  "pestle": {
    "political": "<macro political factors for DRS in ${targetLocation} — govt appetite, mandates, election cycles>",
    "economic": "<deposit value sensitivity, retailer/producer cost, funding, tourism/seasonality>",
    "social": "<consumer attitudes, transient populations, informal-sector livelihoods, litter sentiment>",
    "technological": "<payment/UPI penetration, QR/computer-vision viability, connectivity gaps>",
    "legal": "<packaging-waste rules, deposit-scheme law, excise/licensing regulations>",
    "environmental": "<litter/marine plastic, seasonal/monsoon logistics, material recovery differences>"
  }
}`;
}

