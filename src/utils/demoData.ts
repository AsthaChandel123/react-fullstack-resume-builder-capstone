import { useResumeStore, uuid } from '@/store/resumeStore';

export function fillDemoResume(): void {
  const store = useResumeStore.getState();

  // Reset to clear existing data and get fresh section IDs
  store.reset();

  // Small delay so reset state propagates before we fill
  const fresh = useResumeStore.getState();

  // Personal info
  store.setPersonal({
    name: 'Astha Chandel',
    email: 'astha@dmj.one',
    phone: '+91 8219960208',
    location: 'Solan, Himachal Pradesh',
    linkedin: 'https://linkedin.com/in/asthachandel',
    github: 'https://github.com/asthachandel',
  });

  // Summary
  store.setSummary(
    'BTech CSE (Cybersecurity) student at Shoolini University with hands-on experience shipping production-grade web applications and AI tooling. Built an offline-first, in-browser AI resume platform serving real candidates and employers across India, with measured ATS scoring and HMAC-signed skill verification. Passionate about secure, accessible, performant web experiences backed by clean architecture and rigorous testing.',
  );

  // Find sections by type
  const sectionByType = (type: string) =>
    fresh.resume.sections.find((s) => s.type === type);

  const eduSection = sectionByType('education');
  const expSection = sectionByType('experience');
  const projSection = sectionByType('projects');
  const skillsSection = sectionByType('skills');
  const certSection = sectionByType('certifications');
  const extraSection = sectionByType('extracurricular');

  // Education
  if (eduSection) {
    store.addEntry(eduSection.id, {
      id: uuid(),
      fields: {
        institution: 'Shoolini University',
        degree: 'B.Tech in Computer Science and Engineering (Cybersecurity)',
        duration: '2022 - 2026',
        gpa: '8.6 / 10.0',
        coursework:
          'Network Security, Cryptography, Web Security, Operating Systems, Data Structures, Machine Learning, Software Engineering',
      },
      bullets: [
        'Yogananda School of AI, Computers and Data Sciences, Solan, Himachal Pradesh',
      ],
    });
  }

  // Experience
  if (expSection) {
    store.addEntry(expSection.id, {
      id: uuid(),
      fields: {
        role: 'Capstone Researcher',
        company: 'Yogananda School of AI, Computers and Data Sciences',
        duration: 'Aug 2025 - May 2026',
        location: 'Shoolini University, Solan',
      },
      bullets: [
        'Designed and shipped an offline-first, in-browser AI resume platform with measured ATS scoring and HMAC-signed skill verification, serving real candidate and employer flows end-to-end',
        'Built a four-layer AI pipeline running entirely client-side: regex + TF-IDF, ONNX E5 embeddings, on-device Gemma 4 reasoning, and Gemini cloud fallback, with progressive enhancement based on device capabilities',
        'Wrote 536 unit and integration tests covering scoring, conversation flow, and persistence; engineered a single Cloud Run service consolidating nine endpoints behind one Firebase ID token surface',
      ],
    });
  }

  // Projects
  if (projSection) {
    store.addEntry(projSection.id, {
      id: uuid(),
      fields: {
        name: 'ResumeAI Bridge',
        tech: 'React 19, TypeScript, Firebase, Cloud Run, ONNX, Transformers.js',
        description:
          'Verified-skill bridge between candidates and employers with adaptive in-browser testing, HMAC-signed scorecards, and anti-gaming session controls',
        url: 'https://astha-capstone.dmj.one',
      },
      bullets: [
        'Implemented adaptive difficulty scoring across five skill levels with sustained-performance bonus, integrity flags, and per-skill calibration based on the candidate first-test baseline',
        'Achieved WCAG 2.2 AA compliance with full keyboard navigation, ARIA live regions for real-time updates, and zero data leaving the device for resume building and scoring',
      ],
    });
  }

  // Skills (category-based with bullets as tags)
  if (skillsSection) {
    store.addEntry(skillsSection.id, {
      id: uuid(),
      fields: { category: 'Languages & Frameworks' },
      bullets: [
        'React.js',
        'TypeScript',
        'JavaScript',
        'Next.js',
        'Node.js',
        'Tailwind CSS',
      ],
    });
    store.addEntry(skillsSection.id, {
      id: uuid(),
      fields: { category: 'State & Tools' },
      bullets: [
        'Zustand',
        'Redux',
        'REST APIs',
        'Git',
        'GitHub Actions',
        'Docker',
      ],
    });
  }

  // Certifications
  if (certSection) {
    store.addEntry(certSection.id, {
      id: uuid(),
      fields: {
        name: 'Meta Frontend Developer Professional Certificate',
        issuer: 'Coursera (Meta)',
        date: 'Jan 2023',
        url: '',
      },
      bullets: [],
    });
  }

  // Extracurricular
  if (extraSection) {
    store.addEntry(extraSection.id, {
      id: uuid(),
      fields: {
        role: 'Coordinator',
        org: 'CSE Department Tech Club, Shoolini University',
        duration: '2023 - 2025',
        description: '',
      },
      bullets: [
        'Organized hands-on workshops on web security, cloud deployment, and open source contribution for fellow undergraduates across campus',
      ],
    });
  }
}
