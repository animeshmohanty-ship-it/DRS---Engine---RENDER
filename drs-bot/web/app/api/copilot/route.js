import { NextResponse } from 'next/server';
import * as gemini from '../../../lib/llm/gemini.js';
import * as groq from '../../../lib/llm/groq.js';
import * as vertex from '../../../lib/llm/vertex.js';
import * as claude from '../../../lib/llm/claude.js';
import { getProvider } from '../../../lib/llm/provider.js';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const { tab, stateData, query, history = [], model: selectedModel } = await req.json();

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
` : '';

    const systemPrompt = `You are the context-aware AI Copilot for the Recykal DRS (Deposit Return System) Roadmap Engine.
You are helping the DRS Pod Leader who is currently viewing the "${tab}" tab.
${coAuthorBlock}

PROJECT CONTEXT & CURRENT TAB DATA:
${JSON.stringify(stateData, null, 2)}

CHAT HISTORY:
${historyText || 'No prior conversation.'}

USER QUERY:
${query}

CAPABILITIES:
1. Explain any numbers, charts, or decisions on this tab.
2. Answer questions about the data and the overall state.
3. DRAFT documents (emails, official notifications, Panchayat representation letters, agreements) based on the data.
4. Suggest next actions or identify potential dependencies.

RULES:
- Always be highly professional, structured, and action-oriented.
- Do not simply refuse to answer if a specific sub-breakdown is missing from the database. Instead, use your grounding search or perform logical calculations/estimates (e.g., using population ratios or geographic density profiles) to provide a realistic, helpful breakdown. Label these clearly as logical estimations or search findings.
- When drafting documents, use the project context values or search-grounded inputs.
- Always use Google Search grounding (which is active) to check actual local regulations, counts, government entities, or waste rules if needed.

Provide your response in clean markdown format.`;

    const { text, sources } = await activeLlm.generateGrounded(
      systemPrompt,
      activeModelOverride ? { customModel: activeModelOverride } : { jsonMode: false }
    );

    return NextResponse.json({
      ok: true,
      text,
      sources,
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
