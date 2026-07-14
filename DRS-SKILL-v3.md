# DRS Roadmap Engine — Comprehensive Master Blueprint (DRS-SKILL-v3)

**Status:** Locked Specification
**Purpose:** Standalone, definitive reference specification for developers and AI agents maintaining or extending the Deposit Return System (DRS) Roadmap Engine dashboard.

---

## 1. Current Project Stack
The DRS Engine is structured as a premium, responsive web cockpit dashboard built on the following technologies:
- **Core Framework:** Next.js 16 (using App Router) and React 19.
- **Backend / Database:** Supabase for project memory storage, combined with a local storage baseline fallback in the browser (`localStorage`) for offline portability.
- **Styling Design:** Vanilla CSS (`globals.css`) with Apple-inspired flat, premium UI design (e.g., card-based sections, hairline borders, HSL tailored variables, and system sans-serif typography: SF Pro).
- **Aesthetic Effects:**
  - **Dynamic Logo Rotation:** Custom CSS keyframes rotating the Recykal logo (`.spin-slow`) to provide a high-end feel.
  - **Animated Mascot:** An SVG-based mascot container (`.mascot-container`) executing bobbing, waving, and blinking animations (`bobbing`, `waving`, `eyeBlink`) to represent the conversational copilot agent.
  - **Recording Pulse:** Micro-animation (`.listening-pulsate`) using keyframe scaling and glow effects for voice commands/interaction states.

---

## 2. Complete Directory Mapping
The project structure is organized as follows:
```
DRS-1/
├── drs-bot/                       # DRS bot config & specs
│   ├── web/                       # Next.js web application root
│   │   ├── app/                   # Next.js App Router paths
│   │   │   ├── api/               # API endpoints
│   │   │   │   ├── copilot/       # Conversational AI assistant endpoint
│   │   │   │   │   └── route.js   # Dynamic model router (Vertex/Gemini/Groq/Claude)
│   │   │   │   ├── generate/      # Stage generation endpoint
│   │   │   │   │   └── route.js   # Coordinates LLM outputs per stage
│   │   │   │   ├── projects/      # Project save/retrieve endpoint
│   │   │   │   └── stage2/        # Geo-hierarchy discovery API
│   │   │   ├── globals.css        # Core design tokens, theme, and responsiveness rules
│   │   │   ├── layout.jsx         # Root app wrapper
│   │   │   └── page.jsx           # Main cockpit dashboard page
│   │   ├── data/                  # Static geo lists and demo JSON data
│   │   ├── lib/                   # Shared libraries and utilities
│   │   │   ├── connectors/        # Google Places & data.gov.in integration logic
│   │   │   ├── llm/               # Model adapter files
│   │   │   │   ├── claude.js      # Anthropic Claude 3.5 Sonnet connector
│   │   │   │   ├── gemini.js      # Google Gemini AI Studio connector
│   │   │   │   ├── groq.js        # Groq (Llama-3) connector
│   │   │   │   ├── provider.js    # Active provider selection abstraction
│   │   │   │   └── vertex.js      # Gemini Vertex AI connector
│   │   │   ├── prompts/           # Specialized prompts per stage
│   │   │   │   ├── competitors.js # Prompt generator for market competitors
│   │   │   │   └── stage2.js      # Prompt generator for geo discovery
│   │   │   ├── prompts.js         # Master prompt builder for stages 3 to 10
│   │   │   └── supabase.js        # Supabase client instance
│   │   ├── public/                # Static assets (images, icons, SVGs)
│   │   ├── next.config.mjs        # Next.js configuration
│   │   ├── jsconfig.json          # Javascript compiler settings
│   │   └── package.json           # Frontend dependency manifest
│   ├── DRS-SKILL.md               # Original spec v1
│   ├── build-brd.js               # Legacy prompt builder script
│   └── package.json               # Backend script definitions
├── DRS-SKILL-v2.md                # Spec v2 (Assumptions & Portability additions)
└── DRS-SKILL-v3.md                # Comprehensive master blueprint (This file)
```

---

## 3. The 12 Actual Stages
The DRS Roadmap Engine generates plans across 12 sequential, reactive stages. Below is the side-by-side mapping of the stages in code and execution:

| Stage # | Stage Name (Code & UI) | Purpose | Input / Ask | Output / Generate |
| :--- | :--- | :--- | :--- | :--- |
| **1** | **Setup** | Capture core business objectives and target regions. | Country, State, implementation model, materials list, phasing sequence. | Save inputs. Setup form UI only. |
| **2** | **Geography Intel & Rollout** | Mapped in `stage2.js` to build dynamic hierarchies. | Selected state validation. | Hierarchical structure (`geoSchema`), population, material consumption profile, and target touchpoint universe. |
| **3** | **Market Intel** | Quantifies economic models and policy drivers. | Confirm competitors or local regulations. | Per-material 0-100 opportunity scores, business cases, and international benchmarks. |
| **4** | **Stakeholders** | Coalitions map built using `prompts.js`. | Known contacts and relationships. | Matrix of Government, Brands, Associations, and Recyclers with dynamic Alignment Readiness Score. |
| **5** | **Competitors** | Competitor intelligence mapped in `competitors.js`. | Competitor names and PRO activities. | Heatmap of competitor footprint, recyclers, and PRO capture points in target location. |
| **6** | **Resistance** | Evaluates blockers via 7 operational fronts. | Local political signals. | Factual risk register, pre-emptive mitigations, and 0-100 Resistance Index. |
| **7** | **Blueprint** | Sequence and critical-path builder. | Target D-Day, budget, and phase timelines. | Master Gantt timeline linked with async policy gates. |
| **8** | **Execution** | Central repository of actionable workstreams. | None (derived downstream). | 7 workstream tabs (Government & Regulatory, Brand/Deposit, Touchpoints, Infrastructure/RVM, Awareness, Operations, Launch) complete with auto-generated legal templates. |
| **9** | **GTM Launch & Funnel Execution** | Spreadsheet-style funnel execution schedule. | Dynamic setup variables. | Day-by-day 2-day micro-schedule split into Branding, Acquisition, and Engagement campaign matrices. |
| **10** | **BTL Activation** | Engagement universe mapped per sub-division. | Priority venues and BTL budget. | Location-by-location campaign plans (airports, beaches, schools) with BTL Reach scores. |
| **11** | **KPIs** | Defines operational measurement standards. | Target baseline values. | Leading and lagging KPI matrices with critical warning thresholds and automated escalation SOPs. |
| **12** | **Knowledge Base** | Compounds intelligence for future plans. | Learnings and custom constraints. | Packs the final configuration as a Reusable Geography Blueprint in the project registry (cloning engine). |

---

## 4. Mobile UI Fixes Specification
To ensure seamless access on touch and small-screen devices, the cockpit implements mobile-specific CSS overrides under `@media (max-width: 768px)` inside [globals.css](file:///c:/Users/Animesh.Mohanty/Desktop/DRS-1/drs-bot/web/app/globals.css):
- **Off-Canvas Menu Drawer:** The `.sidebar` transitions to a fixed drawer layout absolute to the left edge:
  - Default: `transform: translateX(-100%)` with a `z-index: 1000`.
  - Open state: Toggle `.mobile-open` class to apply `transform: translateX(0)`.
  - Background overlay: `.mobile-overlay` toggles to `.active` adding a 40% black transparency overlay with a `backdrop-filter: blur(2px)` to prevent underlying clicks.
- **Scrollable Table Containers:** Tables wrap inside scrollable containers (`.card` and `.table-responsive`) with overflow specifications:
  ```css
  .card {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }
  table {
    min-width: 600px;
  }
  ```
- **Mascot Floating Toggle Button:** A floating action button (`.copilot-floating-btn`) is fixed to the bottom-right for mobile users to pull up the Copilot drawer. When clicked, it toggles the visibility of the bottom-sheet panel.
- **Close Button:** The drawer and sheets feature explicit Close button markers (`.mobile-only-btn`) that overlay on the right-hand corner.
- **CSS Cascade Specificity Rules:** To prevent media queries from being overridden by utility classes, all global hide rules (e.g., `.mobile-header { display: none; }` and `.mobile-only-btn { display: none; }`) MUST be declared **before** the `@media (max-width: 768px)` query block. This ensures that the mobile-only visible classes successfully override generic layout values.

---

## 5. Multi-Model Routing
The cockpit API provides dynamic, run-time model routing in [/api/copilot/route.js](file:///c:/Users/Animesh.Mohanty/Desktop/DRS-1/drs-bot/web/app/api/copilot/route.js):
- **Providers Configured:**
  - **Gemini Vertex:** Used for enterprise-grade execution using `vertex.js` with `customModel: 'gemini-vertex'` or specialized enterprise naming conventions.
  - **Gemini AI Studio:** Integrates via `gemini.js` for developers using direct developer API keys.
  - **Groq:** Integrates via `groq.js` to run lightning-fast open-weights models (e.g., Llama 3).
  - **Anthropic Claude:** Integrates via `claude.js` to route complex document drafting and reasoning requests.
- **Routing Logic:** The system reads the incoming model parameter `selectedModel` from the client request payload. If missing, it defaults to the value configured in the environment variable `LLM_PROVIDER` via `provider.js`.
- **Environmental Setup (.env / .env.local):**
  ```env
  # Active Provider selection: gemini, groq, vertex, claude
  LLM_PROVIDER=gemini
  
  # API Credentials
  GEMINI_API_KEY=your_gemini_studio_key_here
  GROQ_API_KEY=your_groq_api_key_here
  ANTHROPIC_API_KEY=your_claude_api_key_here
  
  # Google Cloud Vertex AI settings
  GCP_PROJECT_ID=your_gcp_project_id
  GCP_LOCATION=us-central1
  GOOGLE_APPLICATION_CREDENTIALS=path_to_gcp_sa_key.json
  ```

---

## 6. Core AI Guardrails & Grounding
To maintain high confidence in reports, models adhere to strict analytical guardrails:
- **No Hallucinations Rule:** Models are instructed via system prompts to never return numbers or regulations from general weights memory if they are not backed by verification or live search citations.
- **Source Badging Rules:**
  - `✅ Verified`: Used when raw data is retrieved directly from official regulatory guidelines or database APIs (e.g., data.gov.in).
  - `📘 Grounded`: Applied when values are fetched from trusted web search grounding links.
  - `⚠️ Estimated`: Applied to computed/derived targets or projected volumes.
  - `❔ To-validate`: Default badge for fields returned as `null` or missing due to lack of local coverage.
- **Calculation Formulas:** Calculated metrics must expose a human-readable math property. For instance, PET bottle consumption projections use:
  $$\text{Estimated Consumption} = \text{Sub-division Population} \times \text{Average National PET Consumption (19.5 units/capita/year)}$$

---

## 7. Continuous Consensus Engine (Self-Learning Data Loop)
To eliminate AI data fluctuations while keeping information updated, the bot implements a background consensus pipeline:
- **Locked Project Cache:** For the first 30 days after project creation, the dashboard renders a cached set of data. The numbers and text remain static for the user, preventing random UI changes.
- **Asynchronous Run Databank:** While the user interacts with the cached data, the system runs asynchronous background AI generations and API lookups. Every run is logged in a Supabase databank as a "data variation run."
- **Continuous Consensus Algorithm:** The backend periodically runs a consolidation script:
  - **Numerical Data:** Evaluates all runs and computes the "highest occurrence" (statistical mode) for counts, populations, and material weights to filter out random AI outliers.
  - **Text & Policy Data:** Clusters text drafts and selects the most robust version aligned with the latest verified regulations.
- **Dynamic Knowledge Base Updates:** The compiled consensus data continuously overwrites the geography's Knowledge Base entry. If a government rule shifts in real life, background runs eventually establish a new majority consensus, updating the live dashboard automatically.

---

## 8. Guidelines for Future AI/Human Developers
1. **Layout Integrity:** When addressing mobile layout issues, do NOT alter the desktop grid coordinates or default flex layouts of `.dashboard`. Use media queries to override layout parameters.
2. **Cascading Order:** Maintain logical cascading inside CSS files. Place default structural styling first, followed by keyframe animation sets, global hidden classes, and finally responsive `@media` overlays at the end.
3. **No Placeholders in Code:** Do not use temporary mockups. Always connect state values to valid variables, leveraging the grounding fallback methods when variables return `null`.
4. **Data Consistency:** When implementing features that mutate project variables, verify that changes cascade down to dependent calculation models in subsequent stages, preserving the consensus values.

