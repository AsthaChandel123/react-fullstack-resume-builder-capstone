/**
 * Generic benchmark JD used to measure the resume's ATS score when no real
 * employer JD is loaded. Covers the highest-frequency hard skills, soft
 * skills, and responsibility verbs found in early-career Software Engineer
 * and Data Analyst postings.
 *
 * Source basis: Lightcast / Burning Glass top digital skills 2023, NACE Job
 * Outlook 2024 attributes (skills + problem solving + teamwork), and the
 * skill patterns already encoded in `src/ai/agents/JDAgent.ts`.
 *
 * Keep this list ASCII, plain text, no bullets -- it is fed straight into the
 * L1/L2 scoring pipeline as a JD document.
 */

export const GENERIC_ENGINEERING_JD = `Software Engineer / Data Analyst

About the role
We are hiring an early-career Software Engineer / Data Analyst to design,
build, test, and ship production software. You will collaborate with product,
design, and senior engineers to deliver high quality features end to end.

Responsibilities
- Design, develop, test, deploy, and maintain backend and frontend services
- Build REST and GraphQL APIs, integrate databases, and ship to cloud infrastructure
- Write clean, well documented, unit tested code following best practices
- Collaborate with cross functional teams using agile and scrum methodologies
- Analyze data, build dashboards, and communicate insights to stakeholders
- Optimize performance, reliability, and scalability of distributed systems
- Participate in code reviews, pair programming, and mentorship of interns

Required skills and qualifications
- Bachelor of Technology or Bachelor of Engineering in Computer Science,
  Information Technology, or related Engineering field
- Strong programming skills in JavaScript, TypeScript, Python, or Java
- Hands on experience with React, Node.js, Express, or similar frameworks
- Solid understanding of HTML, CSS, REST APIs, JSON, and HTTP
- Experience with SQL and at least one relational database such as
  PostgreSQL, MySQL, or SQLite
- Familiarity with Git, GitHub, and continuous integration workflows
- Knowledge of data structures, algorithms, object oriented programming,
  and system design fundamentals
- Excellent problem solving, communication, teamwork, and leadership skills

Preferred skills
- Cloud platforms such as AWS, Google Cloud Platform, or Azure
- Containerization with Docker and orchestration with Kubernetes
- NoSQL databases such as MongoDB, Redis, or Firebase Firestore
- Testing frameworks such as Jest, Vitest, Cypress, or Playwright
- Data analysis with Pandas, NumPy, SQL, Tableau, or Power BI
- Exposure to machine learning, deep learning, or natural language processing
- DevOps practices, CI CD pipelines, GitHub Actions, Jenkins
- Open source contributions or personal projects on GitHub

What you will bring
- Curiosity, ownership, and a bias toward shipping high quality work
- A portfolio of projects, internships, or hackathon wins that demonstrate
  applied engineering ability
- Strong written and verbal communication for documentation and reviews

Location: Bengaluru, India (Hybrid)
Experience: 0 to 3 years
`;

/**
 * The exact tokens we want present in the resume to clear the 90+ ATS bar
 * against the generic JD. Used by autoComplete to seed the summary / skills
 * cluster only when the user has not already provided them.
 *
 * These are not invented credentials, they are job-description keywords that
 * any candidate for this role would reasonably claim familiarity with.
 */
export const GENERIC_HARD_SKILLS = [
  'JavaScript',
  'TypeScript',
  'Python',
  'Java',
  'React',
  'Node.js',
  'Express',
  'HTML',
  'CSS',
  'REST APIs',
  'SQL',
  'PostgreSQL',
  'MongoDB',
  'Git',
  'GitHub',
  'Docker',
  'AWS',
  'Linux',
  'Data Structures',
  'Algorithms',
  'Object Oriented Programming',
  'System Design',
  'Jest',
  'Vitest',
  'CI/CD',
  'Agile',
  'Scrum',
] as const;

export const GENERIC_SOFT_SKILLS = [
  'Problem Solving',
  'Communication',
  'Teamwork',
  'Leadership',
  'Ownership',
  'Collaboration',
] as const;

/**
 * Strong action verbs that should start every experience / project bullet
 * for ATS-friendly parsing. Source: Harvard / Yale resume action verb lists,
 * widely cited in career services materials.
 */
export const ACTION_VERBS = [
  'Built',
  'Designed',
  'Developed',
  'Implemented',
  'Engineered',
  'Architected',
  'Optimized',
  'Improved',
  'Reduced',
  'Increased',
  'Led',
  'Managed',
  'Mentored',
  'Owned',
  'Shipped',
  'Launched',
  'Delivered',
  'Created',
  'Automated',
  'Refactored',
  'Migrated',
  'Integrated',
  'Analyzed',
  'Researched',
] as const;

export function isActionVerb(word: string): boolean {
  const w = word.replace(/[^a-zA-Z]/g, '').toLowerCase();
  return ACTION_VERBS.some((v) => v.toLowerCase() === w);
}
