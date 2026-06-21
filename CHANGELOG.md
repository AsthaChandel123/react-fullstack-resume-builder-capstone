# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added (ATS 90+ + editable PDF, 2026-05-15)
- **`src/builder/ats/genericJD.ts`**: Fixed benchmark Software Engineer / Data Analyst JD plus the canonical hard-skill list, soft-skill list, and ATS-friendly action verbs. The JD is what every builder-time ATS score is measured against when no real employer JD is loaded.
- **`src/builder/ats/atsScore.ts`** (`computeAtsScore`): Wraps the existing `analyzeL1` + sync `analyzeL2` + `computeScore` pipeline against the generic JD, then layers a direct hard-skill coverage signal on top to address the dilution of TF-IDF cosine over long mixed documents. Returns `{score, breakdown, missingForNinety, matchedSkills, resumeText}`. Empty optional sections (certifications, extracurricular, GPA) have their weight redistributed the same way ScoreAgent already handles missing distance.
- **`src/builder/ats/autoComplete.ts`** (`autoCompleteResume`): Pure function that synthesizes a 90+ ATS resume without inventing any candidate data. Synthesizes the Summary paragraph from the user's own name, degree, institution, and previously-typed skills; promotes user-typed skills into the Skills section; inserts a single `[EDIT: ...]` placeholder per structurally required but empty section (Education / Experience / Projects); reorders sections into canonical ATS order; prepends "Worked on " only to bullets that lack a strong action verb (skills / certifications sections are skipped so atomic skill tokens are not mangled).
- **`src/builder/pdf/exportEditablePdf.ts`**: Editable-PDF exporter built directly on jsPDF 4.x (already a transitive dependency via html2pdf.js). Renders the resume with a real text layer (no html2canvas image rasterisation) so any ATS extracts verbatim text, AND overlays AcroForm `AcroFormTextField` instances on each editable region (name, contact, summary, primary line, duration, secondary line, every bullet). Opening the resulting PDF in Adobe Acrobat Reader, Preview, or any AcroForm-capable viewer lets the user click into the fields and edit.
- **`src/builder/components/AtsBadge.tsx`**: Live "ATS XX / 100" pill in the builder header. Recomputes on every store change. Hover / focus reveals the per-dimension breakdown, the list of matched hard skills, and the actionable list of fixes needed to clear 90.
- **`src/builder/components/AtsAutoCompleteButton.tsx`**: "Optimize for ATS (no fake data)" button that opens a diff modal showing before/after score, the placeholders that will be inserted, and the list of reformatting changes. User must explicitly accept before the store is mutated.
- **`src/builder/ats/__tests__/ats.test.ts`**: 11 Vitest specs covering (a) score >= 90 on a fully-filled resume, (b) score >= 90 on a minimal stub after autoComplete, (c) autoComplete never introduces companies / institutions / dates the user did not provide, (d) user-typed facts preserved verbatim, (e) `[EDIT: ...]` placeholders inserted for every missing required section, (f) the existing full resume does not regress.
- **Builder header** (`src/pages/Builder.tsx`): Wired `AtsBadge` + `AtsAutoCompleteButton` next to "Fill Demo Resume". New "Editable PDF" download button uses `exportEditablePdf`.
- **Saathi completion CTA** (`src/saathi/components/SaathiChat.tsx`): When the conversation completes, `autoCompleteResume` runs once automatically, the live ATS score is displayed, and a one-click "Download Editable PDF" CTA is added next to the existing preview / edit / dashboard links.

### Changed (Saathi conversation pacing + model strategy)
- **Cloud-first model strategy** (`src/saathi/engine/modelConfig.ts`): Replaced slow Gemma-3-27B-cloud-primary + Gemini-flash-backup with Gemini 2.5 Flash Lite primary + Gemini 2.5 Flash backup. Sub-second responses on typical Saathi prompts. Hard cloud timeout dropped from 15 s to 8 s; new local-model deadline of 4 s.
- **Deadline-based race with on-device model** (`src/saathi/engine/aiExtractor.ts`): On-device Gemma 4 E2B is no longer the default chat path. New routing matrix:
  - Online + no offline preference → Gemini Flash Lite directly (fast).
  - Online + user opted into offline mode → race local Gemma against a 4 s deadline; if it doesn't beat the deadline, the cloud call wins for that turn.
  - Truly offline + local cached → local only.
  - Truly offline + no local → throws a clear "no AI available" error instead of stalling.
  An `isOfflineModePreferred()` / `setOfflineModePreferred()` flag controls the opt-in.
- **Bulk-question conversation flow** (`src/saathi/engine/aiResponseGenerator.ts`): Rewrote the response prompt so each Saathi turn asks for an entire phase cluster at once (e.g. "degree + college + year + field" in one message) instead of one slot at a time. Six phase clusters defined: warmup, education, experience, projects, skills, wrapup. Reduces conversation length from 10+ turns to ~5-6.
- **Internal slot-aware validation** (`src/saathi/engine/aiResponseGenerator.ts`): Before returning a model-generated response, `looksLikeStaleAsk()` cross-checks it against the filled-slot list and rolls forward to a deterministic cluster prompt if the model tries to re-ask something already collected. Eliminates "asking me what I already told you."

### Fixed
- **`autoAuth.ts` permission-denied loop** (`src/firebase/autoAuth.ts`): The function called `getDoc(deviceRef)` on a non-existent doc to decide whether to create or update — but the strict read rule (`resource.data.uid == request.auth.uid`) evaluates to false when `resource` is null, throwing permission-denied before either branch could run. Replaced with idempotent merge-writes (no pre-read) that satisfy both create and update rules. The deeper issue you saw on the live site is that the *deployed* Firestore rules are still the old ones — run `firebase deploy --only firestore:rules` to pick up the new rules.

### Added
- **Consolidated server API** (`firebase/functions/src/index.ts`): Replaced 9 separate `httpsCallable` Cloud Functions with one Express app exported as a single Firebase Functions v2 `onRequest` (Cloud Run under the hood). One deployable artifact, one origin, per-instance concurrency 80, explicit CORS allowlist (dmj.one + vercel.app + localhost), Firebase ID-token auth middleware, uniform `{error, code}` JSON error shape. Firestore trigger `onMatchCreated` kept separate (cannot be wired through Express).
- **Client API wrapper** (`src/firebase/apiClient.ts`): Typed surface for the consolidated API. Replaces five `httpsCallable` call sites in `resumeShare.ts`, `TestEngine.tsx`, `ScorecardView.tsx`, `EmployerMatchDashboard.tsx`, `CriteriaPublishForm.tsx`. Base URL auto-derived from `VITE_FIREBASE_PROJECT_ID`, overridable via `VITE_API_BASE` for emulator use.
- **Service worker update toast** (`src/pwaRegister.ts` + wired into `main.tsx`): Non-blocking notification when a new SW activates, with reload + dismiss actions.

### Changed
- **PWA precache scope** (`vite.config.ts`): globPatterns broadened from 4 explicit asset names to `**/*.{html,js,css,svg,png,webmanifest,woff,woff2,ttf}` — precache grew from 11 entries to 55 (3.3 MB), so every route chunk plus `firebase`, `vendor`, `state`, `ort.bundle` are now available offline. Added runtime caching for HuggingFace model weights (CacheFirst, 180-day TTL), wasm files, jsDelivr, and Google Fonts. `maximumFileSizeToCacheInBytes` raised to 4 MB; `skipWaiting` + `clientsClaim` enabled.
- **Firebase SDK 11 → 12** (`package.json`): Latest major bumped. firebase-admin 13 and firebase-functions 6 already current; no source changes required.
- **npm overrides** (`package.json`, `firebase/functions/package.json`): Pinned `protobufjs ^7.5.5`, `dompurify ^3.4.0`, `postcss ^8.5.10`, `fast-uri ^3.1.2`, `@babel/plugin-transform-modules-systemjs ^7.29.4`, plus functions-side `fast-xml-parser ^5.7.0` / `fast-xml-builder ^1.2.0`. Result: client npm audit went from 1 critical + 2 high + 3 moderate to **0 vulnerabilities**; functions side from 1 critical + 1 high + 2 moderate + 9 low to **9 low** (all transitive in firebase-admin's google-cloud chain, none server-reachable).

### Fixed
- **Firestore "Missing or insufficient permissions" on `emailDevices`** (`firebase/firestore.rules`): The previous rule required `resource.data.uid == request.auth.uid` on update, but `bindEmailToDevice` never wrote a `uid` field, so the first merge-update after the initial create was always denied. Reworked the rule so any authenticated user may add their device to an email's binding, with the email field pinned to its original value and writes restricted to `email`, `devices`, `lastSeen`. Devices rule similarly tightened: explicit field allowlist on create and update, no deletes.
- **PWA registration** (`vite.config.ts`): `injectRegister: 'auto'` made explicit so the SW registration script is always emitted.

## [1.0.0] - 2026-04-07

### Added
- **Capstone Report** (`/capstone-report`): Full 8-chapter BTech CSE capstone report in print-perfect A4 format with Times New Roman, academic formatting, 33 APA citations, and 3 appendices
- **README rewrite**: Complete rewrite from code truth covering all three modules (Saathi, Employer Pipeline, Bridge), 516 verified tests, wellbeing engine, security architecture, and deployment details
- **Vercel deployment config** (`vercel.json`): SPA routing with security headers
- **Project Report Format reference** (`Project Report Format.md`): Shoolini University report template

### Changed
- **Pitch deck slides**: Fixed 4 factual inaccuracies (23 slots not 24, 7 phases not 5, 186 skills not 189, 12 research papers not 13)
- **Pitch deck navigation**: Redesigned with auto-hide nav, fullscreen toggle (F key), keyboard controls, progress bar
- **All 10 pitch slides**: Updated with cohesive color palette and accurate data
- **`idea.md`**: Updated tech stack from incorrect (Bootstrap/Django/SQL) to actual (React 19/TypeScript/Firebase/IndexedDB)

### Removed
- `docs/superpowers/` internal planning docs from git tracking (already in `.gitignore`)
- `netlify.toml` (replaced with Vercel deployment)

## [0.9.0] - 2026-04-07

### Added
- **Real AI conversation engine**: Gemini 2.5 Flash + Gemma 4 E2B for Hinglish understanding in Saathi
- Three-tier AI fallback: Gemini API (instant) -> Gemma 4 E2B in-browser (offline) -> regex (always available)
- `aiExtractor.ts`: Structured entity extraction handling Hindi, Hinglish, Tamil, Telugu, Kannada, Bengali, Marathi, Gujarati, Punjabi
- `aiResponseGenerator.ts`: Natural conversational responses matching user's language style
- Async `processUserInputAsync()` alongside sync fallback in slot machine
- "Saathi is thinking..." indicator during AI processing

### Changed
- Architecture slide: cohesive teal/orange gradient palette replacing traffic-light colors
- WCAG AAA contrast on landing page: solid navy background with 12.5:1 contrast ratio

### Fixed
- Entity extraction precision with Content Security Policy updates
- Final verification pass: 516/516 tests confirmed passing

## [0.8.0] - 2026-04-07

### Changed
- Jobs-level polish pass across 19 files and 5 audit categories

### Fixed
- Firebase Hosting deployment with security headers

## [0.7.0] - 2026-04-06

### Added
- **Saathi conversational resume builder**: 23-slot, 7-phase slot-filling engine with 241 response templates
- **Wellbeing scoring engine**: 8 research-cited parameters (commute, work hours, work mode, real salary, air quality, attrition, heat stress, commute cost) across 32 Indian cities
- **DistilBERT-NER** (Xenova/distilbert-NER, INT8, ~67MB) for named entity recognition
- **Voice input**: Web Speech API with 10-script Unicode detection (Devanagari, Tamil, Bengali, Telugu, Malayalam, Gujarati, Kannada, Punjabi, Odia, Latin)
- **Language detection**: Automatic BCP-47 tag mapping for speech recognition
- `resumeGenerator.ts`: Converts conversation slots to structured Resume objects
- Candidate wellbeing dashboard with career health scoring

### Changed
- Agentic pipeline overhauled with DAG executor (Kahn's algorithm)
- Switched to `dmjone` Firebase project with deployed Cloud Functions

## [0.6.0] - 2026-04-06

### Added
- **Device fingerprinting**: 11 hardware signals (GPU, audio, screen, CPU, memory) hashed with SHA-256
- **Silent auto-auth**: Anonymous Firebase authentication with device-to-email binding
- **Email-device binding** for identity tracking across sessions
- Employer criteria management dashboard with pause/resume/close controls
- Resume upload on Bridge page
- Mode-based navigation: Student/Employer toggle shows relevant links only
- Auto-detect AI level based on device capabilities
- One-click demo resume fill

### Changed
- Model download progress clamped to 0-100%
- AI Coach scoring requires actual content, not just section headers

### Fixed
- Store `reset()` now persists to IndexedDB
- Auth flow: graceful Google OAuth fallback
- Removed auth modals, replaced with silent anonymous auto-auth

## [0.5.0] - 2026-04-06

### Added
- **Bridge Trust Layer** complete implementation:
  - `BridgeAssessment` with self-scoring pipeline
  - `JDCoachPanel` with inline skill suggestions
  - `TestEngine` with adaptive difficulty, anti-cheat monitoring, anti-OCR rendering
  - `CalibrationPhase` for reading speed and voice baseline measurement
  - `ScorecardView` with HMAC-SHA256 signature verification
  - `CriteriaPublishForm` with weight editor, custom signals, QR sharing
  - `EmployerMatchDashboard` with real-time Firestore listeners
  - `CandidateDashboard` for tracking application status
- **Anti-cheat system**: Browser event monitoring (tab switch, paste, fullscreen), speed anomaly detection, three-layer audio intelligence (spectral/temporal/adaptive)
- **Question generator**: Gemini 2.0 Flash with anti-LLM-tell validation (char variance <20%, correct-not-longest, no qualifier stacking)
- **Adaptive scoring engine**: 5 difficulty levels, score ceilings (L2:45, L3:75, L4:90), level multipliers (1.0x-6.0x), sustained performance bonus
- **Resume pinning**: SHA-256 hash + multi-n-gram Jaccard change detection
- **Bridge Zustand store** with IndexedDB persistence and 20+ state management actions
- **Firebase Cloud Functions**: `publishCriteria`, `startTestSession`, `heartbeat`, `signScorecard`, `sendMatchSignal`, `replyToMatch`, `onMatchCreated` trigger
- **Firestore security rules**: Server-only writes for scorecards, matches, notifications

### Changed
- Scorecard version mismatch annotation
- Collection name consistency across client and server

## [0.4.0] - 2026-04-06

### Added
- **Gemma 4 E2B** via @huggingface/transformers (Q4, ~1.5GB) replacing Gemma 3
- **ONNX E5-small-v2** embeddings (384-dim) replacing MiniLM-L6-v2
- L4 Gemini API fallback for non-WebGPU devices
- Mandatory model download screen with progress UI

### Changed
- WebLLM replaced with Transformers.js v4 for model loading

## [0.3.0] - 2026-04-05

### Added
- **Mass resume stress tests**: 11 resume variants x 4 templates = 44+ parameterized tests (Unicode, XSS, overloaded, empty, minimal)
- **Comprehensive test suite**: 119 tests across 9 files covering stores, hooks, AI agents, templates, pages
- **AI Coach panel**: Research-cited resume scoring (0-92%) with NACE, AAC&U, Ladders citations
- PDF export with oklch-to-RGB conversion for html2canvas compatibility
- PWA icons (192px, 512px) and web manifest

## [0.2.0] - 2026-04-05

### Added
- **AI scoring pipeline**: L1 NLP (Jaccard, TF-IDF), L2 Embeddings, L3 Gemma reasoning
- **189-skill taxonomy** with aliases and adjacency graph across 10 categories
- **9-parameter scoring formula**: Skills (30%), Experience (20%), Education (15%), Projects (10%), Certifications (5%), Distance (5%), Extracurricular (5%), GPA (3%), Completeness (2%)
- **Employer analysis dashboard**: JD parser, candidate table, score breakdown, keyword analysis, red flag panel, citation tooltips
- **10-slide pitch deck** with keyboard navigation
- **4 resume templates**: ATS Classic, Modern Blue, Creative, Minimal
- Drag-and-drop section reordering via @dnd-kit
- Custom section support (list, key-value, tags, freetext layouts)
- Docker multi-stage build (node:22-alpine + nginx:alpine)
- Google Cloud Run deployment script
- nginx configuration with gzip and SPA fallback

## [0.1.0] - 2026-04-05

### Added
- **Project foundation**: Vite 6 + React 19 + TypeScript 5.8 + Tailwind CSS 4 + Zustand 5
- Client-side routing with React Router DOM 7.5
- Dark/light theme with system preference detection and localStorage persistence
- Shoolini University branding (logo, navy/red color scheme)
- Landing page with student/employer mode toggle
- Resume store with IndexedDB persistence (300ms debounced writes)
- Employer store with IndexedDB persistence
- Layout with navbar, footer, skip-to-content link

## [0.0.1] - 2025-08-27

### Added
- Initial repository setup by Astha Chandel
- Basic React application scaffold
- MIT License

[Unreleased]: https://github.com/divyamohan1993/astha-react-fullstack-resume-builder-capstone/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/divyamohan1993/astha-react-fullstack-resume-builder-capstone/compare/v0.9.0...v1.0.0
[0.9.0]: https://github.com/divyamohan1993/astha-react-fullstack-resume-builder-capstone/compare/v0.8.0...v0.9.0
[0.8.0]: https://github.com/divyamohan1993/astha-react-fullstack-resume-builder-capstone/compare/v0.7.0...v0.8.0
[0.7.0]: https://github.com/divyamohan1993/astha-react-fullstack-resume-builder-capstone/compare/v0.6.0...v0.7.0
[0.6.0]: https://github.com/divyamohan1993/astha-react-fullstack-resume-builder-capstone/compare/v0.5.0...v0.6.0
[0.5.0]: https://github.com/divyamohan1993/astha-react-fullstack-resume-builder-capstone/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/divyamohan1993/astha-react-fullstack-resume-builder-capstone/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/divyamohan1993/astha-react-fullstack-resume-builder-capstone/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/divyamohan1993/astha-react-fullstack-resume-builder-capstone/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/divyamohan1993/astha-react-fullstack-resume-builder-capstone/compare/v0.0.1...v0.1.0
[0.0.1]: https://github.com/divyamohan1993/astha-react-fullstack-resume-builder-capstone/releases/tag/v0.0.1
