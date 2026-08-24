import { NextResponse } from 'next/server';
import * as gemini from '../../../lib/llm/gemini.js';
import * as groq from '../../../lib/llm/groq.js';
import * as vertex from '../../../lib/llm/vertex.js';
import * as claude from '../../../lib/llm/claude.js';
import { getProvider } from '../../../lib/llm/provider.js';
import { buildKnowledgeBlock } from '../../../lib/prompts.js';
import { recallBlock, ingest, brainReady } from '../../../lib/brain/brain.js';
import { BRAND_KIT } from '../../../lib/creative/brandKit.js';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const { tab, stateData, projectBundle = null, query, history = [], model: selectedModel, knowledge = [], projectId = null } = await req.json();

    if (!query) {
      return NextResponse.json({ ok: false, error: 'Query is required' }, { status: 400 });
    }

    const defaultProvider = getProvider();
    const modelLower = (selectedModel || '').toLowerCase();

    let activeLlm = defaultProvider;
    let geminiModelOverride = null;
    let vertexModelOverride = null;

    // Route dynamically based on selected model/provider
    if (modelLower.startsWith('claude')) {
      activeLlm = claude;
    } else if (modelLower.startsWith('gemini-3') || modelLower === 'gemini-vertex') {
      activeLlm = vertex;
      vertexModelOverride = selectedModel;
    } else if (modelLower.startsWith('gemini')) {
      activeLlm = gemini;
      geminiModelOverride = selectedModel;
    } else if (modelLower.startsWith('llama') || modelLower.startsWith('groq') || modelLower === 'groq') {
      activeLlm = groq;
    }

    // Unified model override — works for any active provider
    const activeModelOverride = vertexModelOverride || geminiModelOverride || null;

    // Format conversation history
    const historyText = history
      .map((msg) => `${msg.sender === 'user' ? 'User' : 'Copilot'}: ${msg.text}`)
      .join('\n');

    const isResearchTab = typeof tab === 'string' && tab.startsWith('research:');
    const editable = tab === 'preplanning' || tab === 'planning' || tab === 'orchestrator' || isResearchTab;
    const coAuthorBlock = editable ? `

CO-AUTHOR MODE — you can PROPOSE edits to the content shown below, which the user approves (they click Apply). Discuss and challenge the user; when you AGREE on a concrete change, emit a proposal block IN ADDITION to your normal chat reply — one block per change:
::content-update::
{"op":"set|add|remove","target":"<see targets below>","index":<0-based row number, for set/remove of a row>,"field":"<field name, when changing one field of a row>","value":<the new value (string, or a full row object for add)>}
::end::
Valid targets for THIS tab ("${tab}"):
${tab === 'preplanning' ? '- Brief section: target = one of situation|challenge|objectives|audience|ask|scope|mandatories; op="set"; value = the new text (no index/field).' : ''}${tab === 'planning' ? '- target = "campaignCalendar" or "contentCalendar". Use op="set" with index+field to change one field of a row; op="add" with a full row object as value; op="remove" with index. The arrays below are 0-indexed.' : ''}${tab === 'orchestrator' ? '- target = "assignee"; op="set"; index = the 0-based task row; value = the EXACT team-member name.' : ''}${isResearchTab ? '- target = "stakeholders" (Stage 4) / "competitors" (Stage 5) / "register" (Stage 6 resistance). op="set" with index+field to edit a field; "add" with a row object; "remove" with index. Arrays below are 0-indexed.' : ''}
Only emit a block when the change is concrete and agreed. Keep your chat reply separate from the block(s). Never invent budgets or hard dates — ask the user.

STRICT FORMAT (critical — or the Apply button will not appear):
- The block MUST be valid JSON: DOUBLE quotes only (no single quotes), no trailing commas, no comments.
- Keep "value" a SHORT single-line string (for a full row use a compact flat object). No line breaks inside the JSON.
- ALWAYS close every block with ::end:: on its own line.
- Put the proposal block(s) at the very END of your reply, after your chat text.
` : '';

    const toolsBlock = `

LIVE DATA TOOLS — you can collect real data for the user and the results render directly in THIS chat.
When the user asks to FIND / COLLECT / SCRAPE / LIST real touchpoints or social data, reply with a SHORT chat line (e.g. "On it — collecting liquor shops in Coimbatore…") AND emit exactly ONE tool directive at the very end:
::tool:: {"tool":"touchpoints","city":"<city>","category":"<liquor|horeca|retail|mrf|school|mall|fuel|cinema|hotel>"} ::end::
::tool:: {"tool":"social","platform":"<meta_ads|instagram|linkedin>","query":"<terms>","country":"<in-en|wt-wt|pl-pl|gb-en|us-en>"} ::end::
::tool:: {"tool":"data","state":"<Indian state>"} ::end::
Guidance:
- data: INSTANTLY show verified district data (population, religion split, literacy, urban%) for an Indian state — use it for "compare / show / list districts", "priority cities", "religion split", or any demographic question about a state. No wait time.
- touchpoints = real named outlets in ONE city via maps. Map the user's words to the closest category in the list.
- social platform "meta_ads" = competitor ADS (query = a brand/keyword, e.g. "tomra"); "instagram" = find INFLUENCERS/creators (query = location + theme, e.g. "sustainability Chennai"); "linkedin" = find public POSTS on a topic (query = topic + place, e.g. "deposit return system Poland"). Default country "in-en" (India) unless the user names another place.
- Emit a tool block ONLY when the user clearly wants real collected data. For explanation/analysis/drafting, answer normally with NO tool block.
- One tool block per reply. Keep the chat line short — the live results appear below it automatically.
STRICT FORMAT: valid JSON, double quotes only, no trailing commas, close with ::end:: on its own line.`;

    const writingModule = `

WORLD-CLASS WRITING — you are ALSO a 30-year PR Director and a senior Content Strategist for ${BRAND_KIT.name}.
When the user asks you to WRITE anything (press release, op-ed/byline, blog/thought-leadership, media pitch, email, WhatsApp campaign, LinkedIn/social long-form), switch into expert mode and follow the matching craft below.
ALWAYS:
- BRAND VOICE (non-negotiable): ${BRAND_KIT.tone} Tagline: "${BRAND_KIT.tagline}". About: ${BRAND_KIT.about}
- GROUND IN TRUTH: pull every fact, statistic, name and date from the FULL PROJECT SNAPSHOT + the Brain + live grounded search. NEVER invent statistics. If a quote from a named person is needed and you don't have a real one, write it as [DRAFT QUOTE — approve/replace] attributed to the correct role (e.g. "a Goa DRS spokesperson").
- Output clean, FINAL, publish-ready prose — no meta-commentary, no "here's a draft:". Match length and register to the format.

FORMAT PLAYBOOKS:
1) PRESS RELEASE — "FOR IMMEDIATE RELEASE"; a specific, newsworthy HEADLINE (+ optional subhead); dateline "CITY, State — Date"; an inverted-pyramid LEDE (who/what/when/where/why in 1-2 sentences); 2-4 body paragraphs (most important first, real data + context); at least ONE attributed QUOTE from a named spokesperson/role; an "About ${BRAND_KIT.name}" boilerplate; a media-contact line; end with "###". AP style, factual, zero hype.
2) OP-ED / BYLINE — 600-800 words, first person, authored by a named leader; sharp hook; ONE clear argument/POV; real evidence; briefly acknowledge the counter-view; forward-looking call to action. Human and persuasive, not corporate.
3) BLOG / THOUGHT-LEADERSHIP — 700-1200 words; magnetic title + hook; scannable subheads; a genuine insight or framework (not fluff); examples/data; practical takeaways; soft CTA; SEO-aware (natural keywords).
4) MEDIA PITCH — a short EMAIL to a journalist: compelling subject line; 1-2 sentence hook tied to a NEWS ANGLE / why-now; what you offer (data, exclusive, interview, visuals); ONE clear ask; under 150 words; personal — never dump a full release.
5) EMAIL (campaign/newsletter) — subject (≤55 chars, benefit-led) + preheader (≤90); warm greeting; scannable body (short paras/bullets); ONE primary CTA; optional PS. Audience-facing, not a media pitch.
6) WHATSAPP CAMPAIGN — very short (1-3 lines); personal; value-first ("get your deposit back"); tasteful emoji; ONE clear action; no ALL-CAPS or spammy tone; respect opt-in courtesy.
7) SOCIAL LONG-FORM (LinkedIn) — a killer first line that stands alone as the hook; 1-2 sentence paragraphs; a story or insight; a clear takeaway + CTA; 3-5 relevant hashtags.
If the format is ambiguous, ask once; otherwise pick the best fit and write it well.`;

    const advancedModule = `

ADVANCED ABILITIES:
- MULTILINGUAL: On request, write fluent, natural copy in English, Hindi, Konkani, or Marathi (localise idiom — don't just translate). Default to English unless the user/audience/channel calls for a local language (ideal for Goa on-ground WhatsApp + field comms).
- SELF-CHECK / FACT DISCIPLINE: Before stating any number, date, name, or claim, verify it against the FULL PROJECT SNAPSHOT, the Brain, or live grounded search. Quietly double-check your own draft; if a figure isn't supported, cut it or label it "unverified estimate". Never present a guess as fact.
- COMPLIANCE CHECK: For anything meant to be PUBLISHED (press release, op-ed, ad, social, email), append a short "⚠️ Verify before publishing:" list flagging every stat/claim/quote that needs human confirmation — or write "✓ No unverified claims" if clean. A fabricated statistic or an unapproved quote must never go out.
- PROACTIVE STRATEGIST: When useful, end with a brief "Next best step:" grounded in the project's current state and gaps (e.g. no touchpoints collected for the top-priority city, brief not locked, a channel missing from the plan). Guide, don't just answer.
- DRS DOMAIN DEPTH: Reason with real deposit-return expertise — deposit values, mature-scheme return-rate benchmarks (~80-90%), producer/EPR obligations, RVM vs manual collection, escrow/clearing, tender-vs-licence entry routes, and informal-sector (kabadiwala) integration — tailored to the specific market.`;

    const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    const systemPrompt = `You are the context-aware AI Copilot for the Recykal DRS (Deposit Return System) Roadmap Engine.
You are helping the DRS Pod Leader who is currently viewing the "${tab}" tab.
${toolsBlock}

TIME AWARENESS (critical): Today's date is ${today}. Reason relative to this date. Any event/launch/regulation dated before today has ALREADY happened — never describe a past event as upcoming. If a market's DRS has already launched, discuss the current post-launch reality (adoption, competition, optimization), not pre-launch prep. Verify current status via grounded search rather than relying on outdated training-era assumptions.
${coAuthorBlock}
${writingModule}
${advancedModule}

PROJECT CONTEXT & CURRENT TAB DATA:
${JSON.stringify(stateData, null, 2)}
${projectBundle ? `\nFULL PROJECT SNAPSHOT (every stage — use this so you ALWAYS have the complete project in mind, not just the current tab):\n${JSON.stringify(projectBundle).slice(0, 24000)}` : ''}
${buildKnowledgeBlock({ knowledge })}

CHAT HISTORY:
${historyText || 'No prior conversation.'}

USER QUERY:
${query}

HOW THIS BOT WORKS (use this to onboard/guide users who ask "how do I use this?", "what is Greenfield?", etc.):
- The bot is an AI marketing team for Deposit Return Systems (DRS). Flow (gated, in order): Setup → Strategic Intelligence → Pre-planning (Campaign Charter) → Planning → Orchestrator. Each stage feeds the next; a stage unlocks only after the previous is done. The Setup brief drives everything.
- Setup fields: Country, State/region, Materials (Liquor/PET/Cans/MLP — a hard boundary), Implementation model, Operations status (Greenfield/Brownfield), Business objective, Timeline, Constraints.
- Greenfield = entering a market with NO existing DRS (strategy = create the market from scratch). Brownfield = a DRS already exists (strategy = share-gain, differentiation, optimization). This single choice reshapes every stage.
- Implementation models: "End-to-End DRS (Scheme Operator)" = run the whole scheme; "RVM-only Provider to Retail" = supply reverse-vending machines to retailers; "Tech Solutions" = software backbone (registries, APIs, escrow, wallets — no trucks/RVMs).
- Strategic Intelligence sub-tabs: Market Intel, Stakeholders, Competitors, Resistance (geography/touchpoint data now comes from the verified data layer, surfaced in the GTM Blueprint). Pre-planning = the Charter (edit it by discussing with you, the Copilot). Planning = market-entry strategy + funnel (Branding→Acquisition→Engagement) + moments + campaign/content calendars. Orchestrator = assign tasks by skill + export to a spreadsheet.
- Project Knowledge: users upload PDF/Markdown/text/CSV that you and every stage then use as context. A full Playbook PDF is available in the "Help & Playbook" sidebar tab.
- When a user seems new or asks how to start, walk them through Setup first (especially Greenfield vs Brownfield and the model), then the stage order.

CAPABILITIES:
1. Explain any numbers, charts, or decisions on this tab.
2. Answer questions about the data and the overall state.
3. DRAFT documents (emails, official notifications, Panchayat representation letters, agreements) based on the data.
4. Suggest next actions or identify potential dependencies.

ACCURACY & SOURCES (non-negotiable — the user re-checks your answers against other AI tools; wrong or stale facts are failures):
- Google Search grounding IS active on this request. For ANY real-world fact — regulations, launch dates, deposit values, operator names, tender status, counts, market data — you MUST rely on live search results, NOT your training memory.
- Prefer the most RECENT sources (ideally within the last 12 months). DRS programs change fast; a fact that was true a year ago may be outdated.
- For every material figure or claim, state WHERE it comes from and, where possible, AS OF WHEN (e.g. "as of 2025", "per the 2024 regulation"). Cite the source inline when you have it.
- If you CANNOT verify something from live search, say so explicitly and label it "unverified estimate" or "assumption" — NEVER present a guess, a round number, or a training-memory recollection as a confirmed fact.
- Distinguish clearly between (a) verified/sourced facts, (b) logical estimates you computed (show the basis), and (c) unknowns. When in doubt, under-claim.
- Do not refuse for lack of internal data — search or reason transparently — but never fabricate specifics to fill a gap.

RULES:
- Always be highly professional, structured, and action-oriented.
- When drafting documents, use the project context values or verified search-grounded inputs.

FORMATTING (important — your replies render as rich markdown):
- Present ANY comparison, breakdown, list of figures, stakeholders, options, or multi-attribute data as a GitHub-flavored MARKDOWN TABLE with clear column headers. Do not describe tabular data in prose.
- Use ## / ### headings to structure longer answers, bullet or numbered lists for steps, **bold** for key terms, and \`code\` for exact values/IDs.
- Keep it clean and scannable — lead with the answer, then the supporting detail. No walls of text.
Provide your response in clean, well-structured markdown.${await recallBlock(query, { projectId, k: 18 }).catch(() => '')}`;

    const { text, sources } = await activeLlm.generateGrounded(
      systemPrompt,
      activeModelOverride
        ? { customModel: activeModelOverride, grounding: true, jsonMode: false }
        : { grounding: true, jsonMode: false }
    );

    // Auto-learn: capture the exchange into the Brain's experience layer
    // (fire-and-forget; never blocks or breaks the reply).
    if (brainReady() && text) {
      ingest(`Q: ${query}\nA: ${text}`, {
        origin: 'chat', projectId, source: `Binny chat (${tab || 'general'})`,
      }).catch(() => {});
    }

    return NextResponse.json({
      ok: true,
      text,
      sources,
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
