<div align="center">

<img src="public/icon-192.png" alt="ResumeAI" width="96" height="96" />

# ResumeAI

**Conversational resume building, transparent employer screening, and a verified trust layer in between — all running in your browser.**

[![Live](https://img.shields.io/badge/live-astha--capstone.dmj.one-0f766e?style=flat-square&logo=vercel&logoColor=white)](https://astha-capstone.dmj.one)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)](LICENSE)
[![React](https://img.shields.io/badge/React-19.1-61dafb?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178c6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-6.3-646cff?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev)
[![Tailwind](https://img.shields.io/badge/Tailwind-4.1-38bdf8?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Firebase](https://img.shields.io/badge/Firebase-Auth%20%2B%20Firestore-ffca28?style=flat-square&logo=firebase&logoColor=black)](https://firebase.google.com)
[![Gemma](https://img.shields.io/badge/Gemma-3%2027b-4285f4?style=flat-square&logo=google&logoColor=white)](https://ai.google.dev/gemma)
[![Gemini](https://img.shields.io/badge/Gemini-2.5%20Flash-8e75b2?style=flat-square&logo=googlegemini&logoColor=white)](https://ai.google.dev/gemini-api)
[![PWA](https://img.shields.io/badge/PWA-offline--first-5a0fc8?style=flat-square&logo=pwa&logoColor=white)](https://web.dev/progressive-web-apps/)
[![WCAG](https://img.shields.io/badge/a11y-WCAG%202.2%20AAA-2ea44f?style=flat-square)](https://www.w3.org/WAI/standards-guidelines/wcag/)

[**Live Demo**](https://astha-capstone.dmj.one) · [**Report Bug**](https://github.com/divyamohan1993/astha-react-fullstack-resume-builder-capstone/issues/new?labels=bug) · [**Request Feature**](https://github.com/divyamohan1993/astha-react-fullstack-resume-builder-capstone/issues/new?labels=enhancement)

</div>

---

ResumeAI is a privacy-first career platform built for first-generation Indian job seekers on slow networks and small phones. It bundles three interconnected systems — a conversational resume builder (**Saathi**), a 9-agent transparent employer screening pipeline, and a verified trust layer (**Bridge**) — into a single offline-first PWA. Every ML inference runs in the browser. No resume data leaves the device.

> **Capstone Project** · BTech CSE (Cybersecurity Specialization) · Shoolini University, Solan, HP · Astha Chandel (GF202214559)

## Table of Contents

- [Highlights](#highlights)
- [Quick Start](#quick-start)
- [What This System Does](#what-this-system-does)
  - [Saathi — Conversational Resume Builder](#saathi--conversational-resume-builder)
  - [Resume Builder (Form Mode)](#resume-builder-form-mode)
  - [Employer Screening](#employer-screening)
  - [Bridge — The Trust Layer](#bridge--the-trust-layer)
  - [Wellbeing Scorer](#wellbeing-scorer)
- [AI Pipeline](#ai-pipeline)
- [Anti-Cheat System](#anti-cheat-system)
- [Security](#security)
- [Tech Stack](#tech-stack)
- [Accessibility](#accessibility)
- [Project Structure](#project-structure)
- [Cloud Functions](#cloud-functions)
- [Deployment](#deployment)
- [Research Citations](#research-citations)
- [License](#license)

## Highlights

- **Saathi conversational builder** — Pure LLM (Gemma 3 27b primary, Gemini 2.5 Flash backup), zero regex, no-repeat history, multilingual.
- **9-agent employer pipeline** — Kahn-sorted DAG with parallel execution, 4-tier progressive AI (regex → ONNX embeddings → in-browser Gemma 4 → Gemini API).
- **Bridge trust layer** — HMAC-signed scorecards, adaptive skill tests with anti-LLM-tell validation, and three-layer audio anti-cheat.
- **Wellbeing scoring** — 0-100 composite across 8 research-cited parameters tuned for 32 Indian cities.
- **Offline-first PWA** — Works on slow networks; service worker precaches everything except the heaviest model chunks.
- **WCAG 2.2 AAA** — 7:1 contrast, full keyboard nav, screen-reader landmarks, reduced-motion support.
- **No vendor lock-in** — Single-file model config, MIT licensed, deploys to any static host.

## Quick Start

```bash
git clone https://github.com/divyamohan1993/astha-react-fullstack-resume-builder-capstone.git
cd astha-react-fullstack-resume-builder-capstone
npm install
cp .env.example .env        # fill in Firebase + Gemini API key
npm run dev                 # http://localhost:5173
```

| Script | Purpose |
|---|---|
| `npm run dev` | Vite dev server with HMR |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm test` | Run the Vitest suite |
| `npm run typecheck` | Strict TypeScript build (`tsc -b`) |

### Environment Variables

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_GEMINI_API_KEY=          # Required: Saathi (Gemma+Gemini) and L4 employer fallback
```

## What This System Does

### Saathi — Conversational Resume Builder

A slot-filling chatbot that builds your resume through conversation instead of forms.

- **23 data slots** across 7 phases (warmup, education, experience, projects, skills, wrapup, review). 8 required, 15 preferred.
- **Pure LLM understanding.** Gemma 3 27b (primary) with Gemini 2.5 Flash (backup) — no regex extraction. Handles Hindi, Hinglish, Tamil, Telugu, Kannada, Bengali, Marathi, Gujarati, Punjabi, and bare one-word replies like "Shimla" by reading Saathi's last question as context.
- **Single source of truth for models:** [`src/saathi/engine/modelConfig.ts`](src/saathi/engine/modelConfig.ts). Allowed values: Gemma 3/4 family or Gemini 2.5 / 3.
- **No-repeat conversation:** the response generator gets the full chat history with an explicit instruction never to re-ask a question already answered.
- **Voice input** via Web Speech API with automatic script detection across 10 Unicode blocks (Latin, Devanagari, Tamil, Bengali, Telugu, Malayalam, Gujarati, Kannada, Punjabi, Odia).
- **Session persistence** in localStorage — resume mid-conversation where you left off.
- Outputs a complete `Resume` object compatible with the form builder and all 4 templates.

### Resume Builder (Form Mode)

- **4 ATS-optimized templates** — ATS Classic (single-column serif), Modern Blue (two-column navy sidebar), Creative (gradient header with section icons), Minimal (Helvetica Neue, light typography).
- **Drag-and-drop** section reordering via `@dnd-kit`.
- **Custom sections** with configurable layouts (list, key-value, tags, freetext).
- **AI Resume Coach** — Weighted scoring (0–92%) across personal info, summary quality, education, experience, projects, skills, completeness, and online presence. Detects generic language, weak bullet starts, missing action verbs. Citations: NACE 2024, Ladders 2018, AAC&U VALUE Rubrics, Knouse 1994, Hart Research 2018.
- **PDF export** via `html2pdf.js` with oklch-to-RGB color conversion for `html2canvas` compatibility.
- **Print preview** at 210 mm × 297 mm A4.

### Employer Screening

- Upload plain-text resumes and JDs for AI-scored candidate ranking.
- JD parser extracts title, seniority, skills (12 pattern groups), experience range, education requirements, location, salary, benefits, responsibilities, and company signals.
- 9-agent agentic pipeline processes each candidate (details below).
- Sortable, searchable candidate table with score badges, red-flag counts, and AI-tier indicators.
- Per-candidate detail view: score breakdown, keyword analysis, red-flag panel, coach suggestions.

### Bridge — The Trust Layer

Connects resume building and employer screening through verified skill assessment.

1. **Employer publishes criteria** — job title, required and preferred skills, custom scoring weights (must total 100%), test config (questions per skill, difficulty floor), and a threshold. Gets a 6-character shareable code + QR.
2. **Candidate opens the link** — self-assesses against the JD using the same L1+L2 scoring pipeline. JD Coach suggests specific improvements (missing skills, weak bullets, missing sections) with one-click "Add to Skills" integration.
3. **Candidate takes an adaptive test** — Questions generated by Gemini with anti-LLM-tell validation (option char variance < 20%, correct answer not uniquely longest, no qualifier stacking). Difficulty adapts per-skill: correct advances level, first wrong stays, second wrong drops. 5 levels with score ceilings (L2 max 45, L3 max 75, L4 max 90, L5 max 100).
4. **Anti-cheat proctoring** runs silently — reading-speed calibration, tab-switch detection, paste detection, fullscreen exit, speed-anomaly detection, three-layer audio intelligence (spectral 300–3400 Hz, temporal 3–8 Hz, adaptive 60 s baseline). Zero audio stored.
5. **Scorecard is cryptographically signed** via HMAC-SHA256 on a Cloud Function. Shows resume score vs. verified score vs. gap. Gap interpretation: underrated (gap > 5), accurate (±5), overclaimed (gap < −5).
6. **Candidate sends a match signal** with contact info. Employer gets a notification + email. One reply per match enforced server-side.

### Wellbeing Scorer

Computes a 0–100 composite wellbeing score for any job offer, weighted across 8 research-cited parameters.

| Parameter | Weight | Source |
|---|---|---|
| Commute | 25% | Clark et al. 2020; Stutzer & Frey 2008 |
| Work Hours | 20% | WHO/ILO Pega 2021 |
| Work Mode | 15% | Bloom et al. 2024 (Nature) |
| Real Salary (CoL-adjusted) | 15% | Gallup Five Elements |
| Air Quality (PM2.5) | 10% | Graff Zivin & Neidell (IZA) |
| Industry Stability | 5% | NASSCOM/Aon 2024 |
| Heat Stress (WBGT) | 5% | Nature Sci Reports 2026 |
| Commute Cost | 5% | ORF India |

India-specific data for 32 cities (PM2.5, cost of living, WBGT, transit costs, fuel rates). Commute scoring uses non-linear piecewise decay. Relocation penalty: −10 points (Gallup community wellbeing). Classification: thriving (≥ 80), comfortable (≥ 60), strained (≥ 40), at-risk (≥ 20), concerning (< 20).

Optional Google Maps Distance Matrix integration for driving and transit commute data.

## AI Pipeline

4-layer progressive pipeline running as a DAG (Kahn's algorithm for topological sort, parallel execution of independent nodes).

| Layer | Model | Size | Runs On | Purpose |
|---|---|---|---|---|
| **L1** | None (regex + heuristics) | 0 | Any device | Section detection, entity extraction, Jaccard + TF-IDF scoring, parseability gate |
| **L2** | E5-small-v2 (ONNX, Q8) | ~67 MB | WASM | 384-dim semantic embeddings, cosine similarity |
| **L3** | Gemma 4 E2B (Q4) | ~1.5 GB | WebGPU or WASM | Contradiction detection (Henle et al. taxonomy), project quality assessment (AAC&U VALUE rubric) |
| **L4** | Gemini 2.5 Flash API | Cloud | Online only | Fallback when L3 unavailable. Structured JSON output. Native PDF understanding. |

**DAG execution order**

- **Tier 1 (parallel)** — JD Parser + L1 NLP + L2 Embeddings
- **Tier 2** — Distance (needs L1), Skills Matcher (needs JD + L1), L3 Reasoning (needs L1 + L2)
- **Tier 3** — L4 Fallback (needs L3, only if L3 failed and API key exists)
- **Tier 4** — Scorer (needs L1, L2, L3/L4, skills matcher, distance)
- **Tier 5** — Coach (needs Scorer, optional)

**Scoring formula (9 weighted parameters)**

| Parameter | Weight | How |
|---|---|---|
| Skills Match | 30% | 0.4 × Jaccard + 0.6 × semantic similarity |
| Experience | 20% | Binary presence × semantic relevance |
| Education | 15% | Keyword overlap between resume and JD |
| Projects | 10% | AAC&U VALUE rubric (capstone/milestone/benchmark) or quantified pattern detection |
| Certifications | 5% | Presence × semantic relevance |
| Distance | 5% | Exponential decay exp(−0.043 × miles), Marinescu & Rathelot 2018 |
| Extracurricular | 5% | 0.6 × presence + 0.4 × leadership keyword detection |
| GPA | 3% | Linear (GPA − 2.0) / 2.0, null = 0.5 neutral |
| Completeness | 2% | Proportion of expected sections present |

**Hard gate** — If a resume is not parseable (needs 3 of 4 expected sections), final score = 0.
**Red-flag penalties** subtract from the base score. Final score is clamped to [0, 100]. When distance data is unavailable, its 5% weight redistributes proportionally.

**Skills taxonomy** — 189 skills across 10 categories with canonical IDs, aliases, and an adjacency graph. Exact match = 1.0, adjacent skill = 0.5.

**ReAct tracing** — Every agent records thought-action-observation triples with timing for transparency.

## Anti-Cheat System

| Layer | What | Penalty |
|---|---|---|
| Tab switch | `visibilitychange` listener | −5 pts |
| Paste detection | `paste` event on test area | −8 pts |
| Fullscreen exit | `fullscreenchange` listener | −3 pts |
| Speed anomaly | Answer time < 0.3× expected read time | −10 pts |
| Compound anomaly | Speed anomaly + tab hidden in last 10 s | −15 pts |
| Speech burst | 2–5 s detected speech | −1 pt |
| Conversation | 3+ speech bursts in 30 s | −5 pts |
| Continuous speech | > 10 s continuous speech | −8 pts |
| Whisper | Low-energy speech detection | −6 pts |
| Speech + tab switch | Speech within 5 s of tab switch | −12 pts |
| Resume pinning | SHA-256 hash + n-gram Jaccard change detection | Blocks retest |
| Device fingerprint | 11 hardware signals (GPU, audio, screen, CPU, memory) SHA-256 hashed | One identity per device |

**Audio analysis is three-layer**

1. **Spectral** — FFT energy distribution in 300–3400 Hz speech band
2. **Temporal** — Syllabic modulation detection at 3–8 Hz via zero-crossing rate
3. **Adaptive** — Rolling 60 s baseline recalibration from non-speech samples

**Anti-OCR** — Test options rendered with font-weight 395–410 and letter-spacing 0.005–0.02 em randomized per option.

## Security

- **Firestore rules** — Most write paths are Cloud Functions only. Clients can only create criteria and device docs. Scorecards, matches, replies, and notifications are server-side write only.
- **HMAC-SHA256 signed scorecards** with per-criteria 32-byte signing secrets generated server-side.
- **Anti-gaming** — Resume pin blocks retesting the same criteria. Device fingerprint blocks same-device retesting. Session heartbeats track liveness.
- **CSP headers** in `index.html` and Vercel config.
- **Security headers** — HSTS (2 yr, preload), `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` denying camera, payment, USB.
- **Anonymous auth** with device-to-email bidirectional mapping for identity tracking.

## Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19.1, TypeScript 5.8, Vite 6.3, Tailwind CSS 4.1, Zustand 5 |
| **AI/ML (in-browser)** | Gemma 4 E2B via Transformers.js v4, ONNX E5-small-v2 via onnxruntime-web, DistilBERT-NER, TF-IDF, Jaccard |
| **AI/ML (cloud)** | Gemma 3 27b (Saathi primary), Gemini 2.5 Flash (Saathi backup + L4 employer fallback + adaptive question generation) |
| **Backend** | Firebase Auth (anon + email + Google), Firestore (8 collections), Cloud Functions v2 (Node 20) |
| **Testing** | Vitest 3.1, React Testing Library 16.3, 516 tests across 27 test files |
| **PWA** | Workbox via vite-plugin-pwa, selective caching (skips > 500 KB model chunks) |
| **Deploy** | Vercel (astha-capstone.dmj.one) — auto-deploys from `main` |
| **Other** | html2pdf.js, qrcode, @dnd-kit, Web Speech API, Web Crypto API, Google Maps Distance Matrix API |

## Accessibility

- **WCAG 2.2 AAA target** — 7:1 contrast ratio across the entire UI
- **Skip-to-content** link on every page
- **Full keyboard navigation** with visible 3 px solid focus indicators
- **ARIA roles, labels, and live regions** throughout
- **Mobile-responsive** with focus-trapped navigation drawer
- **`prefers-reduced-motion`** — all animations and transitions set to 0.01 ms
- **44 px minimum touch targets** for all interactive elements
- **Semantic HTML** with proper heading hierarchy and landmarks
- **Print stylesheet** with forced light color scheme

## Project Structure

```
src/
├── ai/
│   ├── agents/         L1 NLP, L2 Embed, L3 Reason, L4 Fallback, Score, Distance, JD
│   ├── models/         ONNX E5-small loader, Gemma 4 E2B (Transformers.js), capability detection
│   ├── orchestrator/   DAG executor (Kahn's), agentic pipeline, ReAct tracing
│   ├── scoring/        Jaccard, TF-IDF, distance decay, GPA, VALUE rubric
│   └── taxonomy/       189-skill graph with aliases and adjacency
├── saathi/
│   ├── engine/         Slot machine, AI extractor (Gemma+Gemini), AI response generator, model config, resume generator
│   ├── components/     Chat UI, voice button, progress bar
│   └── voice/          Speech input (Web Speech API), language/script detection
├── bridge/
│   ├── components/     Assessment, test engine, scorecard, criteria forms, auth, sharing
│   ├── hooks/          Self-assessment scoring hook
│   └── test/           Question generator, adaptive scoring, anti-cheat, audio monitor, calibration
├── builder/
│   ├── components/     Form editors, AI coach, drag-drop sections, skill tags
│   └── templates/      4 resume templates (ATS Classic, Modern Blue, Creative, Minimal)
├── employer/
│   └── components/     Candidate table, score breakdown, keyword analysis, red flags, citations
├── wellbeing/
│   ├── engine/         Wellbeing scorer, formulas (8 scoring functions), Google Maps client, citations
│   └── data/           India city data: AQI (32 cities), CoL, WBGT, transit costs, fuel rates
├── firebase/           Auth wrappers, auto-auth with device fingerprinting, Firestore config
├── store/              3 Zustand stores (resume, employer, bridge) with IndexedDB persistence
├── pages/              Route components
├── layout/             Navbar (mode toggle, AI badge, theme, mobile drawer), Footer
├── pitch/              10-slide presentation deck with keyboard nav and fullscreen
├── hooks/              Theme toggle (useSyncExternalStore)
├── theme/              CSS custom properties (light / dark / print)
└── utils/              PDF export, print, demo data
firebase/
└── functions/          6 Cloud Functions + 1 Firestore trigger (publish, sign, match, reply, heartbeat, session)
```

## Cloud Functions

| Function | Type | What it does |
|---|---|---|
| `publishCriteria` | Callable | Creates criteria doc with 6-char short code + HMAC signing secret. 90-day expiry. |
| `startTestSession` | Callable | Blocks same-resume or same-device retesting. Creates active session. |
| `heartbeat` | Callable | Updates session liveness timestamp every 30 s. |
| `signScorecard` | Callable | HMAC-SHA256 signs canonical JSON payload. Marks session completed. |
| `sendMatchSignal` | Callable | Stores candidate interest with scores and gap metric. |
| `replyToMatch` | Callable | One reply per match enforced. Updates match status. |
| `onMatchCreated` | Trigger | On new match: creates employer notification + queues SendGrid email. |

## Deployment

**Vercel** — auto-deploys from the `main` branch on every push via the GitHub integration.

| Domain | Type |
|---|---|
| [astha-capstone.dmj.one](https://astha-capstone.dmj.one) | Custom production domain |
| `astha-resume-theta.vercel.app` | Vercel default |
| `astha-resume-dmjone.vercel.app` | Team alias |
| `astha-resume-git-main-dmjone.vercel.app` | Branch alias |

**Repository** — [divyamohan1993/astha-react-fullstack-resume-builder-capstone](https://github.com/divyamohan1993/astha-react-fullstack-resume-builder-capstone)

## Research Citations

All scoring weights and formulas cite peer-reviewed research. Key references:

- **NACE Job Outlook 2024** — skill weights, GPA cutoffs, employer preferences
- **AAC&U VALUE Rubrics** — project quality assessment
- **Ladders Eye-Tracking Study 2018** — resume completeness impact
- **Henle, Dineen & Duffy 2019** — resume fraud taxonomy (fabrication, embellishment, omission)
- **Marinescu & Rathelot 2018** *(AEJ)* — distance decay in job search
- **Bloom et al. 2024** *(Nature)* — remote and hybrid work productivity
- **WHO/ILO Pega 2021** — work hours and health
- **Clark et al. 2020; Stutzer & Frey 2008** — commute and wellbeing
- **Roulin & Bangerter 2013** — extracurricular signaling
- **Yao et al. 2023** — ReAct reasoning traces
- **Wang et al. 2024** — E5 embedding model
- **Sanh et al. 2019** — DistilBERT

## License

Released under the [MIT License](LICENSE). Copyright © 2025 Astha Chandel.

---

<div align="center">
Made with care for <b>#AatmanirbharBharat @India2047</b>.<br>
<sub>If this project helped you, consider giving it a ⭐ on GitHub.</sub>
</div>
