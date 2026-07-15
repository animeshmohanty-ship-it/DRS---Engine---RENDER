export function buildCompetitorsPrompt(input) {
  const {
    country = 'India',
    state = '',
    implementationModel = 'End-to-End DRS (Scheme Operator)',
    materials = ['Liquor', 'MLP', 'Cans', 'PET'],
    objective = '',
  } = input;

  const isNat = !state || state.toLowerCase() === 'national' || state.toLowerCase().includes('whole country');
  const targetLocation = isNat ? country : `${state}, ${country}`;

  const nonIndiaWarning = country.toLowerCase() !== 'india' ? `
CRITICAL GEOGRAPHIC COMPLIANCE WARNING:
- The target country is ${country} (NOT India).
- You MUST NOT use Indian competitors (like 'Karo Sambhav' or 'Kabadiwalla Connect') if they are not active in ${country}.
- Identify REAL competitors active in or entering ${country} (e.g., for European countries like Romania, identify local or continental entities like RetuRO, Sensoneo, local recycling unions, etc.).
- Ensure the 'recykalMoatStrategy' does not recommend 'UPI payouts' in non-Indian regions (recommend card refunds, bank wires, or standard mobile wallet transfers).
` : '';

  return `You are a senior Competitive Intelligence analyst for Recykal's DRS, benchmarking against both rivals and world-class scheme performance.
You are generating STAGE 5 — Competitor Analysis & Market Positioning — for a real implementation plan.

CONTEXT:
- Country: ${country}
- Target Location: ${targetLocation}
- Implementation model: ${implementationModel}
- Materials: ${materials.join(', ')}
- Business objective: ${objective}
${nonIndiaWarning}

RECYKAL / RETEARN CAPABILITY (the basis of the moat — name the actual product):
- Retearn (Recykal's tech arm): reklaim Pro / reklaim Mini return units, QR-based tracking, computer-vision material ID, a digital Deposit Refund System, merchant apps.
- Recykal: nationwide collection/aggregation network + informal-sector integration + EPR/traceability.

YOUR TASK:
Using the search reports provided, deliver a competitive picture with THREE parts: (a) 5 direct competitors, (b) world-class benchmark schemes that set the performance bar, and (c) the no-DRS baseline the market sits at today.

RIGOR (mandatory):
- NEVER fabricate figures. Every market-share and return-rate number must be labelled "(verified)", "(approximate — verify)", or given as an explicit reasoned estimate. If unknown, say "unknown".
- Identify exactly 5 real competitor entities operating in or entering ${country} (e.g., TOMRA, Sensoneo, Envipco, Karo Sambhav, Kabadiwalla Connect, Plastic Bank, or local waste-tech/EPR firms as relevant).
- Frame every recykalMoatStrategy around an ACTUAL Recykal/Retearn capability (name reklaim, QR tracking, or informal-network integration) — not a generic "SaaS".
- BRIEF ADHERENCE: Focus the analysis on the selected materials (${materials.join(', ')}) and on competitors relevant to the "${implementationModel}" model${objective ? `; keep it anchored to the business objective: "${objective}"` : ''}.

Return ONLY a single valid JSON object (no markdown fences, no prose) matching exactly this schema structure:
{
  "positioningVerdict": "<2-3 lines: where Recykal realistically stands and what it should compete on>",
  "competitors": [
    {
      "name": "<actual company/platform name>",
      "type": "<e.g. Global DRS & RVM incumbent, Digital EPR/PRO platform, Informal-waste digitization SaaS>",
      "presenceInMarket": "<Live | Entering | No local presence — in ${targetLocation}>",
      "marketShare": { "global": "<estimate + confidence>", "local": "<estimate + confidence>" },
      "techCapability": "<their core technology model>",
      "returnRatePerformance": "<if they operate a scheme, its return rate (approx — verify); else 'n/a'>",
      "strengths": "<their competitive advantage>",
      "weaknesses": "<their core vulnerability>",
      "threatLevel": "High|Medium|Low",
      "recykalMoatStrategy": "<specific moat naming a real Recykal/Retearn capability>"
    }
    // exactly 5 competitors
  ],
  "benchmarkSchemes": [
    { "scheme": "<mature high-performing scheme, e.g. Germany DPG, Lithuania>", "returnRate": "<approx % — verify>", "lesson": "<what Recykal should learn/apply>" }
    // 2-3 benchmark schemes
  ],
  "baselineNoDRS": "<current beverage-container recovery rate in ${targetLocation} without DRS — the floor DRS must beat, labelled as estimate>",
  "dataGaps": ["<figures that remain unverified and need primary sourcing>"]
}
`;
}
