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

  return `You are the DRS (Deposit Return System) competitor analyst engine for Recykal.
You are generating STAGE 5 — Competitor Analysis & Market Positioning — for a real implementation plan.

CONTEXT:
- Country: ${country}
- Target Location: ${targetLocation}
- Implementation model: ${implementationModel}
- Materials: ${materials.join(', ')}
- Business objective: ${objective}
${nonIndiaWarning}

YOUR TASK:
Using the search reports provided, identify exactly 5 real competitor entities operating in or entering the market of ${country} (e.g., TOMRA, Sensoneo, Envipco, Karo Sambhav, Kabadiwalla Connect, Plastic Bank, rePurpose, or local waste-tech/EPR firms depending on the country).

For each of the 5 competitors, you must provide:
1. "name": The actual company or platform name.
2. "type": (e.g., "Global DRS & RVM Giant", "Digital EPR/PRO platform", "Informal waste digitization SaaS", "Circular offset platform").
3. "marketShare": A descriptive scale (e.g., "High (Global Leader)", "Medium (Active locally)", "Low (Emerging pilot)").
4. "techCapability": (e.g., "Hardware-locked RVM networks", "Traceability APIs & wallets", "Manual scrap tracing ERPs").
5. "strengths": A summary of their competitive advantage.
6. "weaknesses": A summary of their core vulnerability.
7. "threatLevel": "High" | "Medium" | "Low" (relative to Recykal).
8. "recykalMoatStrategy": A specific, actionable technological or operational moat strategy for Recykal to outcompete or integrate this competitor (e.g., offering hardware-agnostic SaaS, instant UPI payouts, or preferred feedstock supply contracts).

Return ONLY a single valid JSON object (no markdown fences, no prose) matching exactly this schema structure:
{
  "competitors": [
    {
      "name": "Competitor 1",
      "type": "...",
      "marketShare": "...",
      "techCapability": "...",
      "strengths": "...",
      "weaknesses": "...",
      "threatLevel": "High|Medium|Low",
      "recykalMoatStrategy": "..."
    }
    // Repeat for exactly 5 competitors
  ]
}
`;
}
