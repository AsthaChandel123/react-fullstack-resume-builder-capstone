// One-shot seed script for sample hiring criteria.
//
// Usage:
//   cd firebase/functions
//   node scripts/seed-criteria.cjs
//
// Requirements:
//   - Application Default Credentials configured locally
//     (`gcloud auth application-default login` or `firebase login`)
//   - The Firestore project is set in firebase/.firebaserc (default: dmjone)
//
// The script is idempotent — running it again replaces the seeded docs
// without duplicating them, because every doc uses a deterministic short
// code. A `seedTag: "demo-v1"` field is written so demo data can be
// distinguished from real employer-published criteria if you ever want
// to clean it up with a one-line script.

const admin = require('firebase-admin');
const crypto = require('crypto');

admin.initializeApp({
  projectId: 'dmjone',
});

const db = admin.firestore();

const DEMO_EMPLOYER_ID = 'demo-employer-resumeai';
const DEMO_EMPLOYER_EMAIL = 'recruiter@dmj.one';
const SEED_TAG = 'demo-v1';
const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;

const CRITERIA = [
  {
    shortCode: 'FE2026',
    jobTitle: 'Frontend Engineer (React, TypeScript)',
    description:
      'Build accessible, performant interfaces for our consumer product. You will own the resume builder surface and ship features end-to-end. Comfortable with React, TypeScript, state management, and a strong sense for UX and accessibility. Cross-functional collaboration with design and backend.',
    requiredSkills: ['React', 'TypeScript', 'JavaScript', 'CSS', 'Accessibility'],
    preferredSkills: ['Tailwind CSS', 'Vite', 'Vitest', 'Web Performance', 'WCAG'],
    weights: { skills: 35, experience: 20, education: 15, projects: 15, certifications: 5, distance: 0, extracurricular: 5, gpa: 3, completeness: 2 },
    threshold: 75,
    testConfig: { skillsToTest: ['React', 'TypeScript', 'CSS', 'Accessibility', 'JavaScript'], difficultyFloor: 2, questionCount: 5 },
  },
  {
    shortCode: 'BE2026',
    jobTitle: 'Backend Engineer (Node, Postgres)',
    description:
      'Design and ship server-side systems that power our hiring platform. You will work with Node.js, Firestore, and Postgres, and own API design end-to-end. Strong fundamentals in data modelling, observability, and incident response. Comfortable with Docker and CI/CD.',
    requiredSkills: ['Node.js', 'TypeScript', 'PostgreSQL', 'REST APIs', 'Docker'],
    preferredSkills: ['Firebase', 'GraphQL', 'gRPC', 'Kubernetes', 'OpenTelemetry'],
    weights: { skills: 35, experience: 25, education: 15, projects: 10, certifications: 3, distance: 0, extracurricular: 5, gpa: 3, completeness: 4 },
    threshold: 72,
    testConfig: { skillsToTest: ['Node.js', 'TypeScript', 'PostgreSQL', 'REST APIs', 'Docker'], difficultyFloor: 2, questionCount: 5 },
  },
  {
    shortCode: 'DA2026',
    jobTitle: 'Data Analyst Intern',
    description:
      'Help our team uncover what is actually working. You will write SQL against our warehouse, build dashboards, and run experiments. Comfortable in Python or R, strong intuition for statistics, and willing to push back on stakeholders when a metric is wrong. Intern conversion to full-time available.',
    requiredSkills: ['SQL', 'Python', 'Statistics', 'Data Visualization', 'Excel'],
    preferredSkills: ['Pandas', 'BigQuery', 'Looker', 'A/B Testing', 'Tableau'],
    weights: { skills: 30, experience: 15, education: 20, projects: 15, certifications: 3, distance: 0, extracurricular: 5, gpa: 7, completeness: 5 },
    threshold: 70,
    testConfig: { skillsToTest: ['SQL', 'Python', 'Statistics', 'Pandas', 'Data Visualization'], difficultyFloor: 1, questionCount: 5 },
  },
  {
    shortCode: 'CY2026',
    jobTitle: 'Cybersecurity Analyst (Entry-Level)',
    description:
      'Join our security team and learn while doing. You will triage alerts, run penetration tests against internal applications, and contribute to our incident response playbook. Comfortable with network protocols, scripting, and explaining technical risk to non-technical stakeholders. Great fit for a BTech (Cybersecurity) graduate.',
    requiredSkills: ['Network Security', 'Penetration Testing', 'Linux', 'Python', 'OWASP Top 10'],
    preferredSkills: ['Burp Suite', 'Wireshark', 'Splunk', 'Cryptography', 'SOC Operations'],
    weights: { skills: 30, experience: 15, education: 20, projects: 15, certifications: 10, distance: 0, extracurricular: 3, gpa: 4, completeness: 3 },
    threshold: 72,
    testConfig: { skillsToTest: ['Network Security', 'Penetration Testing', 'Linux', 'OWASP Top 10', 'Python'], difficultyFloor: 1, questionCount: 5 },
  },
  {
    shortCode: 'ML2026',
    jobTitle: 'Applied ML Engineer (LLM Infrastructure)',
    description:
      'Ship LLM-powered features end-to-end in a fast-moving team. You will work with embeddings, retrieval, fine-tuning, and on-device inference (ONNX, Transformers.js). Comfortable with Python and TypeScript, sharp intuition for model latency and cost, and willing to own production reliability.',
    requiredSkills: ['Python', 'PyTorch', 'TypeScript', 'LLMs', 'ONNX'],
    preferredSkills: ['Transformers.js', 'Embeddings', 'RAG', 'WebGPU', 'Vector Databases'],
    weights: { skills: 35, experience: 20, education: 15, projects: 20, certifications: 0, distance: 0, extracurricular: 3, gpa: 4, completeness: 3 },
    threshold: 78,
    testConfig: { skillsToTest: ['Python', 'PyTorch', 'LLMs', 'ONNX', 'TypeScript'], difficultyFloor: 2, questionCount: 5 },
  },
  {
    shortCode: 'MB2026',
    jobTitle: 'Mobile Engineer (React Native / iOS)',
    description:
      'Own the resume builder native experience on iOS and Android. You will work with React Native, native modules, and platform-specific tuning to keep the app smooth even on entry-level devices. Comfortable with Swift / Kotlin for native bridges and a strong feel for mobile UX.',
    requiredSkills: ['React Native', 'TypeScript', 'iOS', 'Android', 'JavaScript'],
    preferredSkills: ['Swift', 'Kotlin', 'Reanimated', 'Detox', 'CI/CD'],
    weights: { skills: 35, experience: 20, education: 12, projects: 18, certifications: 5, distance: 0, extracurricular: 4, gpa: 3, completeness: 3 },
    threshold: 73,
    testConfig: { skillsToTest: ['React Native', 'TypeScript', 'iOS', 'JavaScript', 'Android'], difficultyFloor: 2, questionCount: 5 },
  },
  {
    shortCode: 'DV2026',
    jobTitle: 'DevOps / SRE Engineer',
    description:
      'Run the platform like it matters. You will own CI/CD pipelines, observability, on-call rotation, and incident response across our Cloud Run and Cloudflare edge. Comfortable with Terraform, Kubernetes, and a healthy paranoia about secrets and supply chain.',
    requiredSkills: ['Kubernetes', 'Terraform', 'Linux', 'Docker', 'CI/CD'],
    preferredSkills: ['Prometheus', 'Grafana', 'OpenTelemetry', 'Cloudflare', 'PagerDuty'],
    weights: { skills: 35, experience: 30, education: 10, projects: 10, certifications: 5, distance: 0, extracurricular: 3, gpa: 2, completeness: 5 },
    threshold: 76,
    testConfig: { skillsToTest: ['Kubernetes', 'Terraform', 'Linux', 'Docker', 'CI/CD'], difficultyFloor: 3, questionCount: 5 },
  },
  {
    shortCode: 'PD2026',
    jobTitle: 'Product Designer (Web)',
    description:
      'Co-design our hiring platform with engineering. You will research, prototype in Figma, run usability tests, and ship polished interfaces. Strong portfolio across web SaaS, deep care for accessibility and Indian-context UX, and willingness to mock things in real code.',
    requiredSkills: ['Figma', 'User Research', 'Accessibility', 'Prototyping', 'Design Systems'],
    preferredSkills: ['HTML/CSS', 'Framer', 'Lottie', 'Motion Design', 'Vernacular UX'],
    weights: { skills: 30, experience: 20, education: 10, projects: 25, certifications: 0, distance: 0, extracurricular: 5, gpa: 2, completeness: 8 },
    threshold: 72,
    testConfig: { skillsToTest: ['Figma', 'User Research', 'Accessibility', 'Prototyping', 'Design Systems'], difficultyFloor: 2, questionCount: 5 },
  },
  {
    shortCode: 'QA2026',
    jobTitle: 'QA / Test Engineer',
    description:
      'Keep ResumeAI honest. You will write Playwright + Vitest suites, design fault-injection scenarios, and partner with engineers to ship resilient features. Strong eye for edge cases, comfortable with automation infrastructure and reporting test signal back into product decisions.',
    requiredSkills: ['Playwright', 'Vitest', 'TypeScript', 'Test Automation', 'Linux'],
    preferredSkills: ['Cypress', 'Selenium', 'k6', 'GitHub Actions', 'Performance Testing'],
    weights: { skills: 35, experience: 20, education: 15, projects: 10, certifications: 5, distance: 0, extracurricular: 5, gpa: 3, completeness: 7 },
    threshold: 70,
    testConfig: { skillsToTest: ['Playwright', 'Vitest', 'TypeScript', 'Test Automation', 'Linux'], difficultyFloor: 2, questionCount: 5 },
  },
  {
    shortCode: 'FS2026',
    jobTitle: 'Full-Stack Intern (TypeScript + Firebase)',
    description:
      'Six-month internship building real features on the ResumeAI platform. You will work across React, TypeScript, Firebase, and our consolidated Cloud Run API. Pair with senior engineers, ship code to production, and convert to full-time on success. Great fit for final-year BTech students.',
    requiredSkills: ['TypeScript', 'React', 'Node.js', 'Firebase', 'Git'],
    preferredSkills: ['Vite', 'Tailwind CSS', 'Firestore Rules', 'Cloud Run', 'Vitest'],
    weights: { skills: 30, experience: 10, education: 25, projects: 20, certifications: 0, distance: 0, extracurricular: 5, gpa: 5, completeness: 5 },
    threshold: 68,
    testConfig: { skillsToTest: ['TypeScript', 'React', 'Node.js', 'Firebase', 'Git'], difficultyFloor: 1, questionCount: 5 },
  },
];

async function seed() {
  const now = admin.firestore.FieldValue.serverTimestamp();
  const expiresAt = new Date(Date.now() + NINETY_DAYS_MS);

  let written = 0;
  for (const c of CRITERIA) {
    // Stable per-criteria signing secret derived from the seed tag so reruns
    // do not invalidate previously-signed scorecards demo data.
    const signingSecret = crypto
      .createHmac('sha256', SEED_TAG)
      .update(c.shortCode)
      .digest('hex');

    const doc = {
      shortCode: c.shortCode,
      jobTitle: c.jobTitle,
      description: c.description,
      requiredSkills: c.requiredSkills,
      preferredSkills: c.preferredSkills,
      customSignals: [],
      weights: c.weights,
      threshold: c.threshold,
      testConfig: c.testConfig,
      signingSecret,
      employerId: DEMO_EMPLOYER_ID,
      employerEmail: DEMO_EMPLOYER_EMAIL,
      status: 'active',
      seedTag: SEED_TAG,
      createdAt: now,
      expiresAt,
    };

    await db.collection('criteria').doc(c.shortCode).set(doc, { merge: false });
    written++;
    process.stdout.write(`+ criteria/${c.shortCode}  ${c.jobTitle}\n`);
  }

  console.log(`\nDone. Seeded ${written} criteria into Firestore (project: dmjone).`);
  console.log(`Each is publicly readable at /bridge/<shortCode> on the live site.`);
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  });
