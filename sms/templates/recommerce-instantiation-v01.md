# SMS — Recommerce Solution Instantiation

Version: 0.1
Drafted: 2026-06-29
Status: Draft — Chetan review before operating
Next review: First SMS revenue standup

---

## 1. Solution Definition

| Field | Value |
|---|---|
| Solution | Recommerce — Regional Material Selling via WhatsApp + Platform |
| Sub-offerings | Auction-format regional material sales (Tamil, Kannada, Hindi, English tracks) · Collector and aggregator onboarding · Regional dealer network development |
| Target segments | Informal and semi-formal waste collectors, kabadiwalas, small aggregators, MRF operators, regional dealers |
| Business model | Recommerce connects sellers of recyclable materials (collectors, aggregators) with buyers in the marketplace. Commission or platform fee per transaction. |
| Strategic reason to launch | Yogendra's WhatsApp campaigns are achieving 41–51% read rates with 23 direct replies on the Tamil auction format alone. This is the highest-performing outreach Recykal runs. Structuring this as an SMS system converts raw engagement into an onboarding and transaction pipeline. |
| Solution owner | Yogendra Majjari |
| Launch date | Live — campaigns running. Needs formal onboarding and conversion workflow built around them. |

---

## 2. Solution Thesis

**What problem does this solution solve?**

Regional collectors and aggregators have material to sell but no reliable way to find buyers, understand fair market prices, or complete transactions without going through brokers who extract 3–8% margin. Recykal Recommerce removes the broker by providing a direct, WhatsApp-accessible auction and listing platform in regional languages.

**Why is the problem urgent now?**

- Informal sector supply is the lifeblood of Recykal Marketplace — without structured regional supply, the marketplace has no fill rate
- The bridge round and investor meeting create urgency: Recykal needs to demonstrate supply-side depth and repeat transaction data before July 17
- WhatsApp is where the informal sector already operates — meeting them there rather than forcing a platform download removes the single biggest adoption barrier

**Why should collectors and aggregators trust Recykal?**

- Campaigns running in their language (Tamil, Kannada, Hindi)
- Auction format with direct pricing signals — not a black-box broker
- Platform settlement means payment is confirmed, not conditional on broker discretion
- USD 23M raise signals Recykal is not disappearing (use in pitch to larger aggregators who are risk-averse)

**What is the measurable business outcome for Recykal?**

Verified, active supply of recyclable material listed on Recykal Marketplace. Transaction volume and repeat seller rate. Revenue through platform fee or commission.

**What is the measurable outcome for the seller?**

Higher price realisation vs. broker channel. Faster payment. Access to buyers they couldn't reach through local network alone.

---

## 3. ICP

| Field | Value |
|---|---|
| Seller type | Informal collectors with consistent volume (50 kg–5 MT/month), semi-formal aggregators (5–50 MT/month), MRF operators (50–500 MT/month) |
| Geography | South India first (Tamil, Kannada proven) · North India (Hindi track active) · Expand East and West as data builds |
| Language | Tamil (highest engagement) · Kannada (strong) · Hindi (moderate) · English (metro / formal sector) |
| Digital readiness | WhatsApp-native. Does not require smartphone app download or platform registration to begin. |
| Material | PET/plastic (primary — aligns with MMS Plastic instantiation), Paper/cardboard, Metal scrap, Mixed recyclables |
| Buying trigger | Auction message with real price quote · Direct reply gets them into onboarding flow |
| Disqualifiers | Large industrial waste generators with long-term buyer contracts already in place |

---

## 4. Seller Segment Mapping

| Segment | Volume | Geography | Language | Engagement Signal | Conversion Path |
|---|---|---|---|---|---|
| Informal collector (individual) | 50 kg–2 MT/month | Tier 2/3 cities, urban fringe | Tamil, Kannada | Highest — auction format triggers direct reply | WhatsApp onboarding → KYC → first listing |
| Kabadiwala / small dealer | 1–10 MT/month | Urban centres | Hindi, Tamil | Strong — responds to price intelligence messages | WhatsApp intro → site visit → listing + verification |
| MRF operator | 10–100 MT/month | Near metros | English, regional | Moderate — needs relationship + visit | Direct Sales outreach → platform demo → formal listing |
| Institutional collector (societies, corporates) | 0.5–5 MT/month | Urban | English | Low — formal channel needed | Inside Sales email + WhatsApp → intake form |

---

## 5. Buyer Side (Recommerce feeds MMS)

Recommerce is the supply-side engine for MMS. Sellers activated through Recommerce become verified listings on Recykal Marketplace. The flow is:

```
Recommerce WhatsApp campaign
  → Seller replies
  → WhatsApp onboarding (KYC, material type, volume, location)
  → Verified listing created on Recykal Marketplace
  → Buyer RFQ matched to listing (MMS WF7)
  → Transaction completed
  → Seller gets payment → repeat participation
```

**Cross-system dependency:** Recommerce supply velocity directly determines MMS fill rate. Every seller who completes onboarding and creates a listing improves the fill rate denominator.

---

## 6. Persona Messages

**Individual collector (Tamil/Kannada):**
"நீங்கள் சேகரிக்கும் பொருட்களுக்கு நேரடியாக கொள்முதல் விலை தெரியும். தரகர் தேவையில்லை."
*(You get the direct purchase price for what you collect. No broker needed.)*

**Hindi-speaking aggregator:**
"Apka maal, apki kimat. WhatsApp par seedha buyer se deal karein — koi commission nahi."
*(Your material, your price. Deal directly with buyers on WhatsApp — no commission.)*

**MRF operator (English):**
"Your MRF produces consistent, sorted supply. Recykal gives you access to verified national buyers, price benchmarks, and platform-settled payment — without a broker taking margin."

**Institutional collector:**
"Your facility generates clean, sorted recyclables. Recykal verifies your supply, lists it to qualified buyers, and handles documentation for EPR credit — one less thing for facilities management."

---

## 7. Funnel Design

**Acquisition (TOFU):**
- Regional WhatsApp auction messages (Tamil, Kannada, Hindi, English) — already live, highest read rates Recykal produces
- Price intelligence messages: "PET bottle price this week in [city]: ₹X/kg — are you selling at this rate?"
- DRS-linked supply: collectors who return containers to RVMs → onboard as micro-suppliers

**TOFU channels:**
- WhatsApp broadcasts (Yogendra managing — 4 tracks live)
- Referral from existing contacts (23 direct replies in Tamil = organic spread potential)
- ScrapTalk events — offline acquisition of aggregators in metro cities

**Activation (MOFU):**
- WhatsApp onboarding flow: material type → volume → location → KYC → first listing
- Site visit (for aggregators 5 MT+)
- First price quote on their actual material to prove platform value

**Conversion (BOFU):**
- First listing created and verified
- First RFQ matched (MMS WF7 takes over)
- First payment received → the single most powerful proof point for repeat participation

**Retention:**
- Weekly price intelligence message in their language
- SMS-level: notify seller when their listing gets a buyer enquiry
- Monthly: "Your top buyers this month" personalised message

---

## 8. Activated Workflows

| Workflow | Status | Owner | Notes |
|---|---|---|---|
| WF1 Domain Intelligence | Active | Yogendra | Price data from WhatsApp responses. Needs systematic capture. |
| WF2 Target Account Selection | Active — informal | Yogendra | No formal scoring. Running by feel. |
| WF3 Buying Committee Mapping | N/A | — | B2C-like for individuals; direct for aggregators |
| WF4 Persona-Led Communication | Active | Yogendra | 4 language tracks live. Tamil auction format best. |
| WF5 TOFU Demand Creation | Active | Yogendra | Strong read rates. No conversion workflow after reply. |
| WF6 MOFU Evaluation Activation | Not started | Marketing + Ops | WhatsApp onboarding flow needed. |
| WF7 BOFU Conversion | Not started | Marketplace Ops | Listing creation workflow from WhatsApp reply to verified listing. |
| WF8 Funnel Velocity | Not started | Marketing | No visibility from reply → listing → first transaction. |
| WF9 MQL to Listing to Transaction | Not started | Marketplace Ops | Define what a "converted recommerce seller" looks like. |
| WF10 ROI and Proof | Not started | Marketing | Seller success stories → recruitment tool for more sellers. |

---

## 9. Minimum Viable Assets

| Asset | Status | Owner | Due |
|---|---|---|---|
| WhatsApp onboarding flow (reply → KYC → listing) | Not started | Yogendra + Tech | Week 1 — this is the single most urgent build |
| Price intelligence bulletin (weekly, per language) | Partial — ad hoc today | Yogendra | Systematise: Week 2 |
| Seller intake form (WhatsApp-native or simple form) | Not started | Ops | Week 1 |
| Tamil auction message template (proven format) | Exists — standardise it | Yogendra | Codify this week |
| ScrapTalk seller recruitment brief | Not started | Marketing | Week 2 |
| First seller success story / WhatsApp testimonial | Not started | Marketing + CS | Week 3 |
| Recommerce weekly dashboard (replies → onboarded → listed → transacted) | Not started | Yogendra | Week 1 |

---

## 10. 30-Day Targets

| Metric | Target | Owner |
|---|---|---|
| WhatsApp replies (Tamil track) | 40+ per campaign | Yogendra |
| Sellers who complete onboarding | 20 | Ops |
| KYC-verified sellers | 15 | Ops |
| Active listings created from Recommerce | 10 | Marketplace Ops |
| First Recommerce-sourced transaction completed | 1 | Marketplace Ops + Sales |
| Seller success story captured | 1 | Marketing |
| Weekly Recommerce dashboard live | Yes | Yogendra |

---

## 11. Risks and Open Questions

**Top acquisition risks:**
- 23 direct replies on Tamil campaign but no onboarding flow to capture them — they go cold
- WhatsApp broadcasts depend on list hygiene — stale numbers reduce delivery rates
- Aggregators have existing buyer relationships — switching to platform requires a better price, not just convenience

**Top trust risks:**
- First payment delay destroys word-of-mouth in tight regional networks — payment SLA must be guaranteed
- If buyers on MMS are not ready to transact, Recommerce sellers who list see no enquiry and leave
- Grade misrepresentation by new sellers before verification is in place

**Top conversion risks:**
- No WhatsApp onboarding flow = all current engagement is dead-end (biggest current risk)
- KYC requirement excludes fully informal sellers — need a graduated trust model (KYC-light for first listing)

**Top cross-system risks:**
- Recommerce supply velocity must outpace MMS demand generation — if buyers arrive before listings, they leave
- Recommerce and MMS teams must share a single dashboard showing fill rate by material source

**Open decisions:**
1. What is the KYC minimum for a first listing — PAN only? Aadhaar + bank? Define graduated model.
2. Who owns the WhatsApp onboarding flow — Yogendra + Tech or Marketplace Ops?
3. What is the platform fee or commission model for Recommerce transactions?
4. Does the Tamil auction format get codified into a reusable template for other languages?
5. Is there a Recommerce-specific landing page or does everything flow through WhatsApp?

---

## 12. Launch Decision

| Field | Value |
|---|---|
| Launch status | Live — outreach running, conversion infrastructure not yet built |
| Approved by | [Pending — Chetan to review] |
| Date | 2026-06-29 (instantiation drafted) |
| Next review | First SMS revenue standup |
