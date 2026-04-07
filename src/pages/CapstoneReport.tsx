import { chapterContent } from './capstone-content';

export function CapstoneReport() {
  return (
    <>
      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 25.4mm 25.4mm 25.4mm 38.1mm;
          }
          body { margin: 0; padding: 0; }
          nav, footer, .no-print { display: none !important; }
          .report-container { padding: 0 !important; max-width: none !important; }
          .report-page {
            page-break-after: always;
            break-after: page;
            padding: 0 !important;
            margin: 0 !important;
            box-shadow: none !important;
          }
          .report-page:last-child { page-break-after: auto; }
          h1, h2, h3, h4, h5, h6 { page-break-after: avoid; break-after: avoid; }
          figure, img { page-break-inside: avoid; break-inside: avoid; }
          table { page-break-inside: auto; break-inside: auto; }
          table thead { display: table-header-group; }
          table tr { page-break-inside: avoid; break-inside: avoid; }
          .tbl-caption { page-break-before: avoid; break-before: avoid; }
          p { orphans: 3; widows: 3; }
        }
        @media screen {
          .report-container {
            max-width: 210mm;
            margin: 0 auto;
            padding: 20px;
          }
          .report-page {
            background: white;
            color: black;
            padding: 38.1mm 25.4mm 25.4mm 38.1mm;
            margin-bottom: 20px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.15);
            min-height: 297mm;
            position: relative;
          }
        }
        .report-page {
          font-family: 'Times New Roman', Times, serif;
          font-size: 12pt;
          line-height: 1.5;
          text-align: justify;
          color: #000;
        }
        .report-page * { color: #000; }
        .cover-page {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          min-height: 247mm;
        }
        .cover-page h1 {
          font-size: 17pt;
          font-weight: bold;
          text-transform: uppercase;
          margin: 16pt 0;
          line-height: 1.4;
        }
        .cover-page .label {
          font-size: 14pt;
          font-weight: bold;
          text-transform: uppercase;
          letter-spacing: 1pt;
          margin: 8pt 0;
        }
        .cover-page .degree {
          font-size: 13pt;
          font-style: italic;
          margin: 12pt 0;
        }
        .cover-page .submission-row {
          display: flex;
          justify-content: space-between;
          width: 100%;
          margin: 24pt 0;
          font-size: 12pt;
        }
        .cover-page .university {
          font-size: 13pt;
          font-weight: bold;
          text-transform: uppercase;
          margin-top: 20pt;
          line-height: 1.6;
        }
        .chapter-title {
          font-size: 16pt;
          font-weight: bold;
          text-transform: uppercase;
          text-align: center;
          margin: 0 0 24pt 0;
          padding-top: 0;
        }
        .section-title {
          font-size: 14pt;
          font-weight: bold;
          margin: 18pt 0 10pt 0;
          text-align: left;
        }
        .subsection-title {
          font-size: 12pt;
          font-weight: bold;
          margin: 14pt 0 8pt 0;
          text-align: left;
        }
        .report-page p {
          margin: 0 0 10pt 0;
          text-indent: 12.7mm;
        }
        .report-page p.no-indent,
        .report-page .no-indent {
          text-indent: 0;
        }
        .report-page ul, .report-page ol {
          margin: 6pt 0 10pt 20pt;
          text-indent: 0;
        }
        .report-page li {
          margin-bottom: 4pt;
          text-align: justify;
        }
        .report-page table {
          width: 100%;
          border-collapse: collapse;
          margin: 12pt 0;
          font-size: 11pt;
          page-break-inside: auto;
          break-inside: auto;
        }
        .report-page table th,
        .report-page table td {
          border: 1px solid #000;
          padding: 6pt 8pt;
          text-align: left;
          vertical-align: top;
        }
        .report-page table th {
          background: #f0f0f0;
          font-weight: bold;
        }
        /* ── Inline code: VS Code-inspired syntax coloring ── */
        .report-page code {
          font-family: 'Fira Code', 'Cascadia Code', 'JetBrains Mono', 'Consolas', 'Monaco', monospace;
          font-size: 10pt;
          background: #f8f8f8;
          border: 1px solid #e0e0e0;
          border-radius: 3px;
          padding: 1pt 4pt;
          color: #d73a49;
          word-break: break-word;
        }
        @media print {
          .report-page code {
            background: #f5f5f5;
            border-color: #ddd;
          }
        }
        /* Function calls: blue like VS Code */
        .report-page code.fn,
        .report-page code[data-type="fn"] {
          color: #795e26;
        }
        /* Types/interfaces: teal like VS Code */
        .report-page code.type,
        .report-page code[data-type="type"] {
          color: #267f99;
        }
        /* File paths: green */
        .report-page code.file,
        .report-page code[data-type="file"] {
          color: #098658;
        }
        /* String values: brown/orange */
        .report-page code.str,
        .report-page code[data-type="str"] {
          color: #a31515;
        }
        /* Numbers/constants: dark blue */
        .report-page code.num,
        .report-page code[data-type="num"] {
          color: #0000ff;
        }
        /* Keywords: purple */
        .report-page code.kw,
        .report-page code[data-type="kw"] {
          color: #af00db;
        }
        /* Variable names: default dark red (already set in base code) */

        .report-page .tbl-caption,
        .report-page .figure-caption {
          text-align: center;
          font-style: italic;
          font-size: 11pt;
          margin: 6pt 0 12pt 0;
          text-indent: 0;
        }
        .report-page .signature-block {
          margin-top: 48pt;
          text-align: left;
        }
        .report-page .signature-line {
          display: inline-block;
          width: 200pt;
          border-bottom: 1px solid #000;
          margin-bottom: 4pt;
        }
        .report-page .cert-text {
          text-indent: 0;
          margin-bottom: 12pt;
        }
        .toc-entry {
          display: flex;
          justify-content: space-between;
          margin: 3pt 0;
          text-indent: 0;
        }
        .toc-entry.chapter { font-weight: bold; margin-top: 10pt; }
        .toc-entry.section { padding-left: 20pt; }
        .toc-entry.subsection { padding-left: 40pt; font-size: 11pt; }
        .toc-dots {
          flex: 1;
          border-bottom: 1px dotted #999;
          margin: 0 4pt;
          min-width: 20pt;
        }
        .abbr-table td:first-child {
          font-weight: bold;
          width: 120pt;
          white-space: nowrap;
        }
        .ref-list {
          text-indent: 0;
        }
        .ref-list p {
          text-indent: -36pt;
          padding-left: 36pt;
          margin-bottom: 8pt;
        }
        .project-diary th { font-size: 10pt; }
        .project-diary td { font-size: 10pt; }
      `}</style>
      <div className="report-container no-print-override">
        {/* ===== COVER PAGE ===== */}
        <div className="report-page">
          <div className="cover-page">
            <div className="label">A Project Report</div>
            <div className="label">on</div>
            <h1>ResumeAI: An AI-Powered Career Platform with Conversational Resume Building, Agentic Employer Screening, and Cryptographic Skill Verification</h1>
            <img src="/assets/images/shoolini-logo.png" alt="Shoolini University Logo" style={{ height: '120px', margin: '16pt 0' }} />
            <div className="degree">Bachelor of Technology<br />in<br />Computer Science and Engineering<br />(Cybersecurity)</div>
            <div className="submission-row">
              <div style={{ textAlign: 'left' }}>
                <strong>Submitted by:</strong><br />
                Astha Chandel<br />
                GF202214559
              </div>
              <div style={{ textAlign: 'right' }}>
                <strong>Supervised by:</strong><br />
                Dr. Kritika Rana<br />
                Assistant Professor
              </div>
            </div>
            <div className="university">
              Yogananda School of AI, Computers and Data Sciences<br />
              Shoolini University<br />
              Solan, Himachal Pradesh, India<br />
              April 2026
            </div>
          </div>
        </div>

        {/* ===== DECLARATION ===== */}
        <div className="report-page">
          <h2 className="chapter-title">Declaration by the Candidate</h2>
          <p>I hereby declare that the project titled <strong>&ldquo;ResumeAI: An AI-Powered Career Platform with Conversational Resume Building, Agentic Employer Screening, and Cryptographic Skill Verification&rdquo;</strong> has been carried out by me as part of the requirements for the degree of Bachelor of Technology in Computer Science and Engineering (Cybersecurity) at Shoolini University of Biotechnology and Management Sciences, Solan (H.P.), India, under the supervision of <strong>Dr. Kritika Rana</strong>.</p>
          <p>I further declare that this project report is a result of my own original work and has not been submitted, in part or in full, to any other university or institution for the award of any degree, diploma, or certificate.</p>
          <p>All sources of information, data, and literature used in this work have been duly acknowledged through proper citations and references.</p>
          <div className="signature-block">
            <p className="no-indent"><strong>Place:</strong> Solan, Himachal Pradesh</p>
            <p className="no-indent"><strong>Date:</strong> April 2026</p>
            <br /><br /><br />
            <div className="signature-line"></div>
            <p className="no-indent"><strong>Astha Chandel</strong><br />GF202214559<br />BTech CSE (Cybersecurity)<br />Shoolini University</p>
          </div>
        </div>

        {/* ===== CERTIFICATE FROM GUIDE ===== */}
        <div className="report-page">
          <h2 className="chapter-title">Certificate</h2>
          <p className="cert-text">This is to certify that <strong>Ms. Astha Chandel</strong> (Roll No. <strong>GF202214559</strong>), a student of <strong>Bachelor of Technology in Computer Science and Engineering (Cybersecurity)</strong> at <strong>Shoolini University</strong>, has successfully completed her capstone project titled:</p>
          <p className="cert-text" style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '13pt' }}>&ldquo;ResumeAI: An AI-Powered Career Platform with Conversational Resume Building, Agentic Employer Screening, and Cryptographic Skill Verification&rdquo;</p>
          <p className="cert-text">The work presented in this report is a bonafide record of the project work carried out by her under my supervision during the academic year 2025&ndash;2026. The project demonstrates a comprehensive understanding of artificial intelligence, web technologies, cryptographic systems, and software engineering principles, and fulfills the requirements for the BTech capstone project.</p>
          <p className="cert-text">The work embodies original contributions including an in-browser multi-agent AI pipeline, a conversational resume building engine with multilingual voice support, and a cryptographic skill verification system with anti-cheat proctoring. The project exhibits significant technical depth appropriate for a final-year capstone in cybersecurity specialization.</p>
          <p className="cert-text">I recommend this project report for evaluation.</p>
          <div className="signature-block">
            <p className="no-indent"><strong>Place:</strong> Solan, Himachal Pradesh</p>
            <p className="no-indent"><strong>Date:</strong> April 2026</p>
            <br /><br /><br />
            <div className="signature-line"></div>
            <p className="no-indent"><strong>Dr. Kritika Rana</strong><br />Project Guide<br />Yogananda School of AI, Computers and Data Sciences<br />Shoolini University, Solan</p>
          </div>
        </div>

        {/* ===== CERTIFICATE FROM HoS ===== */}
        <div className="report-page">
          <h2 className="chapter-title">Certificate from Head of School</h2>
          <p className="cert-text">This is to certify that the project report titled <strong>&ldquo;ResumeAI: An AI-Powered Career Platform with Conversational Resume Building, Agentic Employer Screening, and Cryptographic Skill Verification&rdquo;</strong> submitted by <strong>Ms. Astha Chandel</strong> (Roll No. <strong>GF202214559</strong>) is a bonafide record of work carried out during the academic year 2025&ndash;2026 for the partial fulfillment of the requirements of the degree of <strong>Bachelor of Technology in Computer Science and Engineering (Cybersecurity)</strong>.</p>
          <p className="cert-text">The project has been reviewed and is recommended for evaluation.</p>
          <div className="signature-block">
            <p className="no-indent"><strong>Place:</strong> Solan, Himachal Pradesh</p>
            <p className="no-indent"><strong>Date:</strong> April 2026</p>
            <br /><br /><br />
            <div className="signature-line"></div>
            <p className="no-indent"><strong>Dr. Pankaj Vaidya</strong><br />Head of School<br />Yogananda School of AI, Computers and Data Sciences<br />Shoolini University, Solan</p>
          </div>
        </div>

        {/* ===== ACKNOWLEDGEMENTS ===== */}
        <div className="report-page">
          <h2 className="chapter-title">Acknowledgements</h2>
          <p>I would like to express my sincere gratitude to all those who contributed to the successful completion of this capstone project.</p>
          <p>First and foremost, I am deeply grateful to my project guide, <strong>Dr. Kritika Rana</strong>, for her invaluable guidance, constructive feedback, and continuous encouragement throughout the duration of this project. Her expertise in the domain of computer science and her meticulous approach to research have been instrumental in shaping this work.</p>
          <p>I extend my heartfelt thanks to <strong>Dr. Pankaj Vaidya</strong>, Head of School, Yogananda School of AI, Computers and Data Sciences, for providing an excellent academic environment and for his support in facilitating the resources required for this project.</p>
          <p>I am thankful to the faculty members of the Yogananda School of AI, Computers and Data Sciences at Shoolini University for their teachings and insights that formed the foundation upon which this project was built. The coursework in cybersecurity, artificial intelligence, and software engineering provided the theoretical grounding necessary for this interdisciplinary endeavour.</p>
          <p>I also acknowledge the open-source community and the researchers whose publicly available tools, models, and publications made this project possible. Specific gratitude is owed to the teams behind React, Firebase, Hugging Face Transformers.js, ONNX Runtime, and the authors of the research papers cited in this work.</p>
          <p>Finally, I thank my family and friends for their unwavering support, patience, and motivation throughout this academic journey.</p>
          <div className="signature-block" style={{ marginTop: '36pt' }}>
            <div className="signature-line"></div>
            <p className="no-indent"><strong>Astha Chandel</strong></p>
          </div>
        </div>

        {/* ===== ABSTRACT ===== */}
        <div className="report-page">
          <h2 className="chapter-title">Abstract</h2>
          <p>ResumeAI is an offline-first, in-browser artificial intelligence career platform comprising three interconnected modules. The first module, Saathi, is a conversational resume builder that employs a slot-filling architecture with 23 data slots organized across 7 conversational phases. It supports voice input in 10 Indian languages through the Web Speech API with automatic Unicode script detection, and operates in a dual processing mode: a regex-based offline mode for structured data extraction, and an AI-enhanced mode utilizing Gemini 2.5 Flash for multilingual understanding of Hindi, Hinglish, and regional languages. The system includes 241 response templates and DistilBERT-based named entity recognition for improved extraction accuracy.</p>
          <p>The second module is a 9-agent employer screening pipeline orchestrated through a directed acyclic graph executor implementing Kahn&rsquo;s topological sort algorithm. The pipeline employs a 4-tier progressive AI architecture: L1 performs regex-based NLP with TF-IDF and Jaccard similarity; L2 computes semantic embeddings using the E5-small-v2 model via ONNX Runtime Web; L3 deploys Gemma 4 E2B through WebGPU for in-browser reasoning and contradiction detection; and L4 falls back to the Gemini API when local inference is unavailable. A 9-parameter weighted composite score is computed using research-cited weights from NACE, AAC&amp;U, and other peer-reviewed sources.</p>
          <p>The third module, Bridge, establishes a trust layer between candidates and employers through adaptive skill verification testing with multi-layered anti-cheat proctoring. The proctoring system combines browser integrity monitoring with a three-layer audio intelligence system performing spectral, temporal, and adaptive baseline analysis. Scorecards are cryptographically signed using HMAC-SHA256 with per-criteria secrets generated server-side. The platform additionally incorporates a wellbeing scoring engine that computes 8 research-cited parameters across 32 Indian cities. Built with React 19, TypeScript 5.8, and Firebase, the system includes 516 automated tests and ensures all AI inference runs in-browser, guaranteeing that no resume data leaves the user&rsquo;s device.</p>
          <p className="no-indent" style={{ marginTop: '16pt' }}><strong>Keywords:</strong> Conversational AI, Resume Builder, Agentic Pipeline, In-Browser Machine Learning, Anti-Cheat Proctoring, Cryptographic Scorecard, Wellbeing Scoring, Offline-First, Progressive Web Application, Slot-Filling Dialogue System</p>
        </div>

        {/* ===== TABLE OF CONTENTS ===== */}
        <div className="report-page">
          <h2 className="chapter-title">Table of Contents</h2>
          <div className="toc-entry chapter"><span>Declaration</span><span className="toc-dots"></span><span>i</span></div>
          <div className="toc-entry chapter"><span>Certificate</span><span className="toc-dots"></span><span>ii</span></div>
          <div className="toc-entry chapter"><span>Certificate from Head of School</span><span className="toc-dots"></span><span>iii</span></div>
          <div className="toc-entry chapter"><span>Acknowledgements</span><span className="toc-dots"></span><span>iv</span></div>
          <div className="toc-entry chapter"><span>Abstract</span><span className="toc-dots"></span><span>v</span></div>
          <div className="toc-entry chapter"><span>List of Figures</span><span className="toc-dots"></span><span>viii</span></div>
          <div className="toc-entry chapter"><span>List of Tables</span><span className="toc-dots"></span><span>ix</span></div>
          <div className="toc-entry chapter"><span>List of Abbreviations</span><span className="toc-dots"></span><span>x</span></div>

          <div className="toc-entry chapter"><span>Chapter 1: Introduction</span><span className="toc-dots"></span><span>1</span></div>
          <div className="toc-entry section"><span>1.1 Background and Motivation</span><span className="toc-dots"></span><span>1</span></div>
          <div className="toc-entry section"><span>1.2 Problem Statement</span><span className="toc-dots"></span><span>3</span></div>
          <div className="toc-entry section"><span>1.3 Objectives</span><span className="toc-dots"></span><span>4</span></div>
          <div className="toc-entry section"><span>1.4 Scope and Limitations</span><span className="toc-dots"></span><span>5</span></div>
          <div className="toc-entry section"><span>1.5 Organization of Report</span><span className="toc-dots"></span><span>6</span></div>

          <div className="toc-entry chapter"><span>Chapter 2: Literature Review</span><span className="toc-dots"></span><span>7</span></div>
          <div className="toc-entry section"><span>2.1 Existing Resume Building Platforms</span><span className="toc-dots"></span><span>7</span></div>
          <div className="toc-entry section"><span>2.2 ATS Screening and NLP in Recruitment</span><span className="toc-dots"></span><span>9</span></div>
          <div className="toc-entry section"><span>2.3 In-Browser Machine Learning</span><span className="toc-dots"></span><span>10</span></div>
          <div className="toc-entry section"><span>2.4 Conversational AI and Slot-Filling Systems</span><span className="toc-dots"></span><span>12</span></div>
          <div className="toc-entry section"><span>2.5 Online Proctoring and Anti-Cheat Systems</span><span className="toc-dots"></span><span>13</span></div>
          <div className="toc-entry section"><span>2.6 Wellbeing Metrics in Employment</span><span className="toc-dots"></span><span>14</span></div>
          <div className="toc-entry section"><span>2.7 Cryptographic Integrity in Digital Assessments</span><span className="toc-dots"></span><span>15</span></div>
          <div className="toc-entry section"><span>2.8 Research Gap Analysis</span><span className="toc-dots"></span><span>16</span></div>

          <div className="toc-entry chapter"><span>Chapter 3: System Analysis and Design</span><span className="toc-dots"></span><span>18</span></div>
          <div className="toc-entry section"><span>3.1 Requirement Analysis</span><span className="toc-dots"></span><span>18</span></div>
          <div className="toc-entry section"><span>3.2 System Architecture Overview</span><span className="toc-dots"></span><span>20</span></div>
          <div className="toc-entry section"><span>3.3 Saathi Conversational Engine Design</span><span className="toc-dots"></span><span>21</span></div>
          <div className="toc-entry section"><span>3.4 AI Pipeline Design</span><span className="toc-dots"></span><span>23</span></div>
          <div className="toc-entry section"><span>3.5 Bridge Trust Layer Design</span><span className="toc-dots"></span><span>25</span></div>
          <div className="toc-entry section"><span>3.6 Wellbeing Scoring Engine Design</span><span className="toc-dots"></span><span>26</span></div>
          <div className="toc-entry section"><span>3.7 Security Architecture</span><span className="toc-dots"></span><span>27</span></div>
          <div className="toc-entry section"><span>3.8 Data Flow Diagrams</span><span className="toc-dots"></span><span>28</span></div>
          <div className="toc-entry section"><span>3.9 Database Schema</span><span className="toc-dots"></span><span>29</span></div>

          <div className="toc-entry chapter"><span>Chapter 4: Tools and Technologies</span><span className="toc-dots"></span><span>31</span></div>
          <div className="toc-entry section"><span>4.1 Frontend Stack</span><span className="toc-dots"></span><span>31</span></div>
          <div className="toc-entry section"><span>4.2 State Management</span><span className="toc-dots"></span><span>32</span></div>
          <div className="toc-entry section"><span>4.3 AI/ML Models</span><span className="toc-dots"></span><span>33</span></div>
          <div className="toc-entry section"><span>4.4 Backend Services</span><span className="toc-dots"></span><span>34</span></div>
          <div className="toc-entry section"><span>4.5 Deployment Infrastructure</span><span className="toc-dots"></span><span>35</span></div>
          <div className="toc-entry section"><span>4.6 Testing Framework</span><span className="toc-dots"></span><span>36</span></div>
          <div className="toc-entry section"><span>4.7 Development Tools</span><span className="toc-dots"></span><span>36</span></div>

          <div className="toc-entry chapter"><span>Chapter 5: Implementation</span><span className="toc-dots"></span><span>37</span></div>
          <div className="toc-entry section"><span>5.1 Saathi Conversational Resume Builder</span><span className="toc-dots"></span><span>37</span></div>
          <div className="toc-entry section"><span>5.2 Resume Builder (Form Mode)</span><span className="toc-dots"></span><span>42</span></div>
          <div className="toc-entry section"><span>5.3 Employer Screening Pipeline</span><span className="toc-dots"></span><span>44</span></div>
          <div className="toc-entry section"><span>5.4 Bridge Trust Layer</span><span className="toc-dots"></span><span>48</span></div>
          <div className="toc-entry section"><span>5.5 Wellbeing Scoring Engine</span><span className="toc-dots"></span><span>52</span></div>
          <div className="toc-entry section"><span>5.6 Security Implementation</span><span className="toc-dots"></span><span>54</span></div>
          <div className="toc-entry section"><span>5.7 Accessibility Implementation</span><span className="toc-dots"></span><span>56</span></div>
          <div className="toc-entry section"><span>5.8 PWA and Offline-First Architecture</span><span className="toc-dots"></span><span>57</span></div>

          <div className="toc-entry chapter"><span>Chapter 6: Testing and Results</span><span className="toc-dots"></span><span>58</span></div>
          <div className="toc-entry section"><span>6.1 Testing Strategy</span><span className="toc-dots"></span><span>58</span></div>
          <div className="toc-entry section"><span>6.2 Unit Testing</span><span className="toc-dots"></span><span>59</span></div>
          <div className="toc-entry section"><span>6.3 AI Pipeline Testing</span><span className="toc-dots"></span><span>62</span></div>
          <div className="toc-entry section"><span>6.4 Anti-Cheat Testing</span><span className="toc-dots"></span><span>63</span></div>
          <div className="toc-entry section"><span>6.5 Security Testing</span><span className="toc-dots"></span><span>64</span></div>
          <div className="toc-entry section"><span>6.6 Accessibility Testing</span><span className="toc-dots"></span><span>65</span></div>
          <div className="toc-entry section"><span>6.7 Performance</span><span className="toc-dots"></span><span>65</span></div>
          <div className="toc-entry section"><span>6.8 Test Results Summary</span><span className="toc-dots"></span><span>66</span></div>

          <div className="toc-entry chapter"><span>Chapter 7: Challenges and Solutions</span><span className="toc-dots"></span><span>68</span></div>

          <div className="toc-entry chapter"><span>Chapter 8: Conclusion and Future Scope</span><span className="toc-dots"></span><span>71</span></div>
          <div className="toc-entry section"><span>8.1 Summary of Contributions</span><span className="toc-dots"></span><span>71</span></div>
          <div className="toc-entry section"><span>8.2 Key Achievements</span><span className="toc-dots"></span><span>72</span></div>
          <div className="toc-entry section"><span>8.3 Limitations</span><span className="toc-dots"></span><span>73</span></div>
          <div className="toc-entry section"><span>8.4 Future Work</span><span className="toc-dots"></span><span>73</span></div>

          <div className="toc-entry chapter"><span>References</span><span className="toc-dots"></span><span>75</span></div>
          <div className="toc-entry chapter"><span>Appendix A: Project Diary</span><span className="toc-dots"></span><span>79</span></div>
          <div className="toc-entry chapter"><span>Appendix B: Scoring Formulas and Research Citations</span><span className="toc-dots"></span><span>82</span></div>
          <div className="toc-entry chapter"><span>Appendix C: Skills Taxonomy Summary</span><span className="toc-dots"></span><span>84</span></div>
        </div>

        {/* ===== LIST OF FIGURES ===== */}
        <div className="report-page">
          <h2 className="chapter-title">List of Figures</h2>
          <div className="toc-entry"><span>Figure 1.1: ResumeAI Platform Overview</span><span className="toc-dots"></span><span>2</span></div>
          <div className="toc-entry"><span>Figure 3.1: System Architecture Diagram</span><span className="toc-dots"></span><span>20</span></div>
          <div className="toc-entry"><span>Figure 3.2: Saathi Conversation Flow (7 Phases)</span><span className="toc-dots"></span><span>22</span></div>
          <div className="toc-entry"><span>Figure 3.3: AI Pipeline DAG Structure</span><span className="toc-dots"></span><span>24</span></div>
          <div className="toc-entry"><span>Figure 3.4: Bridge Trust Layer Flow</span><span className="toc-dots"></span><span>25</span></div>
          <div className="toc-entry"><span>Figure 3.5: Candidate Data Flow Diagram</span><span className="toc-dots"></span><span>28</span></div>
          <div className="toc-entry"><span>Figure 3.6: Employer Data Flow Diagram</span><span className="toc-dots"></span><span>29</span></div>
          <div className="toc-entry"><span>Figure 3.7: Firestore Collection Schema</span><span className="toc-dots"></span><span>30</span></div>
          <div className="toc-entry"><span>Figure 5.1: Saathi Chat Interface</span><span className="toc-dots"></span><span>38</span></div>
          <div className="toc-entry"><span>Figure 5.2: Resume Template Samples</span><span className="toc-dots"></span><span>43</span></div>
          <div className="toc-entry"><span>Figure 5.3: Employer Screening Dashboard</span><span className="toc-dots"></span><span>45</span></div>
          <div className="toc-entry"><span>Figure 5.4: Anti-Cheat Audio Analysis Pipeline</span><span className="toc-dots"></span><span>50</span></div>
          <div className="toc-entry"><span>Figure 5.5: Device Fingerprinting Process</span><span className="toc-dots"></span><span>54</span></div>
          <div className="toc-entry"><span>Figure 5.6: Wellbeing Score Dashboard</span><span className="toc-dots"></span><span>53</span></div>
          <div className="toc-entry"><span>Figure 6.1: Test Results Summary</span><span className="toc-dots"></span><span>66</span></div>
        </div>

        {/* ===== LIST OF TABLES ===== */}
        <div className="report-page">
          <h2 className="chapter-title">List of Tables</h2>
          <div className="toc-entry"><span>Table 2.1: Research Gap Analysis</span><span className="toc-dots"></span><span>16</span></div>
          <div className="toc-entry"><span>Table 3.1: Functional Requirements</span><span className="toc-dots"></span><span>18</span></div>
          <div className="toc-entry"><span>Table 3.2: Non-Functional Requirements</span><span className="toc-dots"></span><span>19</span></div>
          <div className="toc-entry"><span>Table 3.3: Firestore Collections</span><span className="toc-dots"></span><span>30</span></div>
          <div className="toc-entry"><span>Table 4.1: Tools and Technologies</span><span className="toc-dots"></span><span>31</span></div>
          <div className="toc-entry"><span>Table 5.1: Candidate Scoring Parameters</span><span className="toc-dots"></span><span>47</span></div>
          <div className="toc-entry"><span>Table 5.2: Anti-Cheat Penalties</span><span className="toc-dots"></span><span>51</span></div>
          <div className="toc-entry"><span>Table 5.3: Wellbeing Scoring Parameters</span><span className="toc-dots"></span><span>52</span></div>
          <div className="toc-entry"><span>Table 6.1: Test Results by Module</span><span className="toc-dots"></span><span>66</span></div>
          <div className="toc-entry"><span>Table B.1: Candidate Scoring Formulas</span><span className="toc-dots"></span><span>82</span></div>
          <div className="toc-entry"><span>Table B.2: Wellbeing Scoring Formulas</span><span className="toc-dots"></span><span>83</span></div>
          <div className="toc-entry"><span>Table C.1: Skills Taxonomy by Category</span><span className="toc-dots"></span><span>84</span></div>
        </div>

        {/* ===== LIST OF ABBREVIATIONS ===== */}
        <div className="report-page">
          <h2 className="chapter-title">List of Abbreviations</h2>
          <table className="abbr-table" style={{ border: 'none' }}>
            <tbody>
              {[
                ['AI', 'Artificial Intelligence'],
                ['API', 'Application Programming Interface'],
                ['AQI', 'Air Quality Index'],
                ['ARIA', 'Accessible Rich Internet Applications'],
                ['ATS', 'Applicant Tracking System'],
                ['BCP-47', 'Best Current Practice 47 (Language Tag Standard)'],
                ['CoL', 'Cost of Living'],
                ['CSE', 'Computer Science and Engineering'],
                ['CSP', 'Content Security Policy'],
                ['CSS', 'Cascading Style Sheets'],
                ['DAG', 'Directed Acyclic Graph'],
                ['FFT', 'Fast Fourier Transform'],
                ['HMAC', 'Hash-based Message Authentication Code'],
                ['HSTS', 'HTTP Strict Transport Security'],
                ['HTML', 'HyperText Markup Language'],
                ['INR', 'Indian Rupee'],
                ['JD', 'Job Description'],
                ['JSX', 'JavaScript XML'],
                ['LLM', 'Large Language Model'],
                ['ML', 'Machine Learning'],
                ['NER', 'Named Entity Recognition'],
                ['NLP', 'Natural Language Processing'],
                ['ONNX', 'Open Neural Network Exchange'],
                ['PM2.5', 'Particulate Matter (diameter ≤ 2.5 micrometres)'],
                ['PWA', 'Progressive Web Application'],
                ['QR', 'Quick Response (Code)'],
                ['REST', 'Representational State Transfer'],
                ['RMS', 'Root Mean Square'],
                ['SHA-256', 'Secure Hash Algorithm (256-bit)'],
                ['TF-IDF', 'Term Frequency-Inverse Document Frequency'],
                ['TSX', 'TypeScript XML'],
                ['UUID', 'Universally Unique Identifier'],
                ['WASM', 'WebAssembly'],
                ['WBGT', 'Wet Bulb Globe Temperature'],
                ['WCAG', 'Web Content Accessibility Guidelines'],
                ['WebGPU', 'Web Graphics Processing Unit API'],
              ].map(([abbr, full]) => (
                <tr key={abbr} style={{ borderBottom: 'none' }}>
                  <td style={{ border: 'none', padding: '3pt 12pt 3pt 0' }}>{abbr}</td>
                  <td style={{ border: 'none', padding: '3pt 0' }}>{full}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ===== CHAPTER CONTENT (Chapters 1-8 + References + Appendices) ===== */}
        <div dangerouslySetInnerHTML={{ __html: chapterContent }} />

      </div>
    </>
  );
}
