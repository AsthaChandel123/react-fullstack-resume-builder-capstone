// Seed dynamic demo match signals + employer replies into Firestore.
//
// Usage:
//   cd firebase/functions
//   node scripts/seed-demo-matches.cjs
//
// Idempotent: each match doc uses a deterministic id (`demo-...`) so reruns
// overwrite in place. Every doc carries `isDemo: true` so the public-read
// rule branch picks it up and any one-line cleanup query can find them.

const admin = require('firebase-admin');

admin.initializeApp({ projectId: 'dmjone' });
const db = admin.firestore();

const DEMO_EMPLOYER_ID = 'demo-employer-resumeai';
const DEMO_EMPLOYER_EMAIL = 'recruiter@dmj.one';
const SEED_TAG = 'demo-v1';

const hour = 60 * 60 * 1000;
const day = 24 * hour;
const isoAgo = (ms) => new Date(Date.now() - ms).toISOString();

const ASTHA_CONTACT = {
  name: 'Astha Chandel',
  email: 'astha@dmj.one',
  phone: '+91 8219960208',
  linkedin: 'https://linkedin.com/in/asthachandel',
  github: 'https://github.com/asthachandel',
};

// ── Candidate-perspective matches: Astha applying to 10 jobs ────────
const CANDIDATE_MATCHES = [
  { id: 'demo-c-fe', criteriaCode: 'FE2026', resumeScore: 93, verifiedScore: 88, integrityScore: 96, gap: -5, status: 'replied', ageMs: 2 * day, replyMessage: 'Loved your offline-first AI capstone. Free for a 30-minute chat this week?', replyAgeMs: 1 * day },
  { id: 'demo-c-cy', criteriaCode: 'CY2026', resumeScore: 89, verifiedScore: 82, integrityScore: 100, gap: -7, status: 'viewed',  ageMs: 5 * day },
  { id: 'demo-c-ml', criteriaCode: 'ML2026', resumeScore: 91, verifiedScore: 85, integrityScore: 94,  gap: -6, status: 'pending', ageMs: 12 * hour },
  { id: 'demo-c-fs', criteriaCode: 'FS2026', resumeScore: 90, verifiedScore: 87, integrityScore: 98,  gap: -3, status: 'replied', ageMs: 3 * day, replyMessage: 'Strong fit. Sending you a take-home challenge on Monday — please confirm your availability.', replyAgeMs: 2 * day + 6 * hour },
  { id: 'demo-c-be', criteriaCode: 'BE2026', resumeScore: 84, verifiedScore: 79, integrityScore: 92,  gap: -5, status: 'viewed',  ageMs: 6 * day },
  { id: 'demo-c-qa', criteriaCode: 'QA2026', resumeScore: 87, verifiedScore: 81, integrityScore: 95,  gap: -6, status: 'pending', ageMs: 18 * hour },
  { id: 'demo-c-da', criteriaCode: 'DA2026', resumeScore: 82, verifiedScore: 77, integrityScore: 90,  gap: -5, status: 'pending', ageMs: 4 * day },
  { id: 'demo-c-mb', criteriaCode: 'MB2026', resumeScore: 78, verifiedScore: 74, integrityScore: 89,  gap: -4, status: 'viewed',  ageMs: 8 * day },
  { id: 'demo-c-pd', criteriaCode: 'PD2026', resumeScore: 80, verifiedScore: 73, integrityScore: 88,  gap: -7, status: 'pending', ageMs: 10 * day },
  { id: 'demo-c-dv', criteriaCode: 'DV2026', resumeScore: 76, verifiedScore: 71, integrityScore: 86,  gap: -5, status: 'replied', ageMs: 14 * day, replyMessage: 'Thanks for applying. We are pausing this role for two weeks; please keep an eye on the listing for updates.', replyAgeMs: 12 * day },
];

// ── Employer-perspective matches: 10 candidates applying to dmjone ──
const EMP_CANDIDATES = [
  { id: 'c-rohan',  name: 'Rohan Verma',  email: 'rohan.verma@example.com',  phone: '+91 98101 11122', linkedin: 'https://linkedin.com/in/rohanverma-dev',   github: 'https://github.com/rohanverma' },
  { id: 'c-priya',  name: 'Priya Iyer',   email: 'priya.iyer@example.com',   phone: '+91 99876 54321', linkedin: 'https://linkedin.com/in/priya-iyer',       github: 'https://github.com/priya-iyer' },
  { id: 'c-arjun',  name: 'Arjun Singh',  email: 'arjun.singh@example.com',  phone: '+91 91234 56789', linkedin: 'https://linkedin.com/in/arjun-singh-dev',  github: 'https://github.com/arjun-singh' },
  { id: 'c-meera',  name: 'Meera Pillai', email: 'meera.pillai@example.com', phone: '+91 98765 12340', linkedin: 'https://linkedin.com/in/meera-pillai-sec', github: 'https://github.com/meera-pillai' },
  { id: 'c-vikram', name: 'Vikram Joshi', email: 'vikram.joshi@example.com', phone: '+91 88990 12345', linkedin: 'https://linkedin.com/in/vikram-joshi-data', github: 'https://github.com/vikram-joshi' },
  { id: 'c-aisha',  name: 'Aisha Khan',   email: 'aisha.khan@example.com',   phone: '+91 97300 87654', linkedin: 'https://linkedin.com/in/aisha-khan-ml',    github: 'https://github.com/aisha-khan' },
  { id: 'c-karan',  name: 'Karan Bedi',   email: 'karan.bedi@example.com',   phone: '+91 99441 22334', linkedin: 'https://linkedin.com/in/karan-bedi-rn',    github: 'https://github.com/karanbedi' },
  { id: 'c-divya',  name: 'Divya Menon',  email: 'divya.menon@example.com',  phone: '+91 90876 54321', linkedin: 'https://linkedin.com/in/divya-menon-qa',   github: 'https://github.com/divya-menon' },
  { id: 'c-ishaan', name: 'Ishaan Patel', email: 'ishaan.patel@example.com', phone: '+91 98123 45678', linkedin: 'https://linkedin.com/in/ishaan-patel-ui',  github: 'https://github.com/ishaan-patel' },
  { id: 'c-astha',  name: ASTHA_CONTACT.name, email: ASTHA_CONTACT.email,    phone: ASTHA_CONTACT.phone, linkedin: ASTHA_CONTACT.linkedin, github: ASTHA_CONTACT.github },
];

const EMPLOYER_MATCHES = [
  { id: 'demo-e-1',  candidate: EMP_CANDIDATES[0], criteriaCode: 'FE2026', resumeScore: 86, verifiedScore: 91, integrityScore: 98, gap:  5, status: 'pending', ageMs: 6 * hour },
  { id: 'demo-e-2',  candidate: EMP_CANDIDATES[1], criteriaCode: 'FE2026', resumeScore: 78, verifiedScore: 89, integrityScore: 95, gap: 11, status: 'viewed',  ageMs: 1 * day + 4 * hour },
  { id: 'demo-e-3',  candidate: EMP_CANDIDATES[9], criteriaCode: 'FE2026', resumeScore: 93, verifiedScore: 88, integrityScore: 96, gap: -5, status: 'replied', ageMs: 2 * day, replyMessage: 'Loved your offline-first AI capstone. Free for a 30-minute chat this week?', replyAgeMs: 1 * day },
  { id: 'demo-e-4',  candidate: EMP_CANDIDATES[2], criteriaCode: 'BE2026', resumeScore: 82, verifiedScore: 79, integrityScore: 92, gap: -3, status: 'pending', ageMs: 3 * day },
  { id: 'demo-e-5',  candidate: EMP_CANDIDATES[3], criteriaCode: 'CY2026', resumeScore: 75, verifiedScore: 86, integrityScore: 100, gap: 11, status: 'pending', ageMs: 4 * day },
  { id: 'demo-e-6',  candidate: EMP_CANDIDATES[4], criteriaCode: 'DA2026', resumeScore: 71, verifiedScore: 74, integrityScore: 88, gap:  3, status: 'replied', ageMs: 7 * day, replyMessage: 'Thanks Vikram. Initial round on Tuesday at 4pm IST works for us — confirm if you can make it.', replyAgeMs: 6 * day },
  { id: 'demo-e-7',  candidate: EMP_CANDIDATES[5], criteriaCode: 'ML2026', resumeScore: 88, verifiedScore: 92, integrityScore: 97, gap:  4, status: 'pending', ageMs: 20 * hour },
  { id: 'demo-e-8',  candidate: EMP_CANDIDATES[6], criteriaCode: 'MB2026', resumeScore: 81, verifiedScore: 76, integrityScore: 93, gap: -5, status: 'viewed',  ageMs: 5 * day },
  { id: 'demo-e-9',  candidate: EMP_CANDIDATES[7], criteriaCode: 'QA2026', resumeScore: 79, verifiedScore: 84, integrityScore: 96, gap:  5, status: 'pending', ageMs: 2 * day + 8 * hour },
  { id: 'demo-e-10', candidate: EMP_CANDIDATES[8], criteriaCode: 'PD2026', resumeScore: 84, verifiedScore: 78, integrityScore: 91, gap: -6, status: 'pending', ageMs: 11 * day },
];

async function seed() {
  let matchCount = 0;
  let replyCount = 0;
  let notifCount = 0;

  // 1. Candidate-perspective matches (Astha sending out applications)
  for (const m of CANDIDATE_MATCHES) {
    const sentAt = new Date(Date.now() - m.ageMs);
    const matchDoc = {
      matchId: m.id,
      criteriaCode: m.criteriaCode,
      scorecardId: `sc-${m.id}`,
      candidateId: 'demo-candidate-astha',
      employerId: DEMO_EMPLOYER_ID,
      contactInfo: { ...ASTHA_CONTACT },
      resumeScore: m.resumeScore,
      verifiedScore: m.verifiedScore,
      integrityScore: m.integrityScore,
      gap: m.gap,
      meetsThreshold: true,
      status: m.status,
      sentAt,
      isDemo: true,
      demoRole: 'candidate',
      seedTag: SEED_TAG,
    };
    await db.collection('matches').doc(m.id).set(matchDoc);
    matchCount++;

    if (m.replyMessage) {
      const replyId = `${m.id}-reply`;
      await db.collection('replies').doc(replyId).set({
        replyId,
        matchId: m.id,
        employerId: DEMO_EMPLOYER_ID,
        candidateId: 'demo-candidate-astha',
        message: m.replyMessage,
        sentAt: new Date(Date.now() - m.replyAgeMs),
        isDemo: true,
        seedTag: SEED_TAG,
      });
      replyCount++;
    }
    process.stdout.write(`+ matches/${m.id}  ${m.criteriaCode}  (candidate view)\n`);
  }

  // 2. Employer-perspective matches (10 candidates applying)
  for (const m of EMPLOYER_MATCHES) {
    const sentAt = new Date(Date.now() - m.ageMs);
    const matchDoc = {
      matchId: m.id,
      criteriaCode: m.criteriaCode,
      scorecardId: `sc-${m.id}`,
      candidateId: m.candidate.id,
      employerId: DEMO_EMPLOYER_ID,
      contactInfo: {
        name: m.candidate.name,
        email: m.candidate.email,
        phone: m.candidate.phone,
        linkedin: m.candidate.linkedin,
        github: m.candidate.github,
      },
      resumeScore: m.resumeScore,
      verifiedScore: m.verifiedScore,
      integrityScore: m.integrityScore,
      gap: m.gap,
      meetsThreshold: true,
      status: m.status,
      sentAt,
      isDemo: true,
      demoRole: 'employer',
      seedTag: SEED_TAG,
    };
    await db.collection('matches').doc(m.id).set(matchDoc);
    matchCount++;

    if (m.replyMessage) {
      const replyId = `${m.id}-reply`;
      await db.collection('replies').doc(replyId).set({
        replyId,
        matchId: m.id,
        employerId: DEMO_EMPLOYER_ID,
        candidateId: m.candidate.id,
        message: m.replyMessage,
        sentAt: new Date(Date.now() - m.replyAgeMs),
        isDemo: true,
        seedTag: SEED_TAG,
      });
      replyCount++;
    }

    // One notification per match so the employer side also has a live
    // notification feed if you ever wire one in.
    const notifId = `${m.id}-notif`;
    await db.collection('notifications').doc(notifId).set({
      recipientId: DEMO_EMPLOYER_ID,
      type: 'new_match',
      matchId: m.id,
      candidateId: m.candidate.id,
      criteriaCode: m.criteriaCode,
      read: m.status !== 'pending',
      createdAt: sentAt,
      isDemo: true,
      seedTag: SEED_TAG,
    });
    notifCount++;
    process.stdout.write(`+ matches/${m.id}  ${m.criteriaCode}  (employer view: ${m.candidate.name})\n`);
  }

  console.log(`\nDone. Seeded ${matchCount} matches, ${replyCount} replies, ${notifCount} notifications.`);
  console.log(`All tagged isDemo:true and readable by anyone via the public-read rule branch.`);
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  });
