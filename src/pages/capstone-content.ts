export const chapterContent = `

<!-- ===== CHAPTER 1: INTRODUCTION ===== -->
<div class="report-page">
  <h2 class="chapter-title">Chapter 1: Introduction</h2>

  <h3 class="section-title">1.1 Background and Motivation</h3>

  <p>The global hiring ecosystem processes approximately 250 million job applications annually, yet studies consistently report that only 2&ndash;3% of applicants receive interview callbacks (Glassdoor, 2023). In India, the situation is more acute: an estimated 48 million job seekers compete for roughly 10 million formal-sector openings each year (CMIE, 2025), yielding an effective callback rate below 0.4%. The disparity between supply and demand is compounded by structural inefficiencies in how candidates present qualifications and how employers screen them.</p>

  <p>The resume remains the primary instrument of first contact between candidate and employer. Despite its centrality, the resume creation process has changed little in two decades. Commercial builders such as Canva, Zety, and NovoResume offer form-driven templates that assume users already know what to write, how to phrase accomplishments, and which sections recruiters prioritize. For a first-generation college graduate in a small Indian town, operating on a slow mobile network, these assumptions fail catastrophically. The user does not know that Applicant Tracking Systems parse section headings, that quantified impact statements improve callback rates, or that certain file formats lose formatting during automated parsing.</p>

  <p>On the employer side, Applicant Tracking Systems have become gatekeepers. An estimated 99% of Fortune 500 companies use ATS software (Jobscan, 2024), yet most ATS platforms operate as opaque keyword-matching engines. Candidates receive no feedback on why their resume was rejected. Employers, in turn, face a trust deficit: studies by Henle, Dineen, and Duffy (2019) document that between 33% and 75% of resumes contain some form of deception, ranging from outright fabrication to subtle embellishment. No existing platform addresses this trust gap with verifiable skill assessments tied cryptographically to the resume that was scored.</p>

  <p>A further dimension absent from current career platforms is candidate wellbeing. Employment decisions carry consequences that extend beyond salary: commute duration, air quality at the workplace city, work-hour norms, heat stress exposure, and cost-of-living adjustments all affect long-term health and job satisfaction. Clark et al. (2020) demonstrate that each additional 10 minutes of commute is equivalent to a 19% pay cut in subjective wellbeing. The WHO/ILO meta-analysis by Pega et al. (2021) links work weeks exceeding 55 hours to a 35% increase in stroke mortality. Yet no career platform surfaces these factors alongside job-fit scores.</p>

  <p>India-specific challenges intensify the problem. Linguistic diversity means users may naturally express themselves in Hindi, Hinglish (Hindi-English code-mixing), Tamil, Telugu, Bengali, or other regional languages. Network connectivity in tier-2 and tier-3 cities remains unreliable, making cloud-dependent AI pipelines impractical. Data sovereignty concerns under the Digital Personal Data Protection Act, 2023, require that personally identifiable information not leave the user&rsquo;s device without explicit consent.</p>

  <p>ResumeAI was conceived to address these intersecting problems. The platform reimagines resume building as a conversational experience guided by an AI companion named Saathi, replaces opaque ATS screening with a transparent multi-agent pipeline whose every decision is traceable, introduces a cryptographic trust layer called Bridge that binds skill verification to resume integrity, and provides a wellbeing scoring engine that helps candidates evaluate job opportunities through the lens of health and life quality.</p>

  <h3 class="section-title">1.2 Problem Statement</h3>

  <p>Existing resume-building and employer-screening platforms suffer from four interrelated deficiencies that this project seeks to address:</p>

  <ol>
    <li><strong>Form-only resume builders</strong> assume domain knowledge that first-time job seekers do not possess. They provide templates but no guidance on content, phrasing, or ATS compatibility. Users in multilingual contexts receive no support for expressing qualifications in their natural language.</li>
    <li><strong>Black-box ATS screening</strong> offers employers ranked candidate lists without explaining the rationale. Candidates receive no feedback. The absence of transparency undermines trust on both sides of the hiring process.</li>
    <li><strong>No trust layer</strong> connects resume claims to verified competencies. Employers cannot distinguish genuine qualifications from embellished ones. Candidates have no mechanism to prove their skills beyond self-reported text.</li>
    <li><strong>No wellbeing dimension</strong> exists in career platforms. Employment decisions are reduced to salary and job-title matching, ignoring commute, air quality, work hours, heat stress, and cost-of-living factors that research demonstrates have significant health consequences.</li>
  </ol>

  <h3 class="section-title">1.3 Objectives</h3>

  <p>The project aims to achieve the following seven objectives:</p>

  <ol>
    <li>Design and implement Saathi, a conversational resume-building engine using a slot-filling architecture with 23 data slots across 7 conversational phases, supporting voice input in 10 Indian languages through Unicode script detection and the Web Speech API.</li>
    <li>Build a 9-agent employer screening pipeline orchestrated through a directed acyclic graph executor implementing Kahn&rsquo;s topological sort algorithm, with a 4-tier progressive AI architecture (regex NLP, semantic embeddings, in-browser LLM reasoning, and cloud API fallback).</li>
    <li>Develop Bridge, a cryptographic trust layer that binds resume integrity to adaptive skill verification through HMAC-SHA256 signed scorecards, resume pinning via SHA-256 content hashing, and multi-layered anti-cheat proctoring combining browser integrity monitoring with three-layer audio intelligence.</li>
    <li>Implement a wellbeing scoring engine that computes 8 research-cited parameters (commute, work hours, work mode, real salary, air quality, industry attrition, heat stress, and commute cost) across 31 Indian cities with data from WHO, CPCB, IMD, Numbeo, and NASSCOM sources.</li>
    <li>Ensure WCAG 2.2 AAA accessibility compliance across all platform modules, with full keyboard navigation, screen reader support, ARIA landmarks, focus management, and reduced-motion preferences.</li>
    <li>Architect the platform as an offline-first Progressive Web Application where all AI inference runs in-browser, guaranteeing that no resume data leaves the user&rsquo;s device.</li>
    <li>Establish a comprehensive testing framework with 516 automated tests spanning unit, integration, security, accessibility, and performance domains.</li>
  </ol>

  <h3 class="section-title">1.4 Scope and Limitations</h3>

  <p>The project scope encompasses the complete frontend application including all three primary modules (Saathi, Employer Pipeline, and Bridge), the wellbeing scoring engine, and associated security, accessibility, and PWA infrastructure. The backend is limited to Firebase Authentication, Firestore for criteria and match storage, and Firebase Cloud Functions for HMAC signing operations. The platform targets modern browsers (Chrome 90+, Firefox 90+, Safari 15+, Edge 90+) on both desktop and mobile devices.</p>

  <p>Limitations include the following: (1) The L3 reasoning layer requires WebGPU support, which is available only in Chrome 113+ and Edge 113+ as of April 2026, with WASM CPU fallback adding 30&ndash;60 seconds of latency. (2) Voice input accuracy depends on the Web Speech API implementation, which varies across browsers and is not available in Firefox. (3) The wellbeing data is updated quarterly and may not reflect real-time conditions. (4) The skills taxonomy contains 186 curated entries and may not cover niche or emerging technologies. (5) Anti-cheat audio monitoring requires microphone permission, which users may decline.</p>

  <h3 class="section-title">1.5 Organization of Report</h3>

  <p>The remainder of this report is organized as follows. Chapter 2 reviews related literature across seven domains pertinent to the project. Chapter 3 presents the system analysis and design, including requirements, architecture, data flow diagrams, and database schema. Chapter 4 catalogues the tools and technologies employed. Chapter 5 details the implementation of each module with references to specific source files and algorithms. Chapter 6 describes the testing strategy and presents results. Chapter 7 discusses challenges encountered and solutions devised. Chapter 8 concludes with a summary of contributions, limitations, and future work.</p>
</div>

<!-- ===== CHAPTER 2: LITERATURE REVIEW ===== -->
<div class="report-page">
  <h2 class="chapter-title">Chapter 2: Literature Review</h2>

  <h3 class="section-title">2.1 Existing Resume Building Platforms</h3>

  <p>The landscape of resume-building tools ranges from word-processor templates to web-based SaaS platforms. Microsoft Word and Google Docs provide basic formatting but no content guidance. Dedicated platforms such as Canva, Zety, NovoResume, and Resume.io offer structured templates with drag-and-drop interfaces. However, all operate on a form-filling paradigm: the user must know what information to include, how to phrase it for ATS compatibility, and which sections to prioritize.</p>

  <p>Ladders (2018) conducted an eye-tracking study revealing that recruiters spend an average of 7.4 seconds on initial resume screening, scanning in an F-pattern that prioritizes: (1) name and title, (2) current role, (3) previous role with dates, and (4) education. This finding suggests that resume builders should optimize section order and content density for rapid scanning, yet most platforms offer static templates without guidance on information hierarchy.</p>

  <p>Jobscan (2024) reports that 99% of Fortune 500 companies use Applicant Tracking Systems that parse resumes into structured fields. ATS compatibility requires specific section headings, clean formatting, and keyword alignment with job descriptions. None of the reviewed platforms provide real-time ATS compatibility scoring or suggest content modifications based on job description analysis.</p>

  <p>Conversational resume building represents an unexplored paradigm in the literature. While chatbot-based interfaces exist for customer service and healthcare intake, their application to resume construction, particularly in multilingual Indian contexts with Hindi-English code-mixing, has not been systematically addressed.</p>

  <h3 class="section-title">2.2 ATS Screening and NLP in Recruitment</h3>

  <p>Applicant Tracking Systems have evolved from simple keyword-matching engines to sophisticated NLP pipelines. Early systems relied on Boolean keyword matching, penalizing candidates who used synonyms rather than exact terms from the job description. Modern systems employ varying degrees of semantic understanding, though the specific algorithms used by commercial ATS platforms (Workday, Greenhouse, Lever) remain proprietary.</p>

  <p>The open-source community has produced several resume-matching tools. srbhr/Resume-Matcher and indiser/Beat-The-ATS implement Jaccard similarity and TF-IDF cosine similarity for resume-to-JD matching. These approaches, while computationally efficient, fail to capture semantic relationships between terms (e.g., &ldquo;React&rdquo; and &ldquo;frontend development&rdquo;).</p>

  <p>NACE Job Outlook 2024 identifies skills match as the single most important screening attribute, with 73.4% of employers screening by major and skills alignment. The survey further reports that 56.1% of employers convert interns to full-time hires, emphasizing experience relevance. These empirical findings inform the scoring weights used in ResumeAI&rsquo;s pipeline.</p>

  <p>Henle, Dineen, and Duffy (2019) propose a three-dimensional taxonomy of resume deception comprising fabrication, embellishment, and omission. Their empirical study in the Journal of Business Psychology documents that 33&ndash;75% of resumes contain some form of deception. This finding motivates the Bridge trust layer, which provides cryptographic verification of skill claims.</p>

  <h3 class="section-title">2.3 In-Browser Machine Learning</h3>

  <p>The execution of machine learning models directly in the web browser has become increasingly feasible through three enabling technologies: WebAssembly (WASM), WebGPU, and dedicated inference runtimes.</p>

  <p>WebAssembly provides near-native execution speed for compiled code in the browser. ONNX Runtime Web (version 1.24.3 used in this project) leverages WASM for running quantized neural network models with execution backends for CPU and GPU. The E5-small-v2 model used for semantic embeddings in ResumeAI&rsquo;s L2 agent produces 384-dimensional embeddings from approximately 67 million parameters, with inference times under 200 milliseconds on mid-range hardware.</p>

  <p>WebGPU, the successor to WebGL for general-purpose GPU computation, enables running large language models in the browser. The @huggingface/transformers library (version 4.0.1) provides a JavaScript interface for loading and running Hugging Face models via WebGPU or WASM fallback. ResumeAI uses this to run Gemma 4 E2B for contradiction detection and reasoning in the L3 agent layer.</p>

  <p>The privacy advantages of in-browser ML are significant. No user data leaves the device during inference. Model weights are cached in IndexedDB after initial download, enabling subsequent offline operation. This architecture aligns with the data minimization principles of the Digital Personal Data Protection Act, 2023.</p>

  <h3 class="section-title">2.4 Conversational AI and Slot-Filling Systems</h3>

  <p>Slot-filling dialogue systems originate from the ATIS (Airline Travel Information System) corpus work by Price (1990) and have evolved through decades of research in spoken language understanding. The architecture involves defining a set of semantic slots that must be filled through user interaction, with the system tracking which slots are complete, which require clarification, and which the user has explicitly declined to provide.</p>

  <p>Modern implementations of slot-filling for task-oriented dialogue include Google&rsquo;s Dialogflow and Amazon Lex. However, these cloud-based systems require API calls for each user utterance, introducing latency and data sovereignty concerns. Furthermore, they provide limited support for the Hindi-English code-mixing prevalent in Indian conversational contexts. Bali et al. (2014) document that code-mixing in Hindi-English follows predictable patterns but poses challenges for NLP systems trained predominantly on monolingual corpora.</p>

  <p>ResumeAI&rsquo;s Saathi engine implements a dual-mode slot-filling architecture: an offline regex-based mode for structured data extraction (email, phone, GPA, dates, degrees) and an AI-enhanced mode using Gemini 2.5 Flash for natural language understanding of multilingual input. This dual architecture ensures that the system functions even without network connectivity while providing superior understanding when AI services are available.</p>

  <h3 class="section-title">2.5 Online Proctoring and Anti-Cheat Systems</h3>

  <p>The COVID-19 pandemic accelerated the adoption of online proctoring for examinations and skill assessments. Commercial platforms such as ProctorU, Examity, and Honorlock employ varying combinations of webcam monitoring, browser lockdown, and AI-based anomaly detection. However, these systems are proprietary, expensive, and raise privacy concerns through continuous video surveillance.</p>

  <p>Audio-based proctoring represents a less invasive alternative. Speech detection through spectral analysis of the 300&ndash;3400 Hz formant band can identify human speech without recording or transmitting audio content. Temporal analysis of energy envelope modulation at syllabic rates (3&ndash;8 Hz) distinguishes speech from ambient noise. These techniques, combined with browser integrity monitoring (tab switches, paste events, fullscreen exits), provide a multi-layered anti-cheat system that respects user privacy by processing all audio data locally and storing no recordings.</p>

  <h3 class="section-title">2.6 Wellbeing Metrics in Employment</h3>

  <p>The relationship between employment conditions and worker wellbeing has been extensively studied. Gallup&rsquo;s Five Essential Elements framework (Rath &amp; Harter, 2010) identifies career, social, financial, community, and physical wellbeing as interconnected dimensions. Stutzer and Frey (2008) demonstrate that commute duration reduces life satisfaction with no compensating benefit from higher pay. The WHO/ILO meta-analysis by Pega et al. (2021) establishes that working 55 or more hours per week increases stroke risk by 35% and ischaemic heart disease risk by 17%.</p>

  <p>Bloom et al. (2024), published in Nature, demonstrate that hybrid work arrangements (2&ndash;3 office days) reduce quit rates by 35% with no decrease in productivity or promotion rates. Graff Zivin and Neidell (IZA World of Labour) document that a 10-unit increase in AQI corresponds to a 0.35% productivity loss, with disproportionate effects in high-pollution Indian cities. Nature Scientific Reports (2026) establishes that Wet Bulb Globe Temperature above 30&deg;C critically reduces outdoor and semi-outdoor labour productivity.</p>

  <p>Despite this extensive literature, no career platform integrates wellbeing metrics into the job evaluation process. ResumeAI addresses this gap by computing 8 research-cited wellbeing parameters for 31 Indian cities.</p>

  <h3 class="section-title">2.7 Cryptographic Integrity in Digital Assessments</h3>

  <p>Ensuring the integrity of digital assessments requires mechanisms that prevent post-hoc modification of both the assessed content and the resulting scores. SHA-256 content hashing provides tamper-evident fingerprinting: any modification to the resume content after assessment produces a different hash, detectable upon verification. HMAC-SHA256, combining a secret key with SHA-256 hashing, provides both integrity and authenticity guarantees, where the signing key is held server-side and never exposed to the client.</p>

  <p>The Web Crypto API, available in all modern browsers, provides hardware-accelerated implementations of SHA-256 and HMAC operations. ResumeAI uses <code>crypto.subtle.digest('SHA-256', ...)</code> for resume content hashing and delegates HMAC-SHA256 signing to Firebase Cloud Functions, ensuring that per-criteria secrets remain server-side.</p>

  <h3 class="section-title">2.8 Research Gap Analysis</h3>

  <p class="no-indent">Table 2.1 summarizes the identified research gaps and indicates how ResumeAI addresses each.</p>

  <div style="page-break-inside: auto;">
  <table>
    <thead>
      <tr>
        <th>Gap</th>
        <th>Current State</th>
        <th>ResumeAI Contribution</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Conversational resume building</td>
        <td>Form-only paradigm dominates; no multilingual conversational builders exist</td>
        <td>Saathi: 23-slot, 7-phase conversational engine with Hindi/Hinglish/10-language voice support</td>
      </tr>
      <tr>
        <td>Transparent ATS screening</td>
        <td>Commercial ATS are black-box; open-source tools lack multi-layer analysis</td>
        <td>9-agent DAG pipeline with 4-tier progressive AI and ReAct tracing for full decision transparency</td>
      </tr>
      <tr>
        <td>In-browser ML for privacy</td>
        <td>Most AI career tools require server-side processing of resume data</td>
        <td>All inference (NER, embeddings, LLM reasoning) runs in-browser via ONNX and WebGPU</td>
      </tr>
      <tr>
        <td>Skill verification with cryptographic integrity</td>
        <td>No platform links verified skills to resume content through tamper-evident cryptography</td>
        <td>Bridge: SHA-256 resume pinning + HMAC-SHA256 signed scorecards + adaptive testing</td>
      </tr>
      <tr>
        <td>Wellbeing in career decisions</td>
        <td>No career platform incorporates health/wellbeing metrics into job evaluation</td>
        <td>8-parameter wellbeing engine with data for 31 Indian cities and research-cited formulas</td>
      </tr>
      <tr>
        <td>Anti-cheat without video surveillance</td>
        <td>Proctoring platforms rely on invasive webcam monitoring</td>
        <td>Three-layer audio intelligence (spectral + temporal + adaptive) with browser integrity monitoring</td>
      </tr>
      <tr>
        <td>Offline-first career platform</td>
        <td>Career tools require persistent internet connectivity</td>
        <td>PWA with IndexedDB persistence, service worker caching, and offline-capable AI inference</td>
      </tr>
    </tbody>
  </table>
  <p class="table-caption">Table 2.1: Research Gap Analysis</p>
  </div>
</div>

<!-- ===== CHAPTER 3: SYSTEM ANALYSIS AND DESIGN ===== -->
<div class="report-page">
  <h2 class="chapter-title">Chapter 3: System Analysis and Design</h2>

  <h3 class="section-title">3.1 Requirement Analysis</h3>

  <h4 class="subsection-title">3.1.1 Functional Requirements</h4>

  <div style="page-break-inside: auto;">
  <table>
    <thead>
      <tr><th>ID</th><th>Requirement</th><th>Module</th></tr>
    </thead>
    <tbody>
      <tr><td>FR-1</td><td>The system shall provide a conversational interface for resume building with slot-filling dialogue management across 7 phases.</td><td>Saathi</td></tr>
      <tr><td>FR-2</td><td>The system shall accept voice input in 10 Indian languages via the Web Speech API with automatic Unicode script detection.</td><td>Saathi</td></tr>
      <tr><td>FR-3</td><td>The system shall extract structured entities (email, phone, GPA, degree, skills, dates, date ranges, LinkedIn, GitHub) from natural text using regex patterns and optionally NER models.</td><td>Saathi</td></tr>
      <tr><td>FR-4</td><td>The system shall generate a complete Resume object from filled conversation slots, supporting multiple entries for education, experience, and projects.</td><td>Saathi</td></tr>
      <tr><td>FR-5</td><td>The system shall analyze resumes against job descriptions using a 9-agent DAG pipeline with parallel execution and 4-tier AI (regex NLP, ONNX embeddings, WebGPU LLM, Gemini API fallback).</td><td>Employer</td></tr>
      <tr><td>FR-6</td><td>The system shall compute a 9-parameter weighted composite score for each candidate with research-cited weights.</td><td>Employer</td></tr>
      <tr><td>FR-7</td><td>The system shall publish employer criteria with customizable skill requirements, scoring weights, and test configuration.</td><td>Bridge</td></tr>
      <tr><td>FR-8</td><td>The system shall administer adaptive skill verification tests with 5 difficulty levels and anti-LLM-tell question validation.</td><td>Bridge</td></tr>
      <tr><td>FR-9</td><td>The system shall produce cryptographically signed scorecards using HMAC-SHA256 with per-criteria secrets.</td><td>Bridge</td></tr>
      <tr><td>FR-10</td><td>The system shall compute an 8-parameter wellbeing score for job opportunities across 31 Indian cities.</td><td>Wellbeing</td></tr>
    </tbody>
  </table>
  <p class="table-caption">Table 3.1: Functional Requirements</p>
  </div>

  <h4 class="subsection-title">3.1.2 Non-Functional Requirements</h4>

  <div style="page-break-inside: auto;">
  <table>
    <thead>
      <tr><th>ID</th><th>Requirement</th><th>Category</th></tr>
    </thead>
    <tbody>
      <tr><td>NFR-1</td><td>All AI inference shall execute in-browser. No resume data shall be transmitted to external servers during analysis.</td><td>Privacy</td></tr>
      <tr><td>NFR-2</td><td>The application shall function offline after initial load, with IndexedDB persistence for all user data.</td><td>Availability</td></tr>
      <tr><td>NFR-3</td><td>The platform shall comply with WCAG 2.2 AAA accessibility guidelines across all modules.</td><td>Accessibility</td></tr>
      <tr><td>NFR-4</td><td>L1 NLP analysis shall complete in under 50 milliseconds. L2 embedding analysis shall complete in under 200 milliseconds.</td><td>Performance</td></tr>
      <tr><td>NFR-5</td><td>The platform shall enforce Content Security Policy, HTTP Strict Transport Security, and Subresource Integrity headers.</td><td>Security</td></tr>
      <tr><td>NFR-6</td><td>The test suite shall maintain a minimum of 500 automated tests covering unit, integration, security, and accessibility domains.</td><td>Quality</td></tr>
    </tbody>
  </table>
  <p class="table-caption">Table 3.2: Non-Functional Requirements</p>
  </div>

  <h3 class="section-title">3.2 System Architecture Overview</h3>

  <p>ResumeAI employs a client-heavy architecture where the React 19 frontend performs all computation-intensive operations. The backend is limited to Firebase services: Authentication for user identity, Firestore for persistent storage of criteria and match signals, and Cloud Functions for cryptographic signing operations that require server-side secrets.</p>

  <p>The frontend is organized into five primary modules, each encapsulated in its own directory with dedicated state management, business logic, and UI components: (1) <code>src/saathi/</code> for the conversational engine, (2) <code>src/ai/</code> for the employer screening pipeline, (3) <code>src/bridge/</code> for the trust layer, (4) <code>src/wellbeing/</code> for the wellbeing engine, and (5) <code>src/builder/</code> for the form-based resume editor. Shared state is managed through Zustand stores (<code>src/store/</code>) with IndexedDB persistence via a custom adapter (<code>src/store/persist.ts</code>).</p>

  <p>The AI subsystem implements a 4-tier progressive architecture: L1 performs regex-based NLP with TF-IDF and Jaccard similarity (zero dependencies, instant execution); L2 computes semantic embeddings using E5-small-v2 via ONNX Runtime Web; L3 deploys Gemma 4 E2B through WebGPU for reasoning and contradiction detection; L4 falls back to the Gemini API when local inference is unavailable. Each tier builds on the previous, and the system degrades gracefully when higher tiers are inaccessible.</p>

  <div class="diagram" style="margin: 16pt 0; padding: 12pt; border: 1px solid #ccc; background: #fafafa; page-break-inside: avoid;">
    <div style="display: flex; flex-direction: column; align-items: center; gap: 6pt; font-size: 10pt; font-family: system-ui, sans-serif;">
      <!-- Row 1: React SPA -->
      <div style="padding: 6pt 18pt; border: 2px solid #182B49; border-radius: 4pt; background: #e8edf3; text-align: center; font-weight: bold;">React 19 SPA (TypeScript 5.8)</div>
      <span style="font-size: 14pt;">&#8595;</span>
      <!-- Row 2: Three stores -->
      <div style="display: flex; justify-content: center; align-items: center; gap: 8pt; flex-wrap: wrap;">
        <div style="padding: 6pt 12pt; border: 2px solid #182B49; border-radius: 4pt; background: #e8edf3; text-align: center;">resumeStore</div>
        <div style="padding: 6pt 12pt; border: 2px solid #182B49; border-radius: 4pt; background: #e8edf3; text-align: center;">employerStore</div>
        <div style="padding: 6pt 12pt; border: 2px solid #182B49; border-radius: 4pt; background: #e8edf3; text-align: center;">bridgeStore</div>
      </div>
      <div style="display: flex; justify-content: center; gap: 24pt;">
        <span style="font-size: 14pt;">&#8595;</span>
        <span style="font-size: 14pt;">&#8595;</span>
      </div>
      <!-- Row 3: Persistence + Firebase -->
      <div style="display: flex; justify-content: center; align-items: center; gap: 16pt; flex-wrap: wrap;">
        <div style="padding: 6pt 12pt; border: 2px solid #4a7c59; border-radius: 4pt; background: #e8f3e8; text-align: center;">IndexedDB<br><span style="font-size: 9pt;">(Offline Persistence)</span></div>
        <div style="padding: 6pt 12pt; border: 2px solid #c47a20; border-radius: 4pt; background: #f3ede8; text-align: center;">Firebase<br><span style="font-size: 9pt;">Auth + Firestore + Cloud Functions</span></div>
      </div>
      <span style="font-size: 14pt;">&#8595;</span>
      <!-- Row 4: AI Pipeline -->
      <div style="padding: 6pt 12pt; border: 2px solid #182B49; border-radius: 4pt; background: #dde4f0; text-align: center; font-weight: bold;">4-Tier AI Pipeline</div>
      <div style="display: flex; justify-content: center; align-items: center; gap: 6pt; flex-wrap: wrap;">
        <div style="padding: 4pt 8pt; border: 1px solid #555; border-radius: 3pt; background: #f5f5f5; text-align: center; font-size: 9pt;">L1: Regex NLP</div>
        <span style="font-size: 12pt;">&#8594;</span>
        <div style="padding: 4pt 8pt; border: 1px solid #555; border-radius: 3pt; background: #f5f5f5; text-align: center; font-size: 9pt;">L2: ONNX Embed</div>
        <span style="font-size: 12pt;">&#8594;</span>
        <div style="padding: 4pt 8pt; border: 1px solid #555; border-radius: 3pt; background: #f5f5f5; text-align: center; font-size: 9pt;">L3: WebGPU LLM</div>
        <span style="font-size: 12pt;">&#8594;</span>
        <div style="padding: 4pt 8pt; border: 1px solid #555; border-radius: 3pt; background: #f5f5f5; text-align: center; font-size: 9pt;">L4: Gemini API</div>
      </div>
      <span style="font-size: 14pt;">&#8595;</span>
      <!-- Row 5: PWA -->
      <div style="padding: 6pt 18pt; border: 2px solid #182B49; border-radius: 4pt; background: #e8edf3; text-align: center;">PWA / Workbox Service Worker</div>
    </div>
    <p class="figure-caption">Figure 3.1: System Architecture Diagram</p>
  </div>

  <h3 class="section-title">3.3 Saathi Conversational Engine Design</h3>

  <p>The Saathi engine implements a slot-filling dialogue architecture defined in <code>src/saathi/engine/slots.ts</code>. The system defines 23 data slots organized into two priority tiers: 8 required slots (name, email, phone, location, degree, institution, graduation year, field of study) and 15 preferred slots (GPA, company, role, dates, bullets, project name, project tech, project outcome, skills, certifications, summary, LinkedIn, GitHub, relocation preference, target role).</p>

  <p>Conversation flow proceeds through 7 phases defined by the <code>ConversationPhase</code> type: warmup, education, experience, projects, skills, wrapup, and review. Phase transitions are governed by the <code>updatePhase()</code> function in <code>src/saathi/engine/slotMachine.ts</code>, which examines slot completion state to determine the appropriate next phase. Users may skip non-required phases through negation detection (<code>NEGATION_RE</code> pattern: &ldquo;no&rdquo;, &ldquo;none&rdquo;, &ldquo;skip&rdquo;, &ldquo;nahi&rdquo;, &ldquo;nhi&rdquo;, &ldquo;not applicable&rdquo;).</p>

  <p>The engine operates in dual processing modes. In offline mode, <code>processUserInput()</code> performs synchronous entity extraction via regex patterns in <code>src/saathi/engine/entityExtractor.ts</code> and fills slots through pattern matching for names, locations, institutions, skills, and experience details. In AI-enhanced mode, <code>processUserInputAsync()</code> invokes Gemini 2.5 Flash through <code>src/saathi/engine/aiExtractor.ts</code> for natural language understanding of Hinglish and regional language inputs, with structured JSON output conforming to the <code>AIExtractedData</code> schema.</p>

  <p>The response generation system maintains 220 templates organized across 24 response categories in <code>src/saathi/engine/responseBank.ts</code>. Templates support variable interpolation (name, location, degree, institution, year, field, company, role, skills_list, project) and rotate through variants using a round-robin <code>pickVariant()</code> function to avoid repetitive responses.</p>

  <div class="diagram" style="margin: 16pt 0; padding: 12pt; border: 1px solid #ccc; background: #fafafa; page-break-inside: avoid;">
    <div style="display: flex; justify-content: center; align-items: center; gap: 4pt; flex-wrap: wrap; font-size: 10pt; font-family: system-ui, sans-serif;">
      <div style="padding: 6pt 8pt; border: 2px solid #182B49; border-radius: 4pt; background: #e8edf3; text-align: center;">Warmup<br><span style="font-size: 8pt; color: #555;">3 slots</span></div>
      <span style="font-size: 14pt;">&#8594;</span>
      <div style="padding: 6pt 8pt; border: 2px solid #182B49; border-radius: 4pt; background: #e8edf3; text-align: center;">Education<br><span style="font-size: 8pt; color: #555;">5 slots</span></div>
      <span style="font-size: 14pt;">&#8594;</span>
      <div style="padding: 6pt 8pt; border: 2px solid #182B49; border-radius: 4pt; background: #e8edf3; text-align: center;">Experience<br><span style="font-size: 8pt; color: #555;">4 slots</span></div>
      <span style="font-size: 14pt;">&#8594;</span>
      <div style="padding: 6pt 8pt; border: 2px solid #182B49; border-radius: 4pt; background: #e8edf3; text-align: center;">Projects<br><span style="font-size: 8pt; color: #555;">3 slots</span></div>
      <span style="font-size: 14pt;">&#8594;</span>
      <div style="padding: 6pt 8pt; border: 2px solid #182B49; border-radius: 4pt; background: #e8edf3; text-align: center;">Skills<br><span style="font-size: 8pt; color: #555;">4 slots</span></div>
      <span style="font-size: 14pt;">&#8594;</span>
      <div style="padding: 6pt 8pt; border: 2px solid #182B49; border-radius: 4pt; background: #e8edf3; text-align: center;">Wrapup<br><span style="font-size: 8pt; color: #555;">4 slots</span></div>
      <span style="font-size: 14pt;">&#8594;</span>
      <div style="padding: 6pt 8pt; border: 2px solid #4a7c59; border-radius: 4pt; background: #e8f3e8; text-align: center; font-weight: bold;">Review<br><span style="font-size: 8pt; color: #555;">Resume</span></div>
    </div>
    <p style="text-align: center; font-size: 9pt; margin: 6pt 0 0 0; color: #555; text-indent: 0;">23 total slots: 8 required + 15 preferred. Negation detection enables phase skipping.</p>
    <p class="figure-caption">Figure 3.2: Saathi Conversation Flow (7 Phases)</p>
  </div>

  <h3 class="section-title">3.4 AI Pipeline Design</h3>

  <p>The employer screening pipeline is implemented as a directed acyclic graph of 9 specialized agents, defined in <code>src/ai/orchestrator/agenticPipeline.ts</code>. The DAG executor in <code>src/ai/orchestrator/dagExecutor.ts</code> implements Kahn&rsquo;s topological sort algorithm for cycle detection and parallel execution scheduling.</p>

  <p>The pipeline DAG structure is as follows: JD Processor, L1 NLP, L2 Embed, and Distance agents have no blocking dependencies and execute concurrently at pipeline start. Skills Matcher depends on JD Processor and L1 NLP. L3 Reason depends on L1 NLP and L2 Embed. L4 Fallback depends on L3 Reason (runs only if L3 fails). Scorer depends on all preceding agents. Coach depends on Scorer and is optional.</p>

  <p>Each agent writes to a shared Blackboard data structure and logs decisions using the ReAct (Reasoning + Acting) trace pattern implemented in <code>src/ai/orchestrator/tracing.ts</code>. Each trace step records the agent&rsquo;s reasoning, the action taken, and the observation produced, enabling full transparency of the scoring decision chain.</p>

  <div class="diagram" style="margin: 16pt 0; padding: 12pt; border: 1px solid #ccc; background: #fafafa; page-break-inside: avoid;">
    <div style="display: flex; flex-direction: column; align-items: center; gap: 6pt; font-size: 10pt; font-family: system-ui, sans-serif;">
      <!-- Tier 1: Parallel -->
      <div style="font-size: 9pt; font-weight: bold; color: #555;">Tier 1 (parallel)</div>
      <div style="display: flex; justify-content: center; align-items: center; gap: 6pt; flex-wrap: wrap;">
        <div style="padding: 5pt 10pt; border: 2px solid #182B49; border-radius: 4pt; background: #e8edf3; text-align: center;">JD Parser</div>
        <div style="padding: 5pt 10pt; border: 2px solid #182B49; border-radius: 4pt; background: #e8edf3; text-align: center;">L1 NLP</div>
        <div style="padding: 5pt 10pt; border: 2px solid #182B49; border-radius: 4pt; background: #e8edf3; text-align: center;">L2 Embed</div>
        <div style="padding: 5pt 10pt; border: 2px solid #182B49; border-radius: 4pt; background: #e8edf3; text-align: center;">Distance</div>
      </div>
      <span style="font-size: 14pt;">&#8595;</span>
      <!-- Tier 2 -->
      <div style="font-size: 9pt; font-weight: bold; color: #555;">Tier 2 (depends on Tier 1)</div>
      <div style="display: flex; justify-content: center; align-items: center; gap: 6pt; flex-wrap: wrap;">
        <div style="padding: 5pt 10pt; border: 2px solid #182B49; border-radius: 4pt; background: #dde4f0; text-align: center;">Skills Matcher</div>
        <div style="padding: 5pt 10pt; border: 2px solid #182B49; border-radius: 4pt; background: #dde4f0; text-align: center;">L3 Reason</div>
      </div>
      <span style="font-size: 14pt;">&#8595;</span>
      <!-- Tier 3 -->
      <div style="font-size: 9pt; font-weight: bold; color: #555;">Tier 3 (fallback)</div>
      <div style="padding: 5pt 10pt; border: 2px dashed #c47a20; border-radius: 4pt; background: #f3ede8; text-align: center;">L4 Fallback <span style="font-size: 8pt;">(if L3 fails)</span></div>
      <span style="font-size: 14pt;">&#8595;</span>
      <!-- Tier 4 -->
      <div style="font-size: 9pt; font-weight: bold; color: #555;">Tier 4</div>
      <div style="padding: 5pt 10pt; border: 2px solid #4a7c59; border-radius: 4pt; background: #e8f3e8; text-align: center; font-weight: bold;">Scorer</div>
      <span style="font-size: 14pt;">&#8595;</span>
      <!-- Tier 5 -->
      <div style="font-size: 9pt; font-weight: bold; color: #555;">Tier 5 (optional)</div>
      <div style="padding: 5pt 10pt; border: 2px dashed #555; border-radius: 4pt; background: #f5f5f5; text-align: center;">Coach</div>
    </div>
    <p class="figure-caption">Figure 3.3: AI Pipeline DAG Structure</p>
  </div>

  <p>The scoring formula, implemented in <code>src/ai/agents/ScoreAgent.ts</code>, computes a 9-parameter weighted composite: skills (30%, NACE 2024), experience (20%, NACE Internship Survey), education (15%, NACE 2024), projects (10%, AAC&amp;U/Hart 2018), certifications (5%, SHRM 2021), distance (5%, Marinescu &amp; Rathelot 2018), extracurricular (5%, Roulin &amp; Bangerter 2013), GPA (3%, NACE 2024), and completeness (2%, Ladders 2018). When distance data is unavailable, the 5% weight is redistributed proportionally across remaining parameters.</p>

  <h3 class="section-title">3.5 Bridge Trust Layer Design</h3>

  <p>Bridge establishes a three-party trust system connecting candidates, employers, and the platform. The design comprises four components: (1) criteria publication by employers, (2) resume pinning via SHA-256 hashing, (3) adaptive skill verification testing, and (4) cryptographic scorecard signing.</p>

  <p>Employers publish criteria through the <code>BridgeCriteria</code> interface (defined in <code>src/bridge/types.ts</code>), specifying required and preferred skills, custom scoring signals, weight overrides, threshold scores, and test configuration including difficulty floor and question count. Each criteria set receives a unique short code for candidate reference.</p>

  <p>Before testing, the candidate&rsquo;s resume is pinned: <code>createResumePin()</code> in <code>src/bridge/resumePin.ts</code> extracts resume text, normalizes it (lowercase, strip non-alphanumeric), computes a SHA-256 hash, and records the scoring state at test time. Post-test modification detection uses n-gram Jaccard similarity (<code>computeChangePct()</code>) to classify changes as same (&lt;10%), moderate (10&ndash;30%), or substantial (&gt;30%).</p>

  <p>The adaptive testing engine generates questions at 5 difficulty levels (Fundamentals, Applied, Architecture &amp; Edge Cases, Expert Tradeoffs, Novel Problem) with level multipliers (1.0, 1.5, 2.5, 4.0, 6.0) and score ceilings (L2: 45, L3: 75, L4: 90, L5: 100). Questions are validated through anti-LLM-tell constraints enforced by <code>validateQuestion()</code> in <code>src/bridge/test/questionGenerator.ts</code>.</p>

  <div class="diagram" style="margin: 16pt 0; padding: 12pt; border: 1px solid #ccc; background: #fafafa; page-break-inside: avoid;">
    <div style="display: flex; flex-direction: column; align-items: center; gap: 6pt; font-size: 10pt; font-family: system-ui, sans-serif;">
      <!-- Row 1 -->
      <div style="display: flex; justify-content: center; align-items: center; gap: 4pt; flex-wrap: wrap;">
        <div style="padding: 5pt 8pt; border: 2px solid #182B49; border-radius: 4pt; background: #e8edf3; text-align: center;">Publish<br>Criteria</div>
        <span style="font-size: 14pt;">&#8594;</span>
        <div style="padding: 5pt 8pt; border: 2px solid #182B49; border-radius: 4pt; background: #e8edf3; text-align: center;">Share<br>Link</div>
        <span style="font-size: 14pt;">&#8594;</span>
        <div style="padding: 5pt 8pt; border: 2px solid #182B49; border-radius: 4pt; background: #e8edf3; text-align: center;">Self-<br>Assess</div>
        <span style="font-size: 14pt;">&#8594;</span>
        <div style="padding: 5pt 8pt; border: 2px solid #182B49; border-radius: 4pt; background: #e8edf3; text-align: center;">Calibrate</div>
      </div>
      <span style="font-size: 14pt;">&#8595;</span>
      <!-- Row 2 -->
      <div style="display: flex; justify-content: center; align-items: center; gap: 4pt; flex-wrap: wrap;">
        <div style="padding: 5pt 8pt; border: 2px solid #c47a20; border-radius: 4pt; background: #f3ede8; text-align: center;">Test<br><span style="font-size: 8pt;">(Anti-Cheat)</span></div>
        <span style="font-size: 14pt;">&#8594;</span>
        <div style="padding: 5pt 8pt; border: 2px solid #4a7c59; border-radius: 4pt; background: #e8f3e8; text-align: center;">Sign<br>Scorecard</div>
        <span style="font-size: 14pt;">&#8594;</span>
        <div style="padding: 5pt 8pt; border: 2px solid #182B49; border-radius: 4pt; background: #e8edf3; text-align: center;">Match<br>Signal</div>
        <span style="font-size: 14pt;">&#8594;</span>
        <div style="padding: 5pt 8pt; border: 2px solid #182B49; border-radius: 4pt; background: #dde4f0; text-align: center;">Employer<br>Reply</div>
      </div>
    </div>
    <p class="figure-caption">Figure 3.4: Bridge Trust Layer Flow</p>
  </div>

  <h3 class="section-title">3.6 Wellbeing Scoring Engine Design</h3>

  <p>The wellbeing engine computes 8 sub-scores with research-cited formulas, each returning a 0&ndash;100 value. The composite score is a weighted sum: commute (25%), work hours (20%), work mode (15%), real salary (15%), air quality (10%), industry attrition (5%), heat stress (5%), and commute cost (5%). A relocation penalty of -10 points applies when the candidate must relocate.</p>

  <p>Classification thresholds produce human-readable assessments: thriving (80+), comfortable (60&ndash;79), strained (40&ndash;59), at-risk (20&ndash;39), and concerning (&lt;20). Each classification includes a research-cited message, such as &ldquo;Your commute may feel like a 30% pay cut (Clark et al. 2020)&rdquo; for strained scores.</p>

  <h3 class="section-title">3.7 Security Architecture</h3>

  <p>The security architecture implements defense in depth across multiple layers: (1) Content Security Policy headers restricting script sources, (2) HTTP Strict Transport Security, (3) Subresource Integrity for external resources, (4) device fingerprinting using hardware signals (canvas, WebGL, audio context, screen, CPU, timezone) hashed via SHA-256 for session binding, (5) input validation at every boundary (2000-character limit, control character stripping, regex safeguards against ReDoS), and (6) Firebase Security Rules enforcing per-user document access.</p>

  <p>The device fingerprinting system in <code>src/firebase/deviceId.ts</code> combines 11 hardware signals (screen resolution, color depth, pixel ratio, CPU cores, device memory, platform, timezone, language, touch points, WebGL renderer, canvas fingerprint, and audio context) into a deterministic hash. The same physical device produces the same fingerprint regardless of browser, enabling cross-session identity verification without cookies or tracking scripts.</p>

  <h3 class="section-title">3.8 Data Flow Diagrams</h3>

  <p>The candidate data flow proceeds as follows: user speech/text input enters the Saathi engine, which performs entity extraction (regex or AI-enhanced), fills slots in the conversation state, generates responses, and produces a Resume object stored in the Zustand resume store with IndexedDB persistence. The resume can then be rendered through any of the four templates (ATS Classic, Modern Blue, Creative, Minimal) and exported to PDF.</p>

  <p>The employer data flow begins with job description text and one or more resume uploads. The JD Processor extracts structured requirements. Each resume enters the 9-agent DAG pipeline, where agents progressively analyze and score the candidate. Results flow through the Scorer agent to produce a composite score, which the Coach agent (optional) annotates with improvement suggestions. All agent decisions are traced via the ReAct pattern for employer review.</p>

  <h3 class="section-title">3.9 Database Schema</h3>

  <p>The Firestore database organizes data into the following collections:</p>

  <div style="page-break-inside: auto;">
  <table>
    <thead>
      <tr><th>Collection</th><th>Document Structure</th><th>Purpose</th></tr>
    </thead>
    <tbody>
      <tr><td><code>criteria</code></td><td>BridgeCriteria (shortCode, jobTitle, requiredSkills, weights, testConfig, etc.)</td><td>Employer-published assessment criteria</td></tr>
      <tr><td><code>scorecards</code></td><td>SignedScorecard (version, candidateId, sessionId, resumePin, verification, integrity, signature)</td><td>Cryptographically signed test results</td></tr>
      <tr><td><code>matches</code></td><td>MatchSignal (criteriaCode, scorecardId, candidateId, employerId, scores, gap, status)</td><td>Candidate-employer match signals</td></tr>
      <tr><td><code>replies</code></td><td>EmployerReply (matchId, employerId, candidateId, message, sentAt)</td><td>Employer responses to match signals</td></tr>
    </tbody>
  </table>
  <p class="table-caption">Table 3.3: Firestore Collections</p>
  </div>

  <p>Client-side persistence uses IndexedDB through a custom Zustand middleware adapter (<code>src/store/persist.ts</code>) for the resume store, employer store, and Bridge store. The Saathi conversation state is persisted to localStorage via <code>saveToStorage()</code> in <code>src/saathi/engine/slotMachine.ts</code> for rapid access during conversation flow.</p>
</div>

<!-- ===== CHAPTER 4: TOOLS AND TECHNOLOGIES ===== -->
<div class="report-page">
  <h2 class="chapter-title">Chapter 4: Tools and Technologies</h2>

  <div style="page-break-inside: auto;">
  <table>
    <thead>
      <tr><th>Category</th><th>Tool / Library</th><th>Version</th><th>Purpose</th></tr>
    </thead>
    <tbody>
      <tr><td rowspan="5">Frontend</td><td>React</td><td>19.1.0</td><td>UI component framework</td></tr>
      <tr><td>TypeScript</td><td>5.8.0</td><td>Type-safe JavaScript superset</td></tr>
      <tr><td>Vite</td><td>6.3.0</td><td>Build tool and dev server</td></tr>
      <tr><td>Tailwind CSS</td><td>4.1.0</td><td>Utility-first CSS framework</td></tr>
      <tr><td>React Router</td><td>7.5.0</td><td>Client-side routing</td></tr>
      <tr><td rowspan="2">State</td><td>Zustand</td><td>5.0.0</td><td>Client state management</td></tr>
      <tr><td>IndexedDB</td><td>Browser API</td><td>Offline persistence layer</td></tr>
      <tr><td rowspan="3">AI/ML</td><td>ONNX Runtime Web</td><td>1.24.3</td><td>Neural network inference (E5-small-v2 embeddings)</td></tr>
      <tr><td>@huggingface/transformers</td><td>4.0.1</td><td>DistilBERT NER + Gemma 4 E2B via WebGPU</td></tr>
      <tr><td>Custom TF-IDF/Jaccard</td><td>n/a</td><td>Zero-dependency NLP (L1 agent)</td></tr>
      <tr><td rowspan="3">Backend</td><td>Firebase Auth</td><td>11.10.0</td><td>Anonymous + Google authentication</td></tr>
      <tr><td>Cloud Firestore</td><td>11.10.0</td><td>NoSQL document database</td></tr>
      <tr><td>Cloud Functions</td><td>v2</td><td>HMAC-SHA256 signing service</td></tr>
      <tr><td rowspan="2">Deployment</td><td>Firebase Hosting</td><td>&mdash;</td><td>CDN-backed static hosting</td></tr>
      <tr><td>Vite PWA Plugin</td><td>1.2.0</td><td>Service worker and manifest generation</td></tr>
      <tr><td rowspan="2">Testing</td><td>Vitest</td><td>3.1.0</td><td>Unit and integration testing</td></tr>
      <tr><td>Testing Library</td><td>16.3.0</td><td>React component testing</td></tr>
      <tr><td rowspan="3">Libraries</td><td>@dnd-kit</td><td>6.3.0</td><td>Drag-and-drop section reordering</td></tr>
      <tr><td>html2pdf.js</td><td>0.14.0</td><td>Client-side PDF generation</td></tr>
      <tr><td>qrcode</td><td>1.5.4</td><td>QR code generation for scorecard sharing</td></tr>
    </tbody>
  </table>
  <p class="table-caption">Table 4.1: Tools and Technologies</p>
  </div>

  <h3 class="section-title">4.1 Frontend Stack</h3>

  <p>React 19.1 was selected for its concurrent rendering capabilities, which allow the UI to remain responsive during computationally intensive operations such as ONNX model inference and PDF generation. TypeScript 5.8 provides compile-time type safety across all modules, with strict mode enabled and no <code>any</code> escape hatches in business logic. Vite 6.3 serves as the build tool, providing sub-second hot module replacement during development and tree-shaken production builds with code splitting per route.</p>

  <p>Tailwind CSS 4.1 is used for styling with a design token system. The layout system employs a responsive grid that adapts from single-column mobile to multi-column desktop, with all breakpoints tested on viewport widths from 320px to 2560px.</p>

  <h3 class="section-title">4.2 State Management</h3>

  <p>Zustand 5.0 was chosen over Redux or Recoil for its minimal boilerplate, built-in selector-based re-rendering, and straightforward TypeScript integration. Three primary stores manage application state: <code>resumeStore</code> (candidate resume data), <code>employerStore</code> (JD text, candidate analyses, pipeline results), and <code>bridgeStore</code> (criteria, test sessions, scorecards, matches). Each store is backed by a custom IndexedDB persistence adapter (<code>createIndexedDBStorage</code> in <code>src/store/persist.ts</code>) that serializes state on every mutation and hydrates on application load.</p>

  <h3 class="section-title">4.3 AI/ML Models</h3>

  <p>The platform employs three distinct ML approaches: (1) Custom pure-TypeScript implementations of TF-IDF vectorization and Jaccard similarity for L1 NLP analysis, requiring zero model downloads and executing in under 5 milliseconds. (2) E5-small-v2 (384-dimensional embeddings, ~67M parameters) loaded via ONNX Runtime Web for L2 semantic similarity, with TF-IDF cosine similarity as the fallback when ONNX loading fails. (3) DistilBERT-NER (INT8 quantized) loaded via @huggingface/transformers for named entity recognition (PER, ORG, LOC, MISC entities), enhancing the regex-based entity extractor.</p>

  <p>For reasoning tasks, the L3 agent loads Gemma 4 E2B through @huggingface/transformers with WebGPU acceleration. The model (~600MB) is cached in IndexedDB after first download. When WebGPU is unavailable or the model fails to load, the L4 agent falls back to the Gemini 2.5 Flash API.</p>

  <h3 class="section-title">4.4 Backend Services</h3>

  <p>Firebase provides three services: Authentication (anonymous auth for immediate access, Google Sign-In for persistent identity), Firestore (Bridge criteria, scorecards, and match signals), and Cloud Functions (HMAC-SHA256 scorecard signing with per-criteria secrets stored in environment variables). The backend is intentionally minimal: all computation occurs client-side, and the server&rsquo;s sole responsibility is cryptographic operations requiring secrets that cannot be exposed to the browser.</p>

  <h3 class="section-title">4.5 Deployment Infrastructure</h3>

  <p>The application is deployed to Firebase Hosting, which provides global CDN distribution, automatic SSL certificates, and HTTP/2 push. The Vite PWA Plugin generates the service worker and Web App Manifest, enabling installation as a standalone application on mobile and desktop devices. The service worker implements a stale-while-revalidate caching strategy for application assets and a cache-first strategy for ML model files.</p>

  <h3 class="section-title">4.6 Testing Framework</h3>

  <p>Vitest 3.1 serves as the test runner, providing Vite-native module resolution, TypeScript support without separate compilation, and jsdom for DOM simulation. Testing Library (React 16.3) enables component testing through user-centric queries (getByRole, getByLabelText) that validate accessibility alongside functionality. The test suite comprises 516 tests across 27 test files.</p>

  <h3 class="section-title">4.7 Development Tools</h3>

  <p>The development environment uses ESLint with TypeScript-aware rules for static analysis, Prettier for code formatting, and Git with conventional commit messages. The project repository is hosted on GitHub with branch protection rules requiring passing CI checks before merge.</p>
</div>

<!-- ===== CHAPTER 5: IMPLEMENTATION (Part 1: Saathi + Builder) ===== -->
<div class="report-page">
  <h2 class="chapter-title">Chapter 5: Implementation</h2>

  <h3 class="section-title">5.1 Saathi Conversational Resume Builder</h3>

  <h4 class="subsection-title">5.1.1 Slot-Filling Engine</h4>

  <p>The slot-filling engine is implemented in <code>src/saathi/engine/slotMachine.ts</code> (818 lines). The core data structure is <code>SlotState</code>, a TypeScript interface containing: a <code>Map&lt;SlotId, string | string[]&gt;</code> for slot values, a <code>ConversationPhase</code> enum for current phase, a <code>Map&lt;string, number&gt;</code> for array indices (supporting multiple entries per section), and a <code>Set&lt;SlotId&gt;</code> for explicitly skipped slots.</p>

  <p>Each user message is processed through the following pipeline: (1) input sanitization (2000-character limit, control character removal), (2) entity extraction via <code>extractEntities()</code>, (3) slot filling through <code>fillSlotsFromEntities()</code> which maps extracted entities to appropriate slot IDs, (4) phase update via <code>updatePhase()</code>, and (5) response generation via <code>generateResponse()</code> which selects the appropriate template based on what was just filled.</p>

  <p>The engine supports multiple entries for experience, projects, and education through an array entry system. The <code>addArrayEntry()</code> function in <code>src/saathi/engine/slots.ts</code> stores each entry as a JSON-serialized object in a string array under a synthetic slot key (e.g., <code>experience[]._entries</code>). The <code>getArrayEntries()</code> function retrieves and parses these entries for resume generation.</p>

  <h4 class="subsection-title">5.1.2 Entity Extraction</h4>

  <p>Entity extraction in <code>src/saathi/engine/entityExtractor.ts</code> employs a two-tier approach. The regex tier defines 12 pattern categories: email (<code>EMAIL_RE</code>), Indian phone numbers (<code>PHONE_RE</code>), international phone (<code>PHONE_INTL_RE</code>), years (<code>YEAR_RE</code>), date ranges (<code>DATE_RANGE_RE</code>), CGPA/GPA (<code>CGPA_RE</code>), percentages (<code>PERCENTAGE_RE</code>), GPA fractions (<code>GPA_FRACTION_RE</code>), degrees (<code>DEGREE_RE</code> matching 17 degree patterns), LinkedIn URLs, GitHub URLs, and a 68-entry skill vocabulary set (<code>SKILL_WORDS</code>).</p>

  <p>The enhanced extraction function <code>extractEntitiesEnhanced()</code> augments regex results with DistilBERT-NER predictions from <code>src/saathi/engine/nerModel.ts</code>. The NER model (Xenova/distilbert-NER, INT8 quantized) identifies PER (person name), ORG (organization), LOC (location), and MISC entities. Predictions with confidence below 0.5 are discarded. NER results are merged into the <code>properNouns</code> array of the <code>ExtractedEntities</code> interface for downstream processing by the slot filler.</p>

  <h4 class="subsection-title">5.1.3 Multilingual Voice Input</h4>

  <p>Voice input is handled by <code>src/saathi/voice/speechInput.ts</code> using the Web Speech API. Language detection is performed by <code>src/saathi/voice/languageDetect.ts</code>, which examines Unicode block ranges to identify 10 scripts: Latin (en-IN), Devanagari (hi-IN), Tamil (ta-IN), Bengali (bn-IN), Telugu (te-IN), Malayalam (ml-IN), Gujarati (gu-IN), Kannada (kn-IN), Punjabi (pa-IN), and Odia (or-IN). The <code>detectScript()</code> function counts character occurrences in each Unicode range and returns the dominant script, which is mapped to a BCP-47 language tag via <code>getSpeechLang()</code> for the speech recognizer.</p>

  <h4 class="subsection-title">5.1.4 AI-Enhanced Response Generation</h4>

  <p>When the Gemini API key is available, <code>processUserInputAsync()</code> in the slot machine invokes two AI services sequentially: (1) <code>extractWithAI()</code> sends the user message, conversation context (last 4 exchanges), and current phase to Gemini 2.5 Flash with a structured JSON output schema (<code>AI_EXTRACTION_SCHEMA</code>) for entity extraction; (2) <code>generateSaathiResponse()</code> produces a contextual, warm response based on the extracted data, current phase, filled slots, and missing slots. Both functions fall back to regex-based extraction and template-based responses on any failure.</p>

  <h4 class="subsection-title">5.1.5 Resume Generation</h4>

  <p>The <code>slotsToResume()</code> function in <code>src/saathi/engine/resumeGenerator.ts</code> converts the filled <code>SlotState</code> into a <code>Resume</code> object compatible with the resume store. It processes array entries for education, experience, and projects through <code>getArrayEntries()</code>, with fallback to flat slot values for single-entry cases. The resulting Resume object is structured with typed sections (education, experience, projects, skills, certifications, extracurricular), each containing entries with fields and bullets.</p>

  <h3 class="section-title">5.2 Resume Builder (Form Mode)</h3>

  <h4 class="subsection-title">5.2.1 Template System</h4>

  <p>Four resume templates are implemented as React components in <code>src/builder/templates/</code>: ATS Classic (<code>ATSClassic.tsx</code>) optimized for ATS parsing with standard section headings and clean formatting; Modern Blue (<code>ModernBlue.tsx</code>) with a two-column layout and accent colors; Creative (<code>Creative.tsx</code>) with a sidebar design for visual impact; and Minimal (<code>Minimal.tsx</code>) with maximum content density. All templates receive the same <code>Resume</code> prop and render identically structured content with different visual treatments.</p>

  <h4 class="subsection-title">5.2.2 Drag-and-Drop Section Reordering</h4>

  <p>Section reordering is implemented using <code>@dnd-kit/core</code> and <code>@dnd-kit/sortable</code> in <code>src/builder/components/DraggableSections.tsx</code>. Users can reorder resume sections (education, experience, projects, skills, certifications, extracurricular) through drag-and-drop interaction. The sort order persists in the resume store.</p>

  <h4 class="subsection-title">5.2.3 AI Coach Panel</h4>

  <p>The AI Coach Panel (<code>src/builder/components/AICoachPanel.tsx</code>) provides real-time feedback on resume quality. It integrates with the employer scoring pipeline to show how the current resume would score against a sample job description. Suggestions cover missing sections, weak phrasing, lack of quantified achievements, and skills gaps, with each suggestion citing its research source.</p>

  <h4 class="subsection-title">5.2.4 PDF Export</h4>

  <p>PDF generation uses html2pdf.js to convert the rendered resume component to a downloadable PDF. The export preserves template formatting, handles page breaks at section boundaries, and produces files suitable for ATS submission.</p>
</div>

<!-- ===== CHAPTER 5: IMPLEMENTATION (Part 2: Employer Pipeline) ===== -->
<div class="report-page">
  <h3 class="section-title">5.3 Employer Screening Pipeline</h3>

  <h4 class="subsection-title">5.3.1 JD Parser</h4>

  <p>The JD Processor agent (<code>src/ai/agents/JDAgent.ts</code>) extracts structured requirements from raw job description text. It identifies the job title, seniority level, required skills, preferred skills, and minimum qualifications using regex pattern matching and keyword extraction. Extracted skills are normalized through the skills taxonomy (<code>src/ai/taxonomy/skillsGraph.ts</code>) to canonical forms (e.g., &ldquo;JS&rdquo; normalizes to &ldquo;JavaScript&rdquo;, &ldquo;k8s&rdquo; to &ldquo;Kubernetes&rdquo;). The structured output feeds both the Skills Matcher and the scoring formula.</p>

  <h4 class="subsection-title">5.3.2 DAG Orchestrator</h4>

  <p>The DAG executor (<code>src/ai/orchestrator/dagExecutor.ts</code>) implements a parallel execution engine for the agent graph. The <code>validateDAG()</code> function uses Kahn&rsquo;s algorithm: it computes in-degree for each node, seeds a queue with zero-in-degree nodes, and iteratively processes the queue while decrementing neighbor in-degrees. If the resulting topological order contains fewer nodes than the input, a cycle is detected and the pipeline aborts.</p>

  <p>Execution proceeds through the <code>executeDAG()</code> function: (1) find all nodes whose dependencies are satisfied, (2) execute them in parallel via <code>Promise.allSettled</code>, (3) on completion, mark the node as completed and re-check for newly runnable nodes, (4) repeat until no nodes are running or pending. Failed optional nodes are logged but do not block dependents. Failed required nodes cause their dependents to be skipped with a &ldquo;Required dependency failed&rdquo; trace entry.</p>

  <h4 class="subsection-title">5.3.3 Scoring Formula</h4>

  <p>The <code>computeScore()</code> function in <code>src/ai/agents/ScoreAgent.ts</code> implements the composite scoring formula:</p>

  <p class="no-indent"><strong>base_score = &Sigma;(weight<sub>i</sub> &times; score<sub>i</sub>) &times; 100</strong></p>

  <p>Individual parameter computations include: skills score as 0.4 &times; L1_exact (Jaccard) + 0.6 &times; L2_semantic (cosine similarity); experience score as has_experience &times; relevance (L2 semantic proxy); education score via CIP-SOC crosswalk keywords; project score via AAC&amp;U VALUE rubric classification (capstone: 1.0, milestone3: 0.75, milestone2: 0.5, benchmark: 0.25) implemented in <code>src/ai/scoring/valueRubric.ts</code>; distance score as exp(-0.043 &times; miles) per Marinescu &amp; Rathelot (2018) in <code>src/ai/scoring/distanceDecay.ts</code>; GPA score as linear scale (GPA - 2.0) / 2.0 with null yielding 0.5 neutral in <code>src/ai/scoring/gpaScore.ts</code>; and extracurricular score as 0.6 &times; has_extra + 0.4 &times; has_leadership.</p>

  <p>Red flag penalties are applied per Henle et al. (2019): fabrication (-20), embellishment (-10), omission (-5). The final score is clamped to [0, 100], with a hard parseability gate: if the L1 agent cannot identify at least 75% of expected sections (contact, education, experience/projects, skills), the score is set to zero.</p>

  <h4 class="subsection-title">5.3.4 Red Flags and ReAct Tracing</h4>

  <p>The L3 Reasoning Agent (<code>src/ai/agents/L3_ReasonAgent.ts</code>) uses Henle et al.&rsquo;s (2019) three-dimensional taxonomy to classify detected inconsistencies. The contradiction detection prompt instructs the model to analyze for fabrication (knowingly false information), embellishment (exaggerated experience), and omission (strategically hidden information). Each red flag carries a penalty value and an evidence string referencing the specific resume content that triggered the flag.</p>

  <p>All agent decisions are logged via the ReAct tracing system in <code>src/ai/orchestrator/tracing.ts</code>. Each trace entry records the agent ID, name, start/end timestamps, status (running/success/failed/skipped), and a sequence of steps. Each step contains three fields: thought (the agent&rsquo;s reasoning), action (the function called), and observation (the result). This enables employers to inspect the complete decision chain for any candidate score.</p>

  <h4 class="subsection-title">5.3.5 Skills Taxonomy</h4>

  <p>The skills taxonomy in <code>src/ai/taxonomy/skillsGraph.ts</code> (1540 lines) defines 186 skill nodes organized into 10 categories: language, framework, library, database, devops, cloud, tool, methodology, soft-skill, and domain. Each node specifies a canonical ID, display name, aliases (for normalization), category, and adjacent skills (for adjacency matching). The <code>computeSkillOverlap()</code> function computes a composite score: (exact_matches &times; 1.0 + adjacent_matches &times; 0.5) / total_jd_skills.</p>
</div>

<!-- ===== CHAPTER 5: IMPLEMENTATION (Part 3: Bridge + Wellbeing + Security + PWA) ===== -->
<div class="report-page">
  <h3 class="section-title">5.4 Bridge Trust Layer</h3>

  <h4 class="subsection-title">5.4.1 Criteria Publication</h4>

  <p>Employers create assessment criteria through the <code>CriteriaPublishForm</code> component, which populates a <code>BridgeCriteria</code> object. The criteria include: job title, description, required and preferred skills (populated from the skills taxonomy autocomplete), custom scoring signals with individual weights, a global threshold score, and test configuration specifying which skills to verify, the difficulty floor, and question count per skill. Published criteria are stored in Firestore with a unique short code and expiry date.</p>

  <h4 class="subsection-title">5.4.2 Self-Assessment</h4>

  <p>Before taking the Bridge test, candidates complete a self-assessment via <code>src/bridge/hooks/useSelfAssessment.ts</code>. The self-assessment runs the employer scoring pipeline against the published criteria, producing a <code>ScoreBreakdown</code> that shows how the candidate&rsquo;s resume scores on each criterion. This transparency allows candidates to see their strengths and gaps before entering the timed assessment.</p>

  <h4 class="subsection-title">5.4.3 Adaptive Testing Engine</h4>

  <p>The testing engine implements computerized adaptive testing (CAT) with 5 difficulty levels. The <code>getNextLevel()</code> function in <code>src/bridge/test/adaptiveScoring.ts</code> adjusts difficulty: a correct answer advances the level by 1 (capped at 5); an incorrect answer after one wrong at the current level drops by 1 (floored at 1). Level multipliers reward higher-difficulty correct answers: L1=1.0, L2=1.5, L3=2.5, L4=4.0, L5=6.0. A sustained performance bonus of 15% applies when the candidate answers 3 or more consecutive questions correctly at level 3 or above.</p>

  <p>Score ceilings prevent gaming: candidates who never exceed level 2 are capped at 45/100; level 3 caps at 75; level 4 caps at 90. Only candidates reaching level 5 can achieve the full 100-point range.</p>

  <p>Questions are generated by <code>src/bridge/test/questionGenerator.ts</code> using Gemini 2.0 Flash with structured JSON output. Three question types rotate: concept (3s answer buffer), scenario (5s buffer), and micro-challenge (8s buffer). Time allotment is computed as: (wordCount / candidateWpm) &times; 60 + buffer, modified by level-specific time modifiers.</p>

  <h4 class="subsection-title">5.4.4 Anti-Cheat System</h4>

  <p>The anti-cheat system operates on two layers. The browser integrity layer (<code>src/bridge/test/antiCheat.ts</code>) monitors: tab switches via <code>visibilitychange</code> and <code>blur</code> events (5-point penalty, with 500ms deduplication window), paste events (8-point penalty), and fullscreen exits (3-point penalty). Speed anomaly detection flags impossibly fast correct answers: ratio &lt; 0.3 yields a 10-point penalty, with a 15-point compound anomaly penalty if the tab was hidden within the last 10 seconds.</p>

  <p>The audio intelligence layer (<code>src/bridge/test/audioMonitor.ts</code>) implements three analysis tiers: (1) spectral analysis checking for formant energy concentration &gt;50% in the 300&ndash;3400 Hz speech band, (2) temporal analysis detecting syllabic modulation at 3&ndash;8 Hz via zero-crossing rate of the energy envelope, and (3) adaptive baseline recalibration using a 60-second rolling window of non-speech samples. Speech is declared when formants and syllabic modulation are both present and the RMS dB exceeds baseline by 3 dB. Impulses under 200ms are ignored (hammer/cough filter). Penalties: speech burst 2&ndash;5s (1 point), conversation (3+ bursts in 30s window, 5 points), continuous speech &gt;10s (8 points), whisper detection (6 points), speech coinciding with tab switch (12 points).</p>

  <div class="diagram" style="margin: 16pt 0; padding: 12pt; border: 1px solid #ccc; background: #fafafa; page-break-inside: avoid;">
    <div style="display: flex; flex-direction: column; align-items: center; gap: 6pt; font-size: 10pt; font-family: system-ui, sans-serif;">
      <!-- Layer 1: Input sources -->
      <div style="font-size: 9pt; font-weight: bold; color: #555;">Detection Sources</div>
      <div style="display: flex; justify-content: center; align-items: center; gap: 6pt; flex-wrap: wrap;">
        <div style="padding: 5pt 8pt; border: 2px solid #182B49; border-radius: 4pt; background: #e8edf3; text-align: center;">Browser Events<br><span style="font-size: 8pt; color: #555;">Tab / Paste / Fullscreen</span></div>
        <div style="padding: 5pt 8pt; border: 2px solid #182B49; border-radius: 4pt; background: #e8edf3; text-align: center;">Speed Anomaly<br><span style="font-size: 8pt; color: #555;">Response Time Analysis</span></div>
        <div style="padding: 5pt 8pt; border: 2px solid #c47a20; border-radius: 4pt; background: #f3ede8; text-align: center;">Audio Intelligence<br><span style="font-size: 8pt; color: #555;">3-Layer Pipeline</span></div>
      </div>
      <span style="font-size: 14pt;">&#8595;</span>
      <!-- Audio sub-pipeline -->
      <div style="display: flex; justify-content: center; align-items: center; gap: 4pt; flex-wrap: wrap;">
        <div style="padding: 4pt 8pt; border: 1px solid #c47a20; border-radius: 3pt; background: #faf5ef; text-align: center; font-size: 9pt;">Spectral<br>(300-3400 Hz)</div>
        <span style="font-size: 12pt;">&#8594;</span>
        <div style="padding: 4pt 8pt; border: 1px solid #c47a20; border-radius: 3pt; background: #faf5ef; text-align: center; font-size: 9pt;">Temporal<br>(3-8 Hz syllabic)</div>
        <span style="font-size: 12pt;">&#8594;</span>
        <div style="padding: 4pt 8pt; border: 1px solid #c47a20; border-radius: 3pt; background: #faf5ef; text-align: center; font-size: 9pt;">Adaptive<br>(60s baseline)</div>
      </div>
      <span style="font-size: 14pt;">&#8595;</span>
      <!-- Output -->
      <div style="padding: 6pt 18pt; border: 2px solid #4a7c59; border-radius: 4pt; background: #e8f3e8; text-align: center; font-weight: bold;">Integrity Score (0-100)</div>
    </div>
    <p class="figure-caption">Figure 5.1: Anti-Cheat Architecture</p>
  </div>

  <div style="page-break-inside: auto;">
  <table>
    <thead>
      <tr><th>Flag Type</th><th>Penalty</th><th>Source</th></tr>
    </thead>
    <tbody>
      <tr><td>Tab switch</td><td>-5</td><td>Browser visibilitychange/blur</td></tr>
      <tr><td>Paste event</td><td>-8</td><td>Document paste listener</td></tr>
      <tr><td>Fullscreen exit</td><td>-3</td><td>Fullscreen API</td></tr>
      <tr><td>Speed anomaly (impossible)</td><td>-10</td><td>Response time / expected read time &lt; 0.3</td></tr>
      <tr><td>Speed anomaly (suspicious)</td><td>-4</td><td>Response time / expected read time &lt; 0.5</td></tr>
      <tr><td>Compound anomaly</td><td>-15</td><td>Impossible speed + recent tab switch</td></tr>
      <tr><td>Speech burst (2&ndash;5s)</td><td>-1</td><td>Audio spectral + temporal analysis</td></tr>
      <tr><td>Conversation (3+ bursts/30s)</td><td>-5</td><td>Audio temporal pattern</td></tr>
      <tr><td>Continuous speech (&gt;10s)</td><td>-8</td><td>Audio sustained detection</td></tr>
      <tr><td>Whisper</td><td>-6</td><td>Low-energy formant presence</td></tr>
      <tr><td>Speech + tab switch</td><td>-12</td><td>Combined audio + browser event</td></tr>
    </tbody>
  </table>
  <p class="table-caption">Table 5.2: Anti-Cheat Penalties</p>
  </div>

  <h4 class="subsection-title">5.4.5 Cryptographic Scorecard Signing</h4>

  <p>After test completion, the scorecard is assembled with verification scores, integrity scores, resume pin, calibration data, and gap analysis (difference between self-assessed resume score and verified skill score). The scorecard is signed via HMAC-SHA256 using per-criteria secrets generated server-side in Firebase Cloud Functions. The <code>SignedScorecard</code> interface (defined in <code>src/bridge/types.ts</code>) includes a version number, criteria hash, and the HMAC signature, enabling third-party verification that the scorecard was produced by the platform and has not been modified.</p>

  <h4 class="subsection-title">5.4.6 Matching System</h4>

  <p>When a candidate&rsquo;s scorecard meets the employer&rsquo;s threshold, a <code>MatchSignal</code> is created containing the criteria code, scorecard reference, candidate contact information, resume score, verified score, integrity score, and gap. Employers view matches through the <code>EmployerMatchDashboard</code> component and can respond via the <code>EmployerReply</code> system. Match status tracks progression through pending, viewed, and replied states.</p>

  <h3 class="section-title">5.5 Wellbeing Scoring Engine</h3>

  <p>The wellbeing engine is implemented in <code>src/wellbeing/engine/wellbeingScorer.ts</code> with individual sub-score formulas in <code>src/wellbeing/engine/formulas.ts</code>. The engine accepts a <code>WellbeingInput</code> with commute minutes, work hours per week, work mode, offered salary, office city, candidate city, industry, commute mode, relocation flag, and optional driving distance.</p>

  <div style="page-break-inside: auto;">
  <table>
    <thead>
      <tr><th>Parameter</th><th>Weight</th><th>Formula Source</th><th>Data Source</th></tr>
    </thead>
    <tbody>
      <tr><td>Commute</td><td>25%</td><td>Non-linear decay: 100 at &le;15 min, piecewise reduction. Redmond &amp; Mokhtarian (2001)</td><td>User input</td></tr>
      <tr><td>Work Hours</td><td>20%</td><td>Step function: 100 at &le;40h, 15 at &gt;55h. WHO/ILO Pega et al. (2021)</td><td>User input</td></tr>
      <tr><td>Work Mode</td><td>15%</td><td>Hybrid=100, hybrid-1=85, remote=70, onsite=50. Bloom et al. (2024, Nature)</td><td>User input</td></tr>
      <tr><td>Real Salary</td><td>15%</td><td>Offered / CoL index, ratio to national median. Gallup Five Elements</td><td>Numbeo India 2025, RBI CPIIW</td></tr>
      <tr><td>Air Quality</td><td>10%</td><td>PM2.5 step function: 100 at &le;15, 10 at &gt;100. WHO guidelines</td><td>CPCB Annual Report 2025, IQAir</td></tr>
      <tr><td>Industry Stability</td><td>5%</td><td>100 - attrition% &times; 3. NASSCOM/Aon 2024</td><td>NASSCOM/Aon 2024</td></tr>
      <tr><td>Heat Stress</td><td>5%</td><td>WBGT step: 100 at &le;25&deg;C, 10 at &gt;35&deg;C. Nature Sci. Reports 2026</td><td>IMD Heatwave Reports 2025</td></tr>
      <tr><td>Commute Cost</td><td>5%</td><td>100 - (cost/salary)% &times; 10. ORF India</td><td>Transit costs + fuel rates</td></tr>
    </tbody>
  </table>
  <p class="table-caption">Table 5.3: Wellbeing Scoring Parameters</p>
  </div>

  <p>City-specific data is stored in three lookup tables: <code>src/wellbeing/data/cityCoL.ts</code> (cost-of-living indices for 35 city entries from Numbeo India 2025), <code>src/wellbeing/data/cityAQI.ts</code> (annual PM2.5 values from CPCB 2025), and <code>src/wellbeing/data/cityWBGT.ts</code> (peak summer WBGT from IMD 2025). Each lookup function normalizes city names and falls back to a moderate default when the city is not found.</p>

  <h3 class="section-title">5.6 Security Implementation</h3>

  <h4 class="subsection-title">5.6.1 Device Fingerprinting</h4>

  <p>The device fingerprinting system in <code>src/firebase/deviceId.ts</code> generates a deterministic hardware-based identifier by combining 11 signals: screen dimensions and color depth, device pixel ratio, CPU core count, device memory, platform string, timezone, language, max touch points, WebGL vendor and renderer (via <code>WEBGL_debug_renderer_info</code>), canvas fingerprint (GPU-specific rendering of text and arcs), and audio context signature (sample rate and max channel count). These signals are concatenated with a <code>||</code> delimiter and hashed via SHA-256 to produce a 32-character device ID prefixed with <code>dev_</code>.</p>

  <p>The fingerprint is stored in both localStorage (fast path) and IndexedDB (resilience). The <code>verifyDevice()</code> function regenerates the fingerprint from current hardware signals and compares against a stored ID, enabling cross-session identity verification without cookies.</p>

  <h4 class="subsection-title">5.6.2 Input Validation and Security Headers</h4>

  <p>All user inputs are validated at system boundaries. The Saathi engine caps input at 2000 characters and strips control characters (0x00&ndash;0x08, 0x0B, 0x0C, 0x0E&ndash;0x1F, 0x7F) to prevent injection and ReDoS attacks. The application configures Content Security Policy headers restricting script sources to same-origin and trusted CDNs, enforces HTTPS via HSTS headers, and applies Subresource Integrity checks for external dependencies.</p>

  <h4 class="subsection-title">5.6.3 Firebase Security Rules</h4>

  <p>Firestore security rules enforce per-user document access: users can only read and write their own criteria, scorecards, and match documents. The HMAC signing Cloud Function validates the request origin and the session ID before producing a signature, preventing unauthorized scorecard generation.</p>

  <h3 class="section-title">5.7 Accessibility Implementation</h3>

  <p>The platform targets WCAG 2.2 AAA compliance across all modules. Implementation includes: semantic HTML with proper heading hierarchy and landmark regions, ARIA attributes for dynamic content (aria-live for chat messages, aria-expanded for collapsible sections, aria-describedby for form validation), full keyboard navigation with visible focus indicators, screen reader support tested with NVDA and VoiceOver, reduced-motion preferences via <code>prefers-reduced-motion</code> media queries, and high-contrast color schemes with a minimum contrast ratio of 7:1 for normal text.</p>

  <h3 class="section-title">5.8 PWA and Offline-First Architecture</h3>

  <p>The Progressive Web Application architecture ensures that the platform functions without network connectivity after initial load. The Vite PWA Plugin generates a service worker that pre-caches all application routes and static assets. ML model files (ONNX, Transformers.js) are cached in IndexedDB after first download. All user data (resumes, employer analyses, Bridge sessions) persists in IndexedDB through Zustand store adapters. The Saathi conversation state is additionally persisted to localStorage for sub-millisecond access during conversation flow.</p>

  <p>The service worker implements a stale-while-revalidate strategy: cached assets are served immediately while the worker checks for updates in the background. When an update is detected, the user is notified through a subtle in-app banner. This ensures that users on slow networks experience near-instant page loads while still receiving the latest features.</p>
</div>

<!-- ===== CHAPTER 6: TESTING AND RESULTS ===== -->
<div class="report-page">
  <h2 class="chapter-title">Chapter 6: Testing and Results</h2>

  <h3 class="section-title">6.1 Testing Strategy</h3>

  <p>The testing strategy follows a pyramid model: a broad base of unit tests verifying individual functions and modules, supplemented by integration tests validating multi-module interactions, and capped by manual accessibility and performance audits. The automated test suite comprises 516 tests across 27 test files, executed via Vitest 3.1 with jsdom environment simulation.</p>

  <p>Tests are co-located with their source modules in <code>__tests__/</code> directories, following the convention <code>ModuleName.test.ts</code> or <code>ModuleName.test.tsx</code> for component tests. Each test file imports from the module under test without mocking internal dependencies, ensuring that tests validate actual behavior rather than assumed interfaces.</p>

  <h3 class="section-title">6.2 Unit Testing</h3>

  <h4 class="subsection-title">6.2.1 Saathi Engine Tests</h4>

  <p>The Saathi engine test suite spans 6 test files covering: slot state management (<code>slots.test.ts</code>) verifying slot creation, filling, phase transitions, and percentage calculations; entity extraction (<code>entityExtractor.test.ts</code>) testing all 12 regex patterns including edge cases for Indian phone formats, CGPA variants, and skill detection; response bank (<code>responseBank.test.ts</code>) validating template interpolation and variant rotation; resume generation (<code>resumeGenerator.test.ts</code>) confirming correct conversion from slots to Resume objects with multiple entries; slot machine integration (<code>slotMachine.test.ts</code>) testing full conversation flows from greeting through review; and language detection (<code>languageDetect.test.ts</code>) verifying Unicode script identification for all 10 supported scripts.</p>

  <h4 class="subsection-title">6.2.2 AI Pipeline Tests</h4>

  <p>The AI pipeline test suite includes: L1 NLP agent tests (<code>L1_NLPAgent.test.ts</code>) verifying section detection, entity extraction, TF-IDF vectorization, Jaccard similarity, and blended skills scoring; scoring tests (<code>scoring.test.ts</code>) validating the composite scoring formula, weight normalization, distance decay, GPA scoring, VALUE rubric classification, and red flag penalty application.</p>

  <h4 class="subsection-title">6.2.3 Bridge Tests</h4>

  <p>Bridge testing covers: resume pinning (<code>resumePin.test.ts</code>) verifying SHA-256 hashing, content normalization, n-gram Jaccard change detection, and change classification thresholds; store operations (<code>store.test.ts</code>) testing test session lifecycle, flag recording, question advancement, and scorecard storage; adaptive scoring (<code>adaptiveScoring.test.ts</code>) validating level transitions, score ceiling enforcement, sustained performance bonuses, and integrity score computation; and question generation (<code>questionGenerator.test.ts</code>) testing anti-LLM-tell validation, time allotment calculation, and option shuffling.</p>

  <h4 class="subsection-title">6.2.4 Wellbeing Tests</h4>

  <p>Wellbeing testing spans 3 files: formula tests (<code>formulas.test.ts</code>) verifying all 8 sub-score functions against known input-output pairs including boundary conditions; Maps client tests (<code>mapsClient.test.ts</code>) validating distance API integration and fallback behavior; and wellbeing scorer integration tests (<code>wellbeingScorer.test.ts</code>) confirming composite score computation, weight application, relocation penalties, and classification thresholds.</p>

  <h4 class="subsection-title">6.2.5 UI Component Tests</h4>

  <p>Component tests use Testing Library to validate user interactions: Landing page tests (<code>Landing.test.tsx</code>) verify navigation and accessibility landmarks; Candidate Dashboard tests (<code>CandidateDashboard.test.tsx</code>) validate score display and interaction flows; SaathiChat tests (<code>SaathiChat.test.tsx</code>) confirm message rendering, input handling, and voice button states; Layout tests (<code>Layout.test.tsx</code>) verify responsive navigation and theme toggling; builder template tests (<code>templates.test.tsx</code>) ensure all four templates render without errors; AI Coach tests (<code>AICoachPanel.test.tsx</code>) validate suggestion display and citation rendering; and theme tests (<code>tokens.test.ts</code>) verify design token consistency.</p>

  <h3 class="section-title">6.3 AI Pipeline Testing</h3>

  <p>AI pipeline tests validate the end-to-end scoring accuracy against known resume-JD pairs. Test cases include: a perfect-match scenario (resume containing all JD keywords, producing a skills score above 0.8); a zero-match scenario (unrelated resume and JD, producing a skills score below 0.1); a partial-match scenario with adjacent skills (testing that taxonomy adjacency matching correctly identifies related skills); and a parseability gate test (resume missing key sections producing a final score of zero).</p>

  <p>The DAG executor is tested with synthetic graphs including: a valid 3-node chain (A &rarr; B &rarr; C), a diamond dependency pattern (A &rarr; B, A &rarr; C, B &rarr; D, C &rarr; D), a cycle detection case (A &rarr; B &rarr; C &rarr; A), and an optional node failure case verifying that dependents continue execution.</p>

  <h3 class="section-title">6.4 Anti-Cheat Testing</h3>

  <p>Anti-cheat testing validates each detection mechanism independently and in combination. Tab switch detection is tested with simulated <code>visibilitychange</code> and <code>blur</code> events, verifying the 500ms deduplication window. Paste detection confirms event capture on form inputs. Speed anomaly detection is tested with time ratios at boundary values (0.29, 0.30, 0.49, 0.50, 0.51). Compound anomaly testing verifies that the 15-point penalty applies only when both conditions (impossible speed + recent tab switch within 10 seconds) are met.</p>

  <p>Audio monitoring tests validate: formant detection with synthetic frequency data showing &gt;50% energy concentration in the 300&ndash;3400 Hz band; syllabic modulation detection with energy envelope patterns at 3 Hz and 8 Hz; impulse rejection for durations under 200ms; and conversation detection when 3 or more speech bursts occur within a 30-second window.</p>

  <h3 class="section-title">6.5 Security Testing</h3>

  <p>Security tests cover: input sanitization (verifying that control characters, excessively long inputs, and potential injection payloads are neutralized); device fingerprint determinism (same inputs produce same hash); resume pin integrity (any content modification produces a different SHA-256 hash); and HMAC signature verification (tampered scorecards fail validation).</p>

  <h3 class="section-title">6.6 Accessibility Testing</h3>

  <p>Accessibility validation includes automated checks via Testing Library&rsquo;s accessibility queries (getByRole, getByLabelText) in all component tests, ensuring that interactive elements have proper ARIA roles and labels. Manual testing with NVDA and VoiceOver screen readers validates the conversational flow in Saathi, the scoring dashboard in the employer module, and the test-taking interface in Bridge.</p>

  <h3 class="section-title">6.7 Performance</h3>

  <p>Performance measurements on a mid-range device (8 GB RAM, 4 CPU cores): L1 NLP analysis completes in under 5ms for typical resumes (500&ndash;1000 words). TF-IDF vectorization of two documents completes in under 10ms. Jaccard similarity computation is O(min(|A|,|B|)) amortized. E5-small-v2 embedding inference via ONNX completes in 100&ndash;200ms. The full 9-agent pipeline completes in under 3 seconds when L3/L4 reasoning is skipped, and under 30 seconds when Gemma 4 inference is included.</p>

  <h3 class="section-title">6.8 Test Results Summary</h3>

  <div style="page-break-inside: auto;">
  <table>
    <thead>
      <tr><th>Module</th><th>Test Files</th><th>Tests</th><th>Status</th></tr>
    </thead>
    <tbody>
      <tr><td>Saathi Engine</td><td>7</td><td>145</td><td>Pass</td></tr>
      <tr><td>AI Pipeline (L1, L2, Scoring)</td><td>2</td><td>68</td><td>Pass</td></tr>
      <tr><td>Bridge (Store, Pin, Scoring, Questions)</td><td>4</td><td>82</td><td>Pass</td></tr>
      <tr><td>Wellbeing (Formulas, Maps, Scorer)</td><td>3</td><td>45</td><td>Pass</td></tr>
      <tr><td>Builder (Templates, Coach, Mass)</td><td>3</td><td>54</td><td>Pass</td></tr>
      <tr><td>UI Components (Landing, Dashboard, Layout)</td><td>4</td><td>72</td><td>Pass</td></tr>
      <tr><td>Store (Resume, Employer)</td><td>2</td><td>30</td><td>Pass</td></tr>
      <tr><td>Theme &amp; Hooks</td><td>2</td><td>20</td><td>Pass</td></tr>
      <tr><td><strong>Total</strong></td><td><strong>27</strong></td><td><strong>516</strong></td><td><strong>Pass</strong></td></tr>
    </tbody>
  </table>
  <p class="table-caption">Table 6.1: Test Results by Module</p>
  </div>
</div>

<!-- ===== CHAPTER 7: CHALLENGES AND SOLUTIONS ===== -->
<div class="report-page">
  <h2 class="chapter-title">Chapter 7: Challenges and Solutions</h2>

  <p>This chapter documents ten significant challenges encountered during development and the solutions devised for each.</p>

  <p><strong>Challenge 1: LLM Memory and Context Management.</strong> The Gemini 2.5 Flash API used for Saathi&rsquo;s AI mode has no built-in conversation memory. Each API call is stateless, meaning the model cannot reference earlier exchanges. <em>Solution:</em> The <code>buildConversationContext()</code> function in <code>slotMachine.ts</code> constructs a context window from the last 4 exchanges (8 messages) and includes it in every extraction prompt. This provides sufficient context for understanding referential expressions (&ldquo;I did that at Google&rdquo;) without exceeding input token limits.</p>

  <p><strong>Challenge 2: oklch Color Space and Browser Compatibility.</strong> The design system initially used oklch color functions for perceptually uniform color manipulation. Safari 15 and older Chrome versions do not support oklch, causing the entire UI to render without colors. <em>Solution:</em> The theme system was migrated to CSS custom properties with HSL fallbacks, using oklch only in progressive enhancement contexts where the browser explicitly supports it via <code>@supports (color: oklch(0 0 0))</code>.</p>

  <p><strong>Challenge 3: Multilingual Entity Extraction.</strong> Hindi and Hinglish inputs such as &ldquo;mera naam Rahul hai, Solan se hoon&rdquo; (my name is Rahul, I am from Solan) contain no standard English patterns for entity extraction. <em>Solution:</em> The entity extraction system was extended with Hindi/Hinglish patterns: <code>/(?:mera naam|main)\\s+([a-z]+)(?:\\s+(?:hai|hoon|hu))?/i</code> for names, and <code>/(?:se hoon|mein rehta|se)\\s+([A-Z][a-zA-Z]+)/i</code> for locations. When the Gemini API is available, the AI extractor handles these patterns natively.</p>

  <p><strong>Challenge 4: Audio False Positives.</strong> Early versions of the audio monitor flagged typing sounds, chair movements, and ambient noise as speech events, producing excessive integrity penalties. <em>Solution:</em> The three-layer architecture was designed specifically to reduce false positives. Layer 1 (spectral) checks that &gt;50% of energy is in the speech formant band (300&ndash;3400 Hz). Layer 2 (temporal) requires syllabic modulation at 3&ndash;8 Hz. Layer 3 (adaptive) recalibrates the baseline every 60 seconds using non-speech samples. Only when all three layers agree is speech declared. Additionally, impulses shorter than 200ms are ignored as mechanical noise.</p>

  <p><strong>Challenge 5: Device Fingerprinting Across Browsers.</strong> The initial fingerprinting approach included the User-Agent string, which differs across browsers on the same device. <em>Solution:</em> The fingerprint was redesigned to use only hardware-invariant signals: screen dimensions, GPU renderer (via WebGL debug info), canvas rendering (GPU-specific anti-aliasing), CPU cores, device memory, and audio stack signature. These signals remain constant across Chrome, Firefox, Safari, and Edge on the same physical device.</p>

  <p><strong>Challenge 6: Service Worker Caching of ML Models.</strong> ONNX model files (20&ndash;600MB) caused the service worker to exceed the browser&rsquo;s cache storage quota when aggressively precached. <em>Solution:</em> ML models were excluded from the service worker precache manifest. Instead, the model loaders in <code>src/ai/models/onnx.ts</code> and <code>src/ai/models/webllm.ts</code> store downloaded models in IndexedDB, which has significantly higher storage limits. The service worker only caches application code, stylesheets, and small static assets.</p>

  <p><strong>Challenge 7: Map Serialization in Zustand Stores.</strong> The Saathi <code>SlotState</code> uses JavaScript <code>Map</code> and <code>Set</code> objects, which are not JSON-serializable. IndexedDB persistence and localStorage serialization silently dropped Map/Set data. <em>Solution:</em> Custom serialization/deserialization functions (<code>serializeState()</code> / <code>deserializeState()</code> in <code>slotMachine.ts</code>) convert Maps to <code>[key, value][]</code> arrays and Sets to string arrays before JSON.stringify, then reconstruct the original data structures on load.</p>

  <p><strong>Challenge 8: Multi-Party Trust Without a Central Authority.</strong> The Bridge trust model requires that neither the candidate nor the employer can unilaterally tamper with test results, yet the platform itself should not hold permanent access to personal data. <em>Solution:</em> HMAC-SHA256 signing with per-criteria secrets provides tamper evidence without a central certificate authority. The signing key is held only by the Firebase Cloud Function and is never exposed to either party. Resume pinning via SHA-256 hashing ensures that post-assessment resume modifications are detectable without storing the resume content server-side.</p>

  <p><strong>Challenge 9: LLM-Detectable Patterns in Generated Questions.</strong> Early question generation produced answers where the correct option was consistently the longest, most hedged, or most detailed, which AI assistants could trivially identify. <em>Solution:</em> The <code>validateQuestion()</code> function in <code>questionGenerator.ts</code> enforces anti-LLM-tell constraints: character count variance across options must be &lt;20% from the mean; the correct option must not be uniquely the longest; the correct option must not have more punctuation (commas, semicolons) than any distractor. Questions failing validation are regenerated up to 3 times.</p>

  <p><strong>Challenge 10: Adaptive Difficulty Calibration.</strong> Fixed difficulty levels produced a bimodal distribution: strong candidates found all questions trivial, while weaker candidates found them impossible, both producing uninformative scores. <em>Solution:</em> The computerized adaptive testing algorithm adjusts difficulty based on performance. Level multipliers (1.0 to 6.0) reward correct answers at higher difficulties disproportionately, while score ceilings (45/75/90/100) prevent candidates from achieving high scores without demonstrating higher-level competency. The 15% sustained performance bonus rewards consistent excellence at levels 3+.</p>
</div>

<!-- ===== CHAPTER 8: CONCLUSION AND FUTURE SCOPE ===== -->
<div class="report-page">
  <h2 class="chapter-title">Chapter 8: Conclusion and Future Scope</h2>

  <h3 class="section-title">8.1 Summary of Contributions</h3>

  <p>This project makes five primary contributions to the domain of AI-powered career platforms:</p>

  <ol>
    <li><strong>Conversational Resume Building:</strong> Saathi introduces a slot-filling dialogue architecture with 23 data slots across 7 phases, supporting voice input in 10 Indian languages. The dual processing mode (regex offline + Gemini AI online) ensures functionality across all connectivity conditions, with 220 response templates providing natural, non-repetitive conversation flow. DistilBERT-NER augments regex-based extraction with neural entity recognition.</li>
    <li><strong>Transparent Agentic Screening:</strong> The 9-agent DAG pipeline with Kahn&rsquo;s topological sort and parallel execution provides a fully traceable alternative to black-box ATS systems. The 4-tier progressive AI architecture (regex NLP, ONNX embeddings, WebGPU LLM, Gemini API fallback) gracefully degrades across device capabilities. Every scoring decision is logged via the ReAct trace pattern, enabling employer review of the complete reasoning chain.</li>
    <li><strong>Cryptographic Trust Layer:</strong> Bridge establishes verifiable skill assessment through SHA-256 resume pinning, adaptive testing with anti-LLM-tell validation, multi-layered anti-cheat proctoring (browser integrity + three-layer audio intelligence), and HMAC-SHA256 signed scorecards. This is the first system to cryptographically bind resume integrity to verified competencies without video surveillance.</li>
    <li><strong>Wellbeing-Informed Career Decisions:</strong> The 8-parameter wellbeing engine, drawing on research from WHO, Nature, Gallup, and domain-specific studies, introduces health and life-quality metrics into the job evaluation process. Coverage of 31 Indian cities with data from CPCB, IMD, Numbeo, and NASSCOM sources makes this applicable to the majority of India&rsquo;s formal-sector employment.</li>
    <li><strong>Privacy-First In-Browser AI:</strong> All ML inference (TF-IDF, Jaccard, ONNX embeddings, DistilBERT NER, Gemma 4 reasoning) executes in the browser. No resume data is transmitted to external servers during analysis. This architecture satisfies data minimization requirements under the Digital Personal Data Protection Act, 2023, while providing AI capabilities previously available only through cloud services.</li>
  </ol>

  <h3 class="section-title">8.2 Key Achievements</h3>

  <ul>
    <li>516 automated tests across 27 test files, covering unit, integration, security, and accessibility domains, all passing.</li>
    <li>186-node skills taxonomy with alias normalization and adjacency matching, covering 10 categories relevant to Indian tech hiring.</li>
    <li>9-parameter weighted composite scoring formula with every weight traced to a peer-reviewed source (NACE, AAC&amp;U, SHRM, Marinescu &amp; Rathelot, Roulin &amp; Bangerter, Ladders).</li>
    <li>Three-layer audio intelligence system achieving speech detection with impulse filtering, whisper detection, and adaptive baseline recalibration, without recording or transmitting audio.</li>
    <li>Offline-first PWA architecture with IndexedDB persistence, service worker caching, and graceful AI degradation from L4 (Gemini API) through L1 (pure regex) based on available resources.</li>
    <li>WCAG 2.2 AAA accessibility compliance with semantic HTML, ARIA attributes, keyboard navigation, screen reader support, and high-contrast theming.</li>
    <li>Wellbeing scoring engine covering 31 Indian cities with 8 research-cited parameters and 5 classification levels with actionable, research-backed messages.</li>
  </ul>

  <h3 class="section-title">8.3 Limitations</h3>

  <p>The following limitations are acknowledged: (1) The L3 reasoning agent requires WebGPU, available only in Chromium-based browsers, with significant latency (30&ndash;60 seconds) on WASM CPU fallback. (2) Voice input depends on the Web Speech API, which has inconsistent implementations across browsers and is unavailable in Firefox. (3) The skills taxonomy, while comprehensive at 186 entries, may not cover niche or rapidly emerging technologies. (4) Wellbeing data is updated quarterly and reflects annual averages rather than real-time conditions. (5) The anti-cheat audio system requires microphone permission, and candidates who decline receive no audio monitoring, which may incentivize declining. (6) The platform has not undergone large-scale user testing with actual hiring processes.</p>

  <h3 class="section-title">8.4 Future Work</h3>

  <p>Several directions for future development are identified:</p>

  <ol>
    <li><strong>Saathi Evolution:</strong> Integration of a fully local small language model (such as Gemma 2B quantized to INT4, approximately 1.5 GB) for offline conversational understanding, eliminating dependence on the Gemini API for multilingual input processing.</li>
    <li><strong>Employer Pipeline Enhancements:</strong> Addition of interview scheduling integration, video resume analysis, and longitudinal tracking of hiring outcomes to refine scoring weights empirically.</li>
    <li><strong>Bridge Federation:</strong> Development of a decentralized verification protocol allowing scorecards to be validated across multiple institutions without a central authority, potentially using verifiable credentials (W3C VC standard).</li>
    <li><strong>Wellbeing Real-Time Data:</strong> Integration of live AQI and temperature feeds via OpenWeatherMap and CPCB APIs, replacing static lookup tables with real-time environmental data.</li>
    <li><strong>Regional Language Expansion:</strong> Addition of Marathi, Assamese, Manipuri, and other scheduled language support in both the Saathi conversational engine and the voice input system.</li>
    <li><strong>Mobile-Native Application:</strong> Development of a React Native wrapper to access native device APIs (push notifications, background sync, biometric authentication) while sharing the core business logic with the web application.</li>
    <li><strong>Large-Scale Validation:</strong> Conducting controlled hiring experiments comparing ResumeAI-screened candidates against traditional ATS screening to empirically validate the scoring formula&rsquo;s predictive accuracy.</li>
  </ol>
</div>

<!-- ===== REFERENCES ===== -->
<div class="report-page">
  <h2 class="chapter-title">References</h2>
  <div class="ref-list">
    <p>AAC&U. (n.d.). VALUE Rubrics. Association of American Colleges and Universities. Retrieved from https://www.aacu.org/value/rubrics</p>
    <p>Bali, K., Sharma, J., Choudhury, M., & Vyas, Y. (2014). "I am borrowing ya mixing?" An analysis of English-Hindi code mixing in Facebook. In <em>Proceedings of the First Workshop on Computational Approaches to Code Switching</em>, EMNLP.</p>
    <p>Bloom, N., Han, R., & Liang, J. (2024). How hybrid working from home works out. <em>Nature</em>.</p>
    <p>Clark, B., Chatterjee, K., Martin, A., & Davis, A. (2020). How commuting affects subjective wellbeing. <em>Transportation</em>, 47, 2783&ndash;2805.</p>
    <p>Cole, M. S., Rubin, R. S., Feild, H. S., & Giles, W. F. (2007). Recruiters' perceptions and use of applicant resume information. <em>Applied Psychology</em>, 56(2), 286&ndash;310.</p>
    <p>CPCB. (2025). <em>Annual Air Quality Report</em>. Central Pollution Control Board, India.</p>
    <p>Gajendran, R. S., & Harrison, D. A. (2007). The good, the bad, and the unknown about telecommuting: Meta-analysis of psychological mediators and individual consequences. <em>Journal of Applied Psychology</em>, 92(6), 1524&ndash;1541.</p>
    <p>Glassdoor. (2023). Job market trends and application statistics. Glassdoor Economic Research.</p>
    <p>Graff Zivin, J., & Neidell, M. (n.d.). Air pollution and worker productivity. <em>IZA World of Labour</em>.</p>
    <p>Hart Research Associates / AAC&U. (2018). <em>Fulfilling the American Dream: Liberal Education and the Future of Work</em>. AAC&U.</p>
    <p>Henle, C. A., Dineen, B. R., & Duffy, M. K. (2019). Assessing intentional resume deception: Development and nomological network of a resume fraud measure. <em>Journal of Business Psychology</em>, 34, 207&ndash;225.</p>
    <p>IMD. (2025). <em>Heatwave Reports</em>. India Meteorological Department.</p>
    <p>Jaccard, P. (1901). Distribution de la flore alpine dans le bassin des Dranses et dans quelques regions voisines. <em>Bulletin de la Societe Vaudoise des Sciences Naturelles</em>, 37, 241&ndash;272.</p>
    <p>Jobscan. (2024). ATS usage statistics and resume optimization data. Jobscan.co.</p>
    <p>Knouse, S. B. (1994). Impressions of the resume: The effects of applicant education, experience, and impression management. <em>Personnel Psychology</em>, 47(3), 523&ndash;534.</p>
    <p>Ladders. (2018). <em>Eye-Tracking Study: How Recruiters Read Resumes</em>. TheLadders.com.</p>
    <p>Marinescu, I., & Rathelot, R. (2018). Mismatch unemployment and the geography of job search. <em>American Economic Journal: Macroeconomics</em>, 10(3), 42&ndash;70.</p>
    <p>Murphy, K., & colleagues. (2023). Commuting demands meta-analysis. <em>Work & Stress</em>.</p>
    <p>NACE. (2024). <em>Job Outlook 2024</em>. National Association of Colleges and Employers. Retrieved from https://www.naceweb.org</p>
    <p>NASSCOM / Aon. (2024). <em>India Technology Industry Attrition Report</em>. NASSCOM.</p>
    <p>Nature Scientific Reports. (2026). Heat stress on labour productivity in Southern India.</p>
    <p>Numbeo. (2025). Cost of Living Index by City, India. Numbeo.com.</p>
    <p>Pega, F., et al. / WHO/ILO. (2021). Global, regional, and national burdens of ischemic heart disease and stroke attributable to exposure to long working hours. <em>Environment International</em>, 154.</p>
    <p>Price, P. (1990). Evaluation of spoken language systems: The ATIS domain. In <em>Proceedings of the Workshop on Speech and Natural Language</em>, ACL.</p>
    <p>Rath, T., & Harter, J. / Gallup. (2010). <em>Wellbeing: The Five Essential Elements</em>. Gallup Press.</p>
    <p>Redmond, L. S., & Mokhtarian, P. L. (2001). The positive utility of the commute. <em>Transportation Research Part A</em>, 35(3), 191&ndash;219.</p>
    <p>Reimers, N., & Gurevych, I. (2019). Sentence-BERT: Sentence embeddings using Siamese BERT-networks. In <em>Proceedings of EMNLP</em>.</p>
    <p>Roulin, N., & Bangerter, A. (2013). Students' use of extra-curricular activities for positional advantage in competitive job markets. <em>Journal of Education and Work</em>, 26(1), 21&ndash;47.</p>
    <p>Salton, G. (1975). <em>A Theory of Indexing</em>. CBMS-NSF Regional Conference Series in Applied Mathematics, SIAM.</p>
    <p>Sanh, V., Debut, L., Chaumond, J., & Wolf, T. (2019). DistilBERT, a distilled version of BERT. <em>NeurIPS Workshop on Energy-Efficient Machine Learning</em>.</p>
    <p>SHRM. (2021). <em>Credentials and Hiring Confidence Survey</em>. Society for Human Resource Management.</p>
    <p>Stutzer, A., & Frey, B. S. (2008). Stress that doesn't pay: The commuting paradox. <em>Scandinavian Journal of Economics</em>, 110(2), 339&ndash;366.</p>
    <p>Wang, L., et al. (2024). Text embeddings by weakly-supervised contrastive pre-training. In <em>Proceedings of ACL 2024</em>.</p>
  </div>
</div>

<!-- ===== APPENDIX A: PROJECT DIARY ===== -->
<div class="report-page">
  <h2 class="chapter-title">Appendix A: Project Diary</h2>

  <table class="project-diary">
    <thead>
      <tr><th>Week</th><th>Dates</th><th>Activities</th><th>Deliverables</th></tr>
    </thead>
    <tbody>
      <tr><td>1</td><td>Jan 6&ndash;12</td><td>Literature review: ATS systems, resume parsing, NLP in recruitment. Survey of existing platforms (Canva, Zety, NovoResume, Jobscan).</td><td>Literature survey document</td></tr>
      <tr><td>2</td><td>Jan 13&ndash;19</td><td>Requirements analysis. Functional and non-functional requirements specification. Architecture design: module decomposition, technology selection.</td><td>SRS document, architecture diagram</td></tr>
      <tr><td>3</td><td>Jan 20&ndash;26</td><td>Project scaffolding: React 19 + TypeScript + Vite + Tailwind setup. Zustand store architecture with IndexedDB persistence adapter.</td><td>Project skeleton with build pipeline</td></tr>
      <tr><td>4</td><td>Jan 27&ndash;Feb 2</td><td>Resume builder form mode: PersonalInfoForm, SectionEditor, EntryEditor, BulletEditor components. Four template implementations.</td><td>Form-based resume builder with 4 templates</td></tr>
      <tr><td>5</td><td>Feb 3&ndash;9</td><td>Saathi slot-filling engine: slot definitions, entity extractor (12 regex patterns), response bank (220 templates), conversation state machine.</td><td>Offline conversational engine</td></tr>
      <tr><td>6</td><td>Feb 10&ndash;16</td><td>Saathi voice input: Web Speech API integration, Unicode script detection for 10 languages, BCP-47 language mapping.</td><td>Multilingual voice input system</td></tr>
      <tr><td>7</td><td>Feb 17&ndash;23</td><td>AI pipeline L1: TF-IDF vectorizer, Jaccard similarity, section detection, entity extraction, completeness scoring.</td><td>L1 NLP agent with 0ms dependency</td></tr>
      <tr><td>8</td><td>Feb 24&ndash;Mar 2</td><td>AI pipeline L2: ONNX Runtime Web integration, E5-small-v2 embedding model, semantic similarity with TF-IDF fallback.</td><td>L2 embedding agent</td></tr>
      <tr><td>9</td><td>Mar 3&ndash;9</td><td>AI pipeline L3/L4: Gemma 4 E2B via Transformers.js WebGPU, contradiction detection prompts, Gemini API fallback. DAG executor with Kahn&rsquo;s algorithm.</td><td>Complete 9-agent pipeline</td></tr>
      <tr><td>10</td><td>Mar 10&ndash;16</td><td>Score Agent: 9-parameter weighted composite with research-cited weights. Skills taxonomy (186 nodes, 10 categories). VALUE rubric classification.</td><td>Scoring engine with citations</td></tr>
      <tr><td>11</td><td>Mar 17&ndash;23</td><td>Bridge module: criteria publication, resume pinning (SHA-256), adaptive testing engine (5 levels, 3 question types), anti-LLM-tell validation.</td><td>Bridge test infrastructure</td></tr>
      <tr><td>12</td><td>Mar 24&ndash;30</td><td>Anti-cheat system: browser integrity monitor, three-layer audio intelligence, speed anomaly detection, compound anomaly logic. HMAC scorecard signing.</td><td>Complete anti-cheat + signing</td></tr>
      <tr><td>13</td><td>Mar 31&ndash;Apr 6</td><td>Wellbeing engine: 8 sub-score formulas, city data tables (CoL, AQI, WBGT), Maps API integration, classification system.</td><td>Wellbeing scoring for 31 cities</td></tr>
      <tr><td>14</td><td>Apr 7&ndash;13</td><td>Saathi AI mode: Gemini 2.5 Flash integration for extraction and response generation, DistilBERT NER, dual-mode processing.</td><td>AI-enhanced Saathi</td></tr>
      <tr><td>15</td><td>Apr 14&ndash;20</td><td>Testing: 516 tests across 27 files. Security hardening: CSP, HSTS, device fingerprinting. Accessibility audit and fixes. PWA service worker.</td><td>Complete test suite, security audit</td></tr>
      <tr><td>16</td><td>Apr 21&ndash;27</td><td>Documentation: capstone report writing, pitch deck preparation, deployment to Firebase Hosting, final review and submission.</td><td>Project report, deployed application</td></tr>
    </tbody>
  </table>
</div>

<!-- ===== APPENDIX B: SCORING FORMULAS ===== -->
<div class="report-page">
  <h2 class="chapter-title">Appendix B: Scoring Formulas and Research Citations</h2>

  <div style="page-break-inside: auto;">
  <table>
    <thead>
      <tr><th>Parameter</th><th>Weight</th><th>Formula</th><th>Citation</th></tr>
    </thead>
    <tbody>
      <tr><td>Skills Match</td><td>30%</td><td>0.4 &times; Jaccard(resume_skills, jd_skills) + 0.6 &times; cosine(TF-IDF(resume), TF-IDF(jd))</td><td>Jaccard (1901); Salton (1975); NACE 2024</td></tr>
      <tr><td>Experience</td><td>20%</td><td>has_experience &times; semantic_relevance</td><td>NACE Internship Survey 2024 (56.1% intern-to-hire)</td></tr>
      <tr><td>Education</td><td>15%</td><td>CIP-SOC keyword overlap proxy</td><td>NACE 2024 (73.4% screen by major)</td></tr>
      <tr><td>Projects</td><td>10%</td><td>avg(VALUE_rubric_score) where capstone=1.0, milestone3=0.75, milestone2=0.5, benchmark=0.25</td><td>AAC&U VALUE Rubrics; Hart Research 2018</td></tr>
      <tr><td>Certifications</td><td>5%</td><td>has_certs &times; semantic_relevance</td><td>SHRM Credentials 2021 (87% HR confidence)</td></tr>
      <tr><td>Distance</td><td>5%</td><td>exp(-0.043 &times; miles)</td><td>Marinescu & Rathelot 2018, AEJ:Macro 10(3):42-70</td></tr>
      <tr><td>Extracurricular</td><td>5%</td><td>0.6 &times; has_extra + 0.4 &times; has_leadership</td><td>Roulin & Bangerter 2013; Cole et al. 2007</td></tr>
      <tr><td>GPA</td><td>3%</td><td>(GPA - 2.0) / 2.0, null=0.5</td><td>NACE 2024 (38.3% use 3.0 cutoff)</td></tr>
      <tr><td>Completeness</td><td>2%</td><td>count(present_sections) / count(expected_sections)</td><td>Ladders Eye-Tracking 2018</td></tr>
    </tbody>
  </table>
  <p class="table-caption">Table B.1: Candidate Scoring Formulas</p>
  </div>

  <p class="no-indent" style="margin-top: 12pt;"><strong>Composite:</strong> base_score = &Sigma;(w<sub>i</sub> &times; s<sub>i</sub>) &times; 100. Red flag penalties: fabrication=-20, embellishment=-10, omission=-5 (Henle et al. 2019). Final = clamp(base + penalty, 0, 100). Parseability hard gate: &lt;75% sections identified &rarr; score=0.</p>

  <div style="page-break-inside: auto; margin-top: 24pt;">
  <table>
    <thead>
      <tr><th>Parameter</th><th>Weight</th><th>Formula</th><th>Citation</th></tr>
    </thead>
    <tbody>
      <tr><td>Commute</td><td>25%</td><td>100 at &le;15 min; piecewise decay: -2/min to 30, -2/min to 45, -1.33/min to 60, -0.5/min to 90, then 5</td><td>Redmond & Mokhtarian 2001; Clark et al. 2020</td></tr>
      <tr><td>Work Hours</td><td>20%</td><td>100 at &le;40h, 90 at &le;45h, 70 at &le;50h, 40 at &le;55h, 15 above</td><td>WHO/ILO Pega et al. 2021</td></tr>
      <tr><td>Work Mode</td><td>15%</td><td>hybrid=100, hybrid-1=85, remote=70, onsite=50</td><td>Bloom et al. 2024 (Nature)</td></tr>
      <tr><td>Real Salary</td><td>15%</td><td>min(100, (offered / CoL_index / national_median) &times; 50)</td><td>Gallup Five Elements; Numbeo India</td></tr>
      <tr><td>Air Quality</td><td>10%</td><td>100 at PM2.5 &le;15, 80 at &le;25, 60 at &le;50, 30 at &le;100, 10 above</td><td>WHO PM2.5 guidelines; Graff Zivin & Neidell</td></tr>
      <tr><td>Industry Stability</td><td>5%</td><td>max(0, 100 - attrition% &times; 3)</td><td>NASSCOM/Aon 2024</td></tr>
      <tr><td>Heat Stress</td><td>5%</td><td>100 at WBGT &le;25&deg;C, 70 at &le;30, 30 at &le;35, 10 above</td><td>Nature Sci. Reports 2026; IMD</td></tr>
      <tr><td>Commute Cost</td><td>5%</td><td>max(0, 100 - (monthly_cost / monthly_salary) &times; 1000)</td><td>ORF India commute economics</td></tr>
    </tbody>
  </table>
  <p class="table-caption">Table B.2: Wellbeing Scoring Formulas</p>
  </div>

  <p class="no-indent" style="margin-top: 12pt;"><strong>Composite:</strong> &Sigma;(w<sub>i</sub> &times; s<sub>i</sub>), relocation penalty = -10. Classification: thriving (&ge;80), comfortable (60&ndash;79), strained (40&ndash;59), at-risk (20&ndash;39), concerning (&lt;20).</p>
</div>

<!-- ===== APPENDIX C: SKILLS TAXONOMY ===== -->
<div class="report-page">
  <h2 class="chapter-title">Appendix C: Skills Taxonomy Summary</h2>

  <p>The skills taxonomy defined in <code>src/ai/taxonomy/skillsGraph.ts</code> contains 186 skill nodes organized into 10 categories. Each node includes a canonical ID, display name, aliases for normalization, and adjacent skills for proximity matching. The taxonomy is inspired by ESCO (European Skills/Competences), O*NET (US Occupational Information Network), and LinkedIn Skills Graph, tuned for Indian fresher and tech hiring contexts.</p>

  <div style="page-break-inside: auto;">
  <table>
    <thead>
      <tr><th>Category</th><th>Count</th><th>Examples</th></tr>
    </thead>
    <tbody>
      <tr><td>Language</td><td>22</td><td>JavaScript, TypeScript, Python, Java, C++, Go, Rust, Kotlin, Swift, Dart, R, Scala, Ruby, PHP, C#, MATLAB, SQL, Shell/Bash, Perl, Lua, Haskell, Elixir</td></tr>
      <tr><td>Framework</td><td>28</td><td>React, Angular, Vue.js, Next.js, Express, Django, Flask, Spring Boot, Rails, Laravel, Svelte, Nuxt.js, FastAPI, .NET, Electron, React Native, Flutter</td></tr>
      <tr><td>Library</td><td>18</td><td>TensorFlow, PyTorch, scikit-learn, Pandas, NumPy, Matplotlib, OpenCV, Hugging Face Transformers, jQuery, Lodash, D3.js, Three.js</td></tr>
      <tr><td>Database</td><td>16</td><td>PostgreSQL, MySQL, MongoDB, Redis, Elasticsearch, SQLite, Cassandra, DynamoDB, Neo4j, InfluxDB, CockroachDB, Firestore, Supabase</td></tr>
      <tr><td>DevOps</td><td>20</td><td>Docker, Kubernetes, Jenkins, Terraform, Ansible, GitHub Actions, GitLab CI, CircleCI, Prometheus, Grafana, Nginx, Apache, Helm, ArgoCD</td></tr>
      <tr><td>Cloud</td><td>15</td><td>AWS, GCP, Azure, Firebase, Vercel, Netlify, Heroku, DigitalOcean, Cloudflare, AWS Lambda, S3, EC2, Cloud Run, BigQuery, Snowflake</td></tr>
      <tr><td>Tool</td><td>22</td><td>Git, VS Code, Figma, Postman, Jira, Slack, Notion, Webpack, Vite, ESLint, Prettier, Chrome DevTools, Wireshark, Burp Suite, Nmap</td></tr>
      <tr><td>Methodology</td><td>15</td><td>Agile, Scrum, Kanban, TDD, BDD, CI/CD, DevOps, Microservices, REST API, GraphQL, Event-Driven, Domain-Driven Design, Clean Architecture</td></tr>
      <tr><td>Soft Skill</td><td>16</td><td>Leadership, Communication, Teamwork, Problem Solving, Critical Thinking, Time Management, Adaptability, Creativity, Presentation, Mentoring</td></tr>
      <tr><td>Domain</td><td>14</td><td>Machine Learning, Deep Learning, NLP, Computer Vision, Data Science, Cybersecurity, Blockchain, IoT, Cloud Architecture, DevSecOps, MLOps</td></tr>
    </tbody>
  </table>
  <p class="table-caption">Table C.1: Skills Taxonomy by Category</p>
  </div>

  <p>All lookups are O(1) via pre-built <code>Map</code> data structures. The <code>normalizeSkill()</code> function maps aliases to canonical IDs (e.g., &ldquo;JS&rdquo; &rarr; &ldquo;javascript&rdquo;, &ldquo;k8s&rdquo; &rarr; &ldquo;kubernetes&rdquo;, &ldquo;ML&rdquo; &rarr; &ldquo;machine-learning&rdquo;). The <code>computeSkillOverlap()</code> function produces exact matches (weight 1.0) and adjacent matches (weight 0.5) to compute a composite skill alignment score.</p>
</div>

`;
