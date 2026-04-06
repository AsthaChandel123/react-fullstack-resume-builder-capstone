# ResumeAI Saathi -- Design Specification

**Date:** 2026-04-06
**Status:** Approved (auto-approved per user directive)
**Author:** Divya Mohan
**Decision Authority:** "Whatever creates value. Steve Jobs principles."

---

## 1. Product Vision

**One line:** An AI companion that knows you, builds your career story from natural conversation, and matches you to work that makes your life better.

**The old world:** Type every field. Click 20 times. Get an ATS score you don't trust. Apply blind. Get ghosted. Repeat until depressed.

**The new world:** Open the app. Talk to Saathi like a friend. In any language. Saathi listens, understands, asks smart follow-ups, and builds your resume. Then shows you not just which jobs match your skills, but which ones will make your life better -- factoring in commute, cost of living, air quality, work hours, and company culture. The portal itself feels like someone's rooting for you.

---

## 2. Design Principles (Jobs-Informed)

1. **The conversation IS the product.** Not a form with a chatbot bolted on. The conversation is how you build your resume.
2. **Say no to 1000 things.** No feature bloat. Every pixel earns its place. If removing something changes nothing, remove it.
3. **The last 10% is everything.** Micro-interactions, response warmth, loading states, error recovery -- these ARE the product.
4. **Positive aura.** Every interaction makes the user feel capable and supported. No cold corporate UX. No anxiety-inducing red warnings. Encouragement, not judgment.
5. **Works there = works everywhere.** Slow phone, bad internet, small town. If it doesn't work in Solan, it doesn't ship.
6. **No fabrication. Ever.** AI uses only what the user said. ATS optimization is in phrasing and structure, not invented content.
7. **Wellbeing is not optional.** Every job match includes a wellbeing assessment. People deserve to know what a job will cost their health.

---

## 3. Architecture Overview

### 3.1 Three-Tier AI Strategy

Replace the monolithic 1.5GB LLM with purpose-built tiers:

| Tier | Purpose | Tech | Size | Speed (old HW) |
|------|---------|------|------|----------------|
| **Tier 0: Zero-cost** | Dialog management, slot filling, templates, skill taxonomy | State machine + templates + in-memory graph | 0MB | <1ms |
| **Tier 1: Tiny models** | NER, section classification, embeddings | DistilBERT-NER INT8 + E5-small ONNX via WASM | ~130MB | 300ms-1.5s |
| **Tier 2: Local LLM** | Deep reasoning, contradiction detection, coaching | Gemma 4 E2B via WebGPU (optional, progressive) | 1.5GB | 2-10s (WebGPU only) |
| **Tier 3: Cloud API** | Fallback when Tier 2 unavailable | Gemini 2.5 Flash (user provides key) | 0MB | 200-400ms |

**Key insight:** Tier 0 + Tier 1 handle 90% of the conversational builder. Tier 2/3 add depth for employer-side analysis and coaching. The app is fully functional with just Tier 0 + Tier 1 (130MB, works on a 2016 phone).

### 3.2 Voice Input

**Primary:** Web Speech API
- Supports: hi-IN, en-IN, ta-IN, bn-IN, mr-IN, te-IN, ml-IN, gu-IN, kn-IN, pa-IN, or-IN
- Zero download. Instant. Works on Chrome/Edge (90%+ of Indian users).
- Requires internet (audio sent to Google servers). Acceptable since user is loading a web app.

**Fallback (non-Chrome):** Text input only. No Whisper WASM (75MB download + slow = defeats purpose).

### 3.3 Entity Extraction Pipeline

For every user utterance (spoken or typed):

```
User input (any language)
  → Web Speech API transcribes to text
  → Language detection (simple heuristic: script detection)
  → If non-English: translate key entities (skills, companies stay in English naturally)
  → DistilBERT-NER INT8 ONNX extracts: PER, ORG, DATE, LOC, SKILL
  → Skills taxonomy normalizes skill mentions
  → Slot filler updates conversation state
  → Template engine generates Saathi's next response
  → Text-to-Speech (optional, via SpeechSynthesis API, 0MB)
```

### 3.4 Slot-Filling State Machine

**Slots (required):**
```
personal.name          personal.email         personal.phone
personal.location      education[].degree     education[].institution
education[].year       education[].field
```

**Slots (preferred, Saathi will ask if not mentioned):**
```
education[].gpa        experience[].company   experience[].role
experience[].dates     experience[].bullets[] projects[].name
projects[].tech        projects[].outcome     skills[]
certifications[]       summary                personal.linkedin
personal.github        relocation_preference  target_role
```

**Conversation phases:**
1. **Warm-up** (1-2 exchanges): Name, location, what they're looking for
2. **Education** (2-3 exchanges): Degree, institution, year, field, GPA if relevant
3. **Experience** (2-5 exchanges per role): Company, role, dates, what they did, achievements
4. **Projects** (1-3 exchanges per project): What they built, what tech, what outcome
5. **Skills** (1-2 exchanges): Confirm extracted skills, ask about anything missing
6. **Wrap-up** (1-2 exchanges): Summary, contact details, template preference
7. **Review** (1 exchange): Show the generated resume, ask for changes

**Deviation handling:** If user jumps topics, Saathi follows them and tracks which slots are still empty. Returns to gaps naturally: "By the way, you mentioned IIT Delhi earlier -- what year did you graduate?"

### 3.5 Response Generation

**No LLM needed for Saathi's responses.** Use a template bank of 200+ natural response variants per conversation phase. Parameterized with extracted entities:

```typescript
const RESPONSES = {
  'education.acknowledged': [
    "{{degree}} from {{institution}} -- solid foundation! What have you been up to since {{year}}?",
    "Nice, {{institution}}! {{field}} is a great field. Did you do any internships during college?",
    "Got it -- {{degree}} in {{field}}, {{institution}}, {{year}}. Tell me about your work experience.",
  ],
  // ... 200+ variants across all phases
};
```

Variant selection: rotate to avoid repetition. Personality: warm, encouraging, concise. Never corporate-speak.

---

## 4. Wellbeing Score Engine

### 4.1 Philosophy

Every job has a human cost beyond skills fit. A 95% skills match with a 3-hour daily commute in 45C Delhi heat is not a good match. The platform should tell candidates this, with research citations, not opinions.

### 4.2 Eight Measurable Parameters

| # | Parameter | Weight | Data Source | Research Citation |
|---|-----------|--------|-------------|-------------------|
| 1 | **Commute time** | 25% | Google Maps API (user location -> office) | Stutzer & Frey 2008, Clark et al. 2020 |
| 2 | **Work hours** | 20% | JD text extraction / industry average | WHO/ILO Pega et al. 2021 |
| 3 | **Work mode** | 15% | JD text extraction (remote/hybrid/onsite) | Bloom et al. 2024 (Nature) |
| 4 | **Real salary** | 15% | JD salary / city cost-of-living index | Gallup Five Elements (Financial) |
| 5 | **Air quality** | 10% | Government AQI API for office city | Graff Zivin & Neidell (IZA/NBER) |
| 6 | **Industry attrition** | 5% | Baked-in dataset (NASSCOM/Aon 2024) | BusinessToday India attrition data |
| 7 | **Heat stress** | 5% | Weather API WBGT for office city | Nature Scientific Reports 2026 |
| 8 | **Commute cost** | 5% | Maps distance * fuel rate or transit cost | ORF India commute economics |

### 4.3 Sub-Score Formulas

**Commute (0-100):**
Non-linear decay matching Redmond & Mokhtarian 2001 (optimal ~15 min) and Clark et al. 2020 (10 min = 19% pay cut equivalent):
```
0-15 min:  100
16-30 min: 100 - (min - 15) * 2.0     → 70
31-45 min: 70 - (min - 30) * 2.0      → 40
46-60 min: 40 - (min - 45) * 1.33     → 20
61-90 min: 20 - (min - 60) * 0.5      → 5
90+ min:   5
```

**Work hours (0-100):**
WHO/ILO threshold: 55+ hrs/wk = 35% higher stroke risk:
```
≤40 hrs: 100    41-45: 90    46-50: 70    51-55: 40    55+: rapid decline
```

**Work mode (0-100):**
Bloom 2024 (Nature): hybrid cuts quit rates 35%, equal productivity:
```
Hybrid 2-3 days: 100    Hybrid 1 day: 85    Fully remote: 70    Fully onsite: 50
```

**Real salary (0-100):**
```
real_salary = offered_salary / city_cost_of_living_index
score = min(100, (real_salary / national_median) * 50)
```

**Air quality (0-100):**
WHO PM2.5 guidelines:
```
≤15 μg/m3: 100    ≤25: 80    ≤50: 60    ≤100: 30    >100: 10
```

**Industry attrition (0-100):**
```
score = max(0, 100 - attrition_pct * 3)
```

**Heat stress (0-100):**
WBGT thresholds from Nature Scientific Reports 2026:
```
≤25C: 100    ≤30C: 70    ≤35C: 30    >35C: 10
Adjusted by commute mode (AC car/metro reduces penalty)
```

**Commute cost (0-100):**
```
cost_pct = monthly_commute_cost / monthly_salary * 100
score = max(0, 100 - cost_pct * 10)
```

### 4.4 Composite Formula

```
wellbeing = 0.25 * commute + 0.20 * hours + 0.15 * workmode + 0.15 * salary
          + 0.10 * air + 0.05 * attrition + 0.05 * heat + 0.05 * commute_cost
```

### 4.5 Relocation Modifier

If candidate is willing to relocate:
- Recalculate commute/CoL/AQI/heat for the new city
- Apply relocation stress penalty: -10 points (decays over time)
- Citation: Gallup Community wellbeing element -- relocation disrupts social networks

### 4.6 Score Interpretation (Candidate Dashboard)

| Score | Classification | Visual | Message |
|-------|---------------|--------|---------|
| 80-100 | **Thriving** | Green glow, upward trend | "This role fits your life well." |
| 60-79 | **Comfortable** | Warm amber | "Good match with a few things to consider." |
| 40-59 | **Strained** | Soft orange, specific flags | "Your commute may feel like a 30% pay cut (Clark et al. 2020)." |
| 20-39 | **At Risk** | Gentle red, research citations | "Research shows this combination impacts health significantly." |
| 0-19 | **Concerning** | Deep red, prominent | "We want to be honest: this setup is associated with burnout risk." |

**Tone: caring, not alarming.** "We're not telling you not to take this job. We're making sure you see the full picture."

### 4.7 Maps API Integration

**Distance calculation:**
```
1. User location (from conversation: "I live in Solan, HP")
2. Office location (from JD text extraction by JDAgent)
3. Google Maps Distance Matrix API: driving + transit times
4. Commute mode: ask in conversation ("How do you usually get to work?")
5. If relocation opted in: calculate for new city
6. If remote: commute score = 100 (no commute)
```

**Cost estimation:**
```
driving: distance_km * 2 (round trip) * fuel_rate_per_km * 22 workdays
transit: city_specific_monthly_pass_cost (baked-in dataset for major Indian cities)
```

---

## 5. Candidate Wellbeing Dashboard

### 5.1 Design Philosophy

"Someone's rooting for you." The dashboard should feel like a personal career health checkup, not a cold analytics page. Warm gradients, encouraging language, research citations that educate rather than intimidate.

### 5.2 Dashboard Layout

```
┌─────────────────────────────────────────────────────────┐
│  Your Career Health                              Rahul  │
│  ───────────────────────────────────────────────────── │
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │  Skills   │  │Wellbeing │  │  Overall  │              │
│  │  Match    │  │  Score   │  │  Fit      │              │
│  │   78%     │  │   72     │  │   75%     │              │
│  │  ████░░   │  │  ████░░  │  │  ████░░   │              │
│  └──────────┘  └──────────┘  └──────────┘              │
│                                                         │
│  Life Impact Breakdown                                  │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 🕐 Commute     45 min one-way        Score: 40  │   │
│  │   "Each extra 10 min feels like a 19% pay cut"   │   │
│  │   — Clark et al. 2020, Transportation             │   │
│  ├─────────────────────────────────────────────────┤   │
│  │ 🏠 Work Mode   Hybrid (3 office, 2 home) Score:100│   │
│  │   "Hybrid cuts quit rates 35%"                    │   │
│  │   — Bloom et al. 2024, Nature                     │   │
│  ├─────────────────────────────────────────────────┤   │
│  │ 💰 Real Salary  ₹8.2L adjusted (₹12L nominal)   │   │
│  │   Solan → Bangalore cost-of-living: 1.46x         │   │
│  ├─────────────────────────────────────────────────┤   │
│  │ 🌬 Air Quality  AQI 89 (Moderate)    Score: 60   │   │
│  │   "10-unit AQI increase = 0.35% productivity loss"│   │
│  │   — Graff Zivin & Neidell, IZA                    │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  💡 Saathi's Take                                       │
│  "The skills match is strong. The hybrid setup is ideal.│
│   Watch the commute -- 45 min each way in Bangalore     │
│   traffic adds up. Consider locations closer to          │
│   Whitefield, or negotiate a 4th WFH day."              │
│                                                         │
│  [Apply with Confidence]  [Save for Later]  [Compare]   │
└─────────────────────────────────────────────────────────┘
```

### 5.3 Positive Aura Design Tokens

| Element | Value | Feeling |
|---------|-------|---------|
| Background gradient | Warm white to soft cream (#fefefe → #faf7f2) | Calm, inviting |
| Primary accent | Warm teal (#0d9488) | Growth, health, positivity |
| Success states | Soft green with gentle glow (#22c55e at 15% opacity) | Encouragement |
| Warning states | Warm amber, never harsh red (#f59e0b) | "Heads up" not "danger" |
| Concern states | Soft rose (#f43f5e at 60% opacity) | Caring, not alarming |
| Typography | System font, generous line height (1.7) | Readable, breathable |
| Spacing | Generous padding (24px min), rounded corners (12px) | Warm, approachable |
| Animations | Subtle fade-ins (200ms), no harsh transitions | Gentle, not flashy |
| Score displays | Radial progress with gradient fill | Achievement, not judgment |
| Research citations | Small, italic, accessible on tap | Trustworthy, not preachy |

---

## 6. Conversational Builder ("Saathi") Detail

### 6.1 Greeting Variants (Positive Aura)

```
"Hey! I'm Saathi -- your resume companion. I'm here to help you 
 put your best self forward. Just talk to me like you would a friend. 
 Any language. Ready when you are."

"Welcome! Building a resume shouldn't feel like homework. 
 I'll ask a few questions, you talk, and I'll handle the rest. 
 Sound good?"

"Hi there! Let's build something that shows who you really are. 
 Speak, type, mix languages -- whatever feels natural. Let's start 
 with the basics: what's your name?"
```

### 6.2 NER Model Selection

**DistilBERT-NER INT8 ONNX** (Xenova/distilbert-NER on HuggingFace):
- 66M params, 67MB quantized INT8
- Entities: PER (person), ORG (organization), LOC (location), MISC
- Extended with custom patterns for: DATE, SKILL, DEGREE, GPA
- WASM latency: 300ms-1.5s on old hardware per sentence
- Citation: Sanh, V. et al. (2019). "DistilBERT: a distilled version of BERT." NeurIPS Workshop.

**Custom entity patterns (regex layer on top of NER):**
- Dates: "2019-2022", "Jan 2020 to Mar 2022", "3 years"
- GPA: "8.5 CGPA", "85%", "3.8/4.0"
- Skills: matched against 186-skill taxonomy graph
- Degrees: B.Tech, M.Tech, B.Sc, MBA, PhD, etc.
- Phone: Indian/international formats
- Email: standard pattern

### 6.3 Language Handling

Web Speech API handles transcription in the source language. Entity extraction works because:
- Proper nouns (names, companies, institutions) are typically in English even in Hindi speech
- Technical skills are always in English ("Python", "React", "Machine Learning")
- Dates and numbers are universal
- For pure Hindi content (job descriptions, bullet points), we keep the original text and translate to English for ATS output using a simple dictionary + the LLM tier when available

### 6.4 Resume Generation

Once all required slots are filled:
1. Organize data into the Resume data model (existing `store/types.ts`)
2. Generate professional bullet points from raw conversation data using templates:
   - Input: "I built an API that handles 10k requests per second using Python and Django"
   - Output: "Developed high-throughput REST API processing 10,000 req/s using Python/Django"
3. Generate professional summary from extracted entities (template-based)
4. Apply to selected template (ATS Classic, Modern Blue, etc.)
5. Show live preview. User can edit directly or talk to Saathi to make changes.

---

## 7. Gap Fixes (From Audit)

### 7.1 Critical Fixes

| Gap | Fix |
|-----|-----|
| `taxonomyScore` vs `score` type mismatch | **Fixed** (changed to `score` in Blackboard type) |
| Progress layer cast invalid state | **Fixed** (added layerMap with all orchestrator states) |
| Builder AI Coach not connected to pipeline | Replace with Saathi. Coach agent output feeds into Saathi's suggestions. |
| No JD input in builder | Saathi asks "What kind of role are you looking for?" -> processes as JD for scoring |
| Orchestrator unused outside employer | Wire to builder (via Saathi) and bridge (via self-assessment) |
| Coach suggestions discarded | Add `coachSuggestions` field to Candidate type, display in dashboard |
| Bridge test requires API key | Use Tier 1 (tiny models) for question generation fallback |
| Self-assessment uses sync TF-IDF only | Upgrade to use E5-small async embeddings |
| No onboarding | Saathi IS the onboarding. First interaction = first resume step. |
| Zero i18n | Web Speech API handles input. UI strings: English primary, Hindi secondary. |
| 1.5GB model on old hardware | Three-tier strategy. Tier 0+1 = 130MB, fully functional. |
| Dead code (pipeline.ts, capabilities.ts, CitationTooltip) | Remove or integrate |

### 7.2 Stale References

Update all MiniLM references to E5-small in: README, pitch slides, comments.
Update WebLLM references to Transformers.js in: L3_ReasonAgent.ts header.

---

## 8. Data Sources (Baked-In)

For offline-first operation, bake in:

| Dataset | Source | Update Frequency | Size |
|---------|--------|-----------------|------|
| India city cost-of-living index | Numbeo / RBI data | Quarterly | ~5KB |
| India city AQI averages | CPCB annual reports | Annually | ~2KB |
| India city WBGT averages | IMD data | Annually | ~2KB |
| Industry attrition rates | NASSCOM/Aon annual | Annually | ~1KB |
| Transit costs by city | Manual research | Quarterly | ~2KB |
| Company ratings (top 500) | Great Place to Work + AmbitionBox | Annually | ~20KB |
| Fuel rate | Government published | Monthly | ~100B |
| CGPA cutoffs by company | Public knowledge | Annually | ~1KB |

Total baked-in data: ~35KB. Negligible.

---

## 9. Route Changes

```
/                     → Landing (unchanged)
/builder              → Saathi conversational builder (replaces form)
/builder/form         → Legacy form builder (for users who prefer it)
/builder/preview      → Print preview (unchanged)
/builder/dashboard    → Candidate wellbeing dashboard (NEW)
/employer             → Employer dashboard (unchanged, with trace panel)
/employer/publish     → Criteria publishing (add wellbeing fields)
/employer/matches     → Match signals (add wellbeing scores)
/employer/criteria    → My criteria (fixed permissions)
/employer/:id         → Candidate detail (add wellbeing breakdown)
/bridge/*             → Bridge flow (unchanged, upgraded to use orchestrator)
/pitch                → Pitch deck (updated for new features)
```

---

## 10. Research Citations Index

| # | Citation | Used For |
|---|----------|----------|
| 1 | Stutzer & Frey (2008). "Stress That Doesn't Pay." Scand. J. Economics 110(2):339-366 | Commute wellbeing decay |
| 2 | Clark et al. (2020). "How commuting affects subjective wellbeing." Transportation 47:2783-2805 | 10 min = 19% pay cut |
| 3 | van Ommeren & Gutierrez (2011). "Are workers with a long commute less productive?" Reg.Sci.Urban.Econ. 41(1):1-8 | Commute → absenteeism |
| 4 | Murphy et al. (2023). "Commuting demands meta-analysis." Work & Stress | 39-study meta-analysis |
| 5 | Pega et al. / WHO/ILO (2021). "Long working hours and mortality." Environment International 194 | 55+ hrs = 35% stroke risk |
| 6 | Bloom et al. (2024). "Hybrid work study." Nature | Hybrid = 35% lower quit |
| 7 | Greenhaus, Collins & Shaw (2003). "Work-family balance." J.Vocational.Behavior 63:510-531 | Balance dimensions |
| 8 | Gajendran & Harrison (2007). "Remote work meta-analysis." 108 studies, 45K participants | Remote boosts satisfaction |
| 9 | Graff Zivin & Neidell. "Air pollution and productivity." IZA World of Labour | AQI → productivity loss |
| 10 | Nature Sci. Reports (2026). "Heat stress on labour productivity, Southern India" | WBGT > 30C critical |
| 11 | Redmond & Mokhtarian (2001). "Positive utility of the commute." Transportation 28(2):139-160 | Optimal 15-min commute |
| 12 | Rath & Harter / Gallup (2010). Wellbeing: Five Essential Elements | Career/Social/Financial/Community/Physical |
| 13 | Sanh et al. (2019). "DistilBERT." NeurIPS Workshop | NER model |
| 14 | Wang, L. et al. (2024). "E5 Text Embeddings." ACL | Embedding model |
| 15 | NACE Job Outlook 2024 | Skills scoring weights |
| 16 | AAC&U VALUE Rubrics | Project scoring |
| 17 | Henle, Dineen & Duffy (2019). "Resume Deception." J.Business.Psychology 34:207-225 | Red flag detection |
| 18 | Sackett et al. (2022). "Revisiting selection validity." | Structured interviews > GMA |
| 19 | TomTom Traffic Index 2025 | Indian city commute data |

---

## 11. What's NOT in Scope

- Full i18n (translated UI strings) -- English primary, Hindi in conversation only
- Blockchain/verifiable credentials -- v2 feature
- LinkedIn import -- requires OAuth, scope creep
- Employer wellbeing self-reporting -- baked-in data sufficient for v1
- Custom fine-tuned models -- use off-the-shelf ONNX exports
- Native mobile app -- PWA is sufficient
