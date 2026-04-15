import { useResumeStore, uuid } from '@/store/resumeStore';

export function fillDemoResume(): void {
  const store = useResumeStore.getState();

  // Reset to clear existing data and get fresh section IDs
  store.reset();

  // Small delay so reset state propagates before we fill
  const fresh = useResumeStore.getState();

  // Personal info
  store.setPersonal({
    name: 'Ananya Krishnamurthy',
    email: 'ananya.k@iitb.ac.in',
    phone: '+91 98765 43210',
    location: 'Mumbai, Maharashtra',
    linkedin: 'https://linkedin.com/in/ananyak',
    github: 'https://github.com/ananyak',
  });

  // Summary
  store.setSummary(
    'Frontend developer with 2+ years of production experience building high-traffic React and TypeScript applications at scale. Shipped features serving 12M+ monthly users at Flipkart, improving Core Web Vitals by 35%. Passionate about accessible, performant web experiences backed by clean architecture and rigorous testing.',
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
        institution: 'Indian Institute of Technology Bombay',
        degree: 'B.Tech in Computer Science and Engineering',
        duration: '2019 - 2023',
        gpa: '9.2 / 10.0',
        coursework:
          'Data Structures, Algorithms, Operating Systems, Computer Networks, Database Systems, Software Engineering',
      },
      bullets: [
        'Awarded Institute Academic Merit Scholarship for ranking in the top 5% of the department across all four years',
      ],
    });
  }

  // Experience
  if (expSection) {
    store.addEntry(expSection.id, {
      id: uuid(),
      fields: {
        role: 'Frontend Developer',
        company: 'Flipkart',
        duration: 'Jun 2023 - Present',
        location: 'Bangalore, Karnataka',
      },
      bullets: [
        'Rebuilt the product listing page with React 18 and TypeScript, reducing Largest Contentful Paint from 4.2s to 1.8s for 12M+ monthly users',
        'Designed and shipped a reusable component library of 40+ accessible UI components adopted by 3 product teams, cutting feature delivery time by 30%',
        'Implemented server-driven UI rendering pipeline that reduced client bundle size by 22% and improved Time to Interactive by 800ms on low-end devices',
      ],
    });
  }

  // Projects
  if (projSection) {
    store.addEntry(projSection.id, {
      id: uuid(),
      fields: {
        name: 'E-Commerce Dashboard',
        tech: 'React, TypeScript, Zustand, Tailwind CSS',
        description:
          'Real-time analytics dashboard for e-commerce sellers with live order tracking, revenue charts, and inventory alerts',
        url: 'https://github.com/ananyak/ecom-dashboard',
      },
      bullets: [
        'Built a responsive dashboard rendering 10,000+ data points with virtualized lists and memoized chart components, maintaining 60fps scroll on mobile devices',
        'Achieved 98% Lighthouse accessibility score with full keyboard navigation, ARIA live regions for real-time updates, and WCAG 2.2 AA compliance',
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
        role: 'Tech Lead',
        org: 'Google Developer Student Club, IIT Bombay',
        duration: '2021 - 2023',
        description: '',
      },
      bullets: [
        'Organized 12 hands-on workshops on web development and cloud computing, reaching 500+ students across campus',
      ],
    });
  }
}
