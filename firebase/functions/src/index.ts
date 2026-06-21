// Single Express app deployed as one Cloud Run service via Firebase
// Functions v2 onRequest. All hiring/sharing endpoints live here. The only
// non-Express export is `onMatchCreated`, which is a Firestore trigger and
// cannot be wired into an HTTP router.

import * as admin from 'firebase-admin';
import { onRequest } from 'firebase-functions/v2/https';
import { createHmac, randomBytes, createHash, timingSafeEqual } from 'crypto';
import express, { type Request, type Response, type NextFunction } from 'express';

admin.initializeApp();
const db = admin.firestore();

// ── Constants ─────────────────────────────────────────────────────────
const SHARED_RESUME_SALT_PREFIX = 'resumeai:v1:';
const SLUG_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const SLUG_LEN = 8;
const SHORT_CODE_LEN = 6;

// ── Helpers ──────────────────────────────────────────────────────────
function shortCode(): string {
  return randomBytes(4).toString('base64url').slice(0, SHORT_CODE_LEN).toUpperCase();
}

function generateSlug(): string {
  const bytes = randomBytes(SLUG_LEN);
  let s = '';
  for (let i = 0; i < SLUG_LEN; i++) s += SLUG_ALPHABET[bytes[i] % SLUG_ALPHABET.length];
  return s;
}

function hashPassword(password: string, slug: string): string {
  return createHash('sha256')
    .update(SHARED_RESUME_SALT_PREFIX + slug + ':' + password)
    .digest('hex');
}

function safeEqualHex(a: string, b: string): boolean {
  try {
    const ba = Buffer.from(a, 'hex');
    const bb = Buffer.from(b, 'hex');
    if (ba.length !== bb.length) return false;
    return timingSafeEqual(ba, bb);
  } catch {
    return false;
  }
}

function validResumePayload(resume: unknown): resume is Record<string, unknown> {
  return typeof resume === 'object' && resume !== null;
}

class ApiError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
  }
}

// ── Express app ──────────────────────────────────────────────────────
const app = express();
app.use(express.json({ limit: '4mb' }));

// CORS — explicit allowlist, never *
const ALLOWED_ORIGIN_PATTERNS: RegExp[] = [
  /^https:\/\/[a-z0-9-]+\.dmj\.one$/i,
  /^https:\/\/astha-capstone\.dmj\.one$/i,
  /^https:\/\/sathi\.dmj\.one$/i,
  /^https:\/\/[a-z0-9-]+\.vercel\.app$/i,
  /^http:\/\/localhost(:\d+)?$/i,
  /^http:\/\/127\.0\.0\.1(:\d+)?$/i,
];

app.use((req, res, next) => {
  const origin = req.headers.origin || '';
  if (origin && ALLOWED_ORIGIN_PATTERNS.some((r) => r.test(origin))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'authorization, content-type');
    res.setHeader('Access-Control-Max-Age', '600');
  }
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  next();
});

// Health probe — public, used by uptime monitors
app.get('/health', (_req, res) => {
  res.json({ ok: true, version: 1, time: new Date().toISOString() });
});

// Firebase ID-token auth middleware
async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Sign in required', code: 'unauthenticated' });
    return;
  }
  const idToken = header.slice('Bearer '.length).trim();
  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    (req as Request & { uid: string; email: string }).uid = decoded.uid;
    (req as Request & { uid: string; email: string }).email = decoded.email || '';
    next();
  } catch {
    res.status(401).json({ error: 'Invalid auth token', code: 'unauthenticated' });
  }
}

function getUid(req: Request): string {
  return (req as Request & { uid?: string }).uid || '';
}

function getEmail(req: Request): string {
  return (req as Request & { email?: string }).email || '';
}

// Wrap async handlers so thrown ApiError flows to error middleware
type AsyncHandler = (req: Request, res: Response) => Promise<unknown>;
function wrap(handler: AsyncHandler) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(handler(req, res)).catch(next);
  };
}

// ── Routes: criteria + scoring ───────────────────────────────────────

app.post('/publishCriteria', requireAuth, wrap(async (req, res) => {
  const uid = getUid(req);
  const email = getEmail(req);
  const data = req.body as {
    jobTitle?: string;
    description?: string;
    requiredSkills?: string[];
    preferredSkills?: string[];
    customSignals?: { name: string; weight: number; description: string }[];
    weights?: Record<string, number>;
    threshold?: number;
    testConfig?: { skillsToTest: string[]; difficultyFloor: number; questionCount: number };
  };

  if (!data.jobTitle || !data.requiredSkills?.length || !data.weights) {
    throw new ApiError(400, 'invalid-argument', 'jobTitle, requiredSkills, and weights required.');
  }

  const sc = shortCode();
  const signingSecret = randomBytes(32).toString('hex');

  await db.collection('criteria').doc(sc).set({
    shortCode: sc,
    jobTitle: data.jobTitle,
    description: data.description || '',
    requiredSkills: data.requiredSkills,
    preferredSkills: data.preferredSkills || [],
    customSignals: data.customSignals || [],
    weights: data.weights,
    threshold: data.threshold ?? 70,
    testConfig: data.testConfig ?? {
      skillsToTest: data.requiredSkills.slice(0, 5),
      difficultyFloor: 1,
      questionCount: 5,
    },
    signingSecret,
    employerId: uid,
    employerEmail: email,
    status: 'active',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
  });

  res.json({ shortCode: sc });
}));

app.post('/startTestSession', requireAuth, wrap(async (req, res) => {
  const uid = getUid(req);
  const { criteriaCode, resumePin, deviceId } = req.body as {
    criteriaCode?: string;
    resumePin?: string;
    deviceId?: string;
  };

  if (!criteriaCode || !resumePin) {
    throw new ApiError(400, 'invalid-argument', 'criteriaCode and resumePin required.');
  }

  const criteriaDoc = await db.collection('criteria').doc(criteriaCode).get();
  if (!criteriaDoc.exists || criteriaDoc.data()?.status !== 'active') {
    throw new ApiError(404, 'not-found', 'Criteria not found or inactive.');
  }

  const existing = await db
    .collection('sessions')
    .where('criteriaCode', '==', criteriaCode)
    .where('resumePin', '==', resumePin)
    .limit(1)
    .get();
  if (!existing.empty) {
    throw new ApiError(409, 'already-exists', 'This resume was already tested against these criteria.');
  }

  if (deviceId) {
    const deviceSessions = await db
      .collection('sessions')
      .where('criteriaCode', '==', criteriaCode)
      .where('deviceId', '==', deviceId)
      .where('status', '==', 'completed')
      .limit(1)
      .get();
    if (!deviceSessions.empty) {
      throw new ApiError(409, 'already-exists',
        'This device already completed a test for these criteria. Cannot retest from the same device.');
    }
  }

  const sessionRef = db.collection('sessions').doc();
  await sessionRef.set({
    candidateId: uid,
    criteriaCode,
    resumePin,
    deviceId: deviceId || null,
    status: 'active',
    startedAt: admin.firestore.FieldValue.serverTimestamp(),
    lastHeartbeat: admin.firestore.FieldValue.serverTimestamp(),
  });

  res.json({ sessionId: sessionRef.id });
}));

app.post('/heartbeat', requireAuth, wrap(async (req, res) => {
  const uid = getUid(req);
  const { sessionId } = req.body as { sessionId?: string };
  if (!sessionId) throw new ApiError(400, 'invalid-argument', 'sessionId required.');

  const sessionRef = db.collection('sessions').doc(sessionId);
  const session = await sessionRef.get();
  if (!session.exists) throw new ApiError(404, 'not-found', 'Session not found.');
  if (session.data()?.candidateId !== uid) throw new ApiError(403, 'permission-denied', 'Not your session.');
  if (session.data()?.status !== 'active') {
    throw new ApiError(412, 'failed-precondition', 'Session is not active.');
  }

  await sessionRef.update({
    lastHeartbeat: admin.firestore.FieldValue.serverTimestamp(),
  });

  res.json({ ok: true });
}));

app.post('/signScorecard', requireAuth, wrap(async (req, res) => {
  const uid = getUid(req);
  const data = req.body as {
    version: number;
    criteriaCode?: string;
    criteriaHash?: string;
    sessionId?: string;
    timestamp?: string;
    resumeScore?: Record<string, unknown>;
    resumePin?: Record<string, unknown>;
    verification?: Record<string, unknown>;
    integrity?: Record<string, unknown>;
    gap?: number;
    calibration?: Record<string, unknown>;
  };

  if (!data.sessionId || !data.criteriaCode) {
    throw new ApiError(400, 'invalid-argument', 'sessionId and criteriaCode required.');
  }

  const sessionRef = db.collection('sessions').doc(data.sessionId);
  const session = await sessionRef.get();
  if (!session.exists) throw new ApiError(404, 'not-found', 'Session not found.');
  const sessionData = session.data()!;
  if (sessionData.candidateId !== uid) {
    throw new ApiError(403, 'permission-denied', 'Not your session.');
  }
  if (sessionData.status === 'completed') {
    throw new ApiError(412, 'failed-precondition', 'Session already scored.');
  }

  const criteriaDoc = await db.collection('criteria').doc(data.criteriaCode).get();
  if (!criteriaDoc.exists) throw new ApiError(404, 'not-found', 'Criteria not found.');
  const criteriaData = criteriaDoc.data()!;

  const canonical = JSON.stringify({
    version: data.version,
    criteriaCode: data.criteriaCode,
    criteriaHash: data.criteriaHash,
    candidateId: uid,
    sessionId: data.sessionId,
    timestamp: data.timestamp,
    resumeScore: data.resumeScore,
    resumePin: data.resumePin,
    verification: data.verification,
    integrity: data.integrity,
    gap: data.gap,
    calibration: data.calibration,
  });

  const signature = createHmac('sha256', criteriaData.signingSecret)
    .update(canonical)
    .digest('hex');

  const scorecardRef = db.collection('scorecards').doc();
  await scorecardRef.set({
    ...JSON.parse(canonical),
    candidateId: uid,
    employerId: criteriaData.employerId,
    signature,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  await sessionRef.update({ status: 'completed' });

  res.json({ scorecardId: scorecardRef.id, signature });
}));

app.post('/sendMatchSignal', requireAuth, wrap(async (req, res) => {
  const uid = getUid(req);
  const data = req.body as {
    criteriaCode?: string;
    scorecardSignature?: string;
    contactInfo?: { name: string; email: string; phone?: string; linkedin?: string; github?: string };
    resumeScore?: number;
    verifiedScore?: number;
    integrityScore?: number;
    gap?: number;
  };

  if (!data.criteriaCode || !data.contactInfo?.name || !data.contactInfo?.email) {
    throw new ApiError(400, 'invalid-argument', 'criteriaCode and contactInfo (name, email) required.');
  }

  const criteriaDoc = await db.collection('criteria').doc(data.criteriaCode).get();
  if (!criteriaDoc.exists) throw new ApiError(404, 'not-found', 'Criteria not found.');
  const criteriaData = criteriaDoc.data()!;

  const matchRef = db.collection('matches').doc();
  await matchRef.set({
    matchId: matchRef.id,
    criteriaCode: data.criteriaCode,
    scorecardSignature: data.scorecardSignature || '',
    candidateId: uid,
    employerId: criteriaData.employerId,
    contactInfo: data.contactInfo,
    resumeScore: data.resumeScore ?? 0,
    verifiedScore: data.verifiedScore ?? 0,
    integrityScore: data.integrityScore ?? 0,
    gap: data.gap ?? 0,
    meetsThreshold: (data.verifiedScore ?? 0) >= (criteriaData.threshold ?? 70),
    status: 'pending',
    sentAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // Inline what used to be the onDocumentCreated('matches/{id}') trigger.
  // Match creation only happens through this endpoint (rules block direct
  // client writes), so inlining is equivalent and collapses the deploy
  // into a single Cloud Run service. Failures here are non-fatal for the
  // match itself — the user already has their match doc.
  try {
    await notifyEmployerOfMatch({
      matchId: matchRef.id,
      employerId: criteriaData.employerId,
      candidateId: uid,
      criteriaCode: data.criteriaCode,
    });
  } catch (notifyErr) {
    console.warn('[api] notification fan-out failed; match doc is intact', notifyErr);
  }

  res.json({ matchId: matchRef.id });
}));

/**
 * Side-effects fan-out after a match is created: in-app notification +
 * outbound email via the SendGrid Firebase extension `mail/` queue.
 * Used to live in `onDocumentCreated('matches/{matchId}')`; inlined here
 * so the whole hiring surface is one Cloud Run service.
 */
async function notifyEmployerOfMatch(args: {
  matchId: string;
  employerId: string;
  candidateId: string;
  criteriaCode: string;
}): Promise<void> {
  const { matchId, employerId, candidateId, criteriaCode } = args;

  await db.collection('notifications').doc().set({
    recipientId: employerId,
    type: 'new_match',
    matchId,
    candidateId,
    criteriaCode,
    read: false,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  await db.collection('mail').doc().set({
    toUids: [employerId],
    message: {
      subject: 'New candidate match on ResumeAI Bridge',
      text: `A candidate has expressed interest via criteria ${criteriaCode}. Log in to review the match.`,
      html: `<p>A candidate has expressed interest via criteria <strong>${criteriaCode}</strong>.</p><p>Log in to review the match.</p>`,
    },
  });
}

app.post('/replyToMatch', requireAuth, wrap(async (req, res) => {
  const uid = getUid(req);
  const { matchId, message } = req.body as { matchId?: string; message?: string };
  if (!matchId) throw new ApiError(400, 'invalid-argument', 'matchId required.');

  const matchDoc = await db.collection('matches').doc(matchId).get();
  if (!matchDoc.exists) throw new ApiError(404, 'not-found', 'Match not found.');
  if (matchDoc.data()?.employerId !== uid) {
    throw new ApiError(403, 'permission-denied', 'Not your match.');
  }

  const existing = await db
    .collection('replies')
    .where('matchId', '==', matchId)
    .limit(1)
    .get();
  if (!existing.empty) {
    throw new ApiError(409, 'already-exists', 'Already replied to this match.');
  }

  const replyRef = db.collection('replies').doc();
  await replyRef.set({
    matchId,
    employerId: uid,
    candidateId: matchDoc.data()!.candidateId,
    message: message || '',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  await db.collection('matches').doc(matchId).update({ status: 'replied' });

  res.json({ replyId: replyRef.id });
}));

// ── Routes: shared resumes (public — no auth) ────────────────────────

app.post('/createSharedResume', wrap(async (req, res) => {
  const { resume, password } = (req.body ?? {}) as { resume?: unknown; password?: string };
  if (!validResumePayload(resume)) throw new ApiError(400, 'invalid-argument', 'resume is required');
  if (typeof password !== 'string') {
    throw new ApiError(400, 'invalid-argument', 'password must be a string (possibly empty)');
  }

  for (let attempt = 0; attempt < 5; attempt++) {
    const slug = generateSlug();
    const ref = db.collection('resumes').doc(slug);
    const snap = await ref.get();
    if (snap.exists) continue;

    const passwordHash = password.length > 0 ? hashPassword(password, slug) : '';
    await ref.set({
      resume,
      passwordHash,
      hasPassword: passwordHash.length > 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    res.json({ slug });
    return;
  }
  throw new ApiError(500, 'internal', 'Could not allocate a slug, please retry.');
}));

app.post('/updateSharedResume', wrap(async (req, res) => {
  const { slug, resume, password } = (req.body ?? {}) as {
    slug?: string;
    resume?: unknown;
    password?: string;
  };
  if (!slug || typeof slug !== 'string' || !/^[A-Za-z0-9_-]{6,32}$/.test(slug)) {
    throw new ApiError(400, 'invalid-argument', 'slug is invalid');
  }
  if (!validResumePayload(resume)) throw new ApiError(400, 'invalid-argument', 'resume is required');
  if (password !== undefined && typeof password !== 'string') {
    throw new ApiError(400, 'invalid-argument', 'password must be a string');
  }

  const ref = db.collection('resumes').doc(slug);
  const snap = await ref.get();
  if (!snap.exists) throw new ApiError(404, 'not-found', 'Resume not found');
  const existing = snap.data() ?? {};
  const storedHash: string = typeof existing.passwordHash === 'string' ? existing.passwordHash : '';

  if (storedHash.length > 0) {
    if (!password) throw new ApiError(403, 'permission-denied', 'Password required to edit this resume.');
    const attempted = hashPassword(password, slug);
    if (!safeEqualHex(storedHash, attempted)) {
      throw new ApiError(403, 'permission-denied', 'Incorrect password.');
    }
  }

  await ref.update({
    resume,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  res.json({ ok: true });
}));

app.post('/verifySharedResumePassword', wrap(async (req, res) => {
  const { slug, password } = (req.body ?? {}) as { slug?: string; password?: string };
  if (!slug || typeof slug !== 'string' || !/^[A-Za-z0-9_-]{6,32}$/.test(slug)) {
    throw new ApiError(400, 'invalid-argument', 'slug is invalid');
  }
  if (password !== undefined && typeof password !== 'string') {
    throw new ApiError(400, 'invalid-argument', 'password must be a string');
  }

  const snap = await db.collection('resumes').doc(slug).get();
  if (!snap.exists) throw new ApiError(404, 'not-found', 'Resume not found');
  const storedHash: string = ((snap.data() ?? {}).passwordHash as string) || '';
  const hasPassword = storedHash.length > 0;
  if (!hasPassword) {
    res.json({ ok: true, hasPassword: false });
    return;
  }
  if (!password) {
    res.json({ ok: false, hasPassword: true });
    return;
  }
  const attempted = hashPassword(password, slug);
  res.json({ ok: safeEqualHex(storedHash, attempted), hasPassword: true });
}));

// ── Error handler ────────────────────────────────────────────────────
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof ApiError) {
    res.status(err.status).json({ error: err.message, code: err.code });
    return;
  }
  const message = err instanceof Error ? err.message : 'Internal error';
  res.status(500).json({ error: message, code: 'internal' });
});

// ── Exports ──────────────────────────────────────────────────────────

// Single Cloud Run service (via Functions v2). Tight scaling for cost
// control on a capstone budget: scale to zero when idle, never run more
// than one instance simultaneously, one vCPU per instance. Concurrency 80
// lets that single container absorb realistic burst traffic before
// requests queue.
export const api = onRequest(
  {
    region: 'asia-east1',
    cpu: 1,
    memory: '512MiB',
    concurrency: 80,
    minInstances: 0,
    maxInstances: 1,
  },
  app,
);
