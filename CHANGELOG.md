# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

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
