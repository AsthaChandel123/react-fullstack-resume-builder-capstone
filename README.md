# ResumeAI

**Live:** [resumeai-409924770511.asia-south1.run.app](https://resumeai-409924770511.asia-south1.run.app)

BTech CSE Capstone Project | Shoolini University | Astha Chandel (GF202214559)

---

AI-powered resume builder and employer screening platform with a trust layer (Bridge) connecting both sides. Research-cited scoring. Gemma 4 in-browser AI. Skill verification testing with anti-cheat. Cryptographic scorecards.

## For Students

- Build ATS-optimized resumes with 4 templates (ATS Classic, Modern Blue, Creative, Minimal)
- AI Resume Coach scores your resume with research-cited suggestions (max 92%)
- Self-assess against employer criteria via shared Bridge links
- Take adaptive skill verification tests to prove claimed skills
- Send verified scorecards to employers with gap analysis

## For Employers

- Post JDs and upload resumes for AI-scored candidate screening
- Publish criteria with custom scoring weights, share via QR code or link
- Manage published criteria (pause, resume, close)
- Receive match signals from verified candidates
- View scorecards with resume-vs-verified gap metric

## Bridge: The Trust Layer

No platform connects resume building, employer screening, and skill verification. Bridge does.

1. Employer publishes criteria with a shareable link
2. Student opens link, scores their resume against the JD
3. AI Coach suggests JD-specific improvements
4. Student takes an adaptive, timed, anti-cheat test
5. Signed scorecard proves competence, not just claims

## AI Pipeline

4-layer progressive pipeline. Runs in-browser. Falls back gracefully.

| Layer | Tech | Purpose |
|-------|------|---------|
| L1 | NLP | Keyword extraction, section detection, Jaccard + TF-IDF |
| L2 | Embeddings | ONNX E5-small semantic similarity |
| L3 | Gemma 4 E2B | In-browser reasoning (WebGPU) for red flag detection |
| L4 | Gemini API | Cloud fallback when no WebGPU available |

Scoring weights cite: NACE 2024, AAC&U VALUE Rubric, Ladders Eye-Tracking 2018, Henle et al. fraud taxonomy, Marinescu & Rathelot 2018.

## Anti-Cheat

- Reading speed calibration for per-question dynamic timing
- Silent integrity scoring (tab switches, paste, speed anomalies)
- Three-layer audio intelligence (speech vs noise classification)
- Resume pinning prevents score gaming after testing
- Device fingerprinting (one device = one identity)

## Tech Stack

| | |
|-|-|
| Frontend | React 19, TypeScript 5.8, Vite 6, Tailwind CSS 4, Zustand 5 |
| AI/ML | Gemma 4 E2B (Transformers.js), ONNX E5-small, TF-IDF, Gemini API |
| Backend | Firebase Auth, Firestore, Cloud Functions |
| Testing | Vitest, React Testing Library, 419 tests |
| Deploy | Google Cloud Run |

## Development

```bash
npm install
cp .env.example .env   # Add Firebase + Gemini keys
npm run dev             # Start dev server
npm test                # 419 tests
npm run build           # Production build
```

## Project Structure

```
src/
  ai/           4-layer AI pipeline, scoring, model loaders
  bridge/       Bridge trust layer (test engine, scorecards, matching)
  builder/      Resume builder (templates, AI coach, drag-drop)
  employer/     Employer screening dashboard
  firebase/     Auth, Firestore, device fingerprinting
  store/        Zustand stores (resume, employer, bridge)
firebase/
  functions/    Cloud Functions (signing, matching, notifications)
```
