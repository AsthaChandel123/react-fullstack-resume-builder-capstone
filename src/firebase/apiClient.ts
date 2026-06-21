// Thin client for the single consolidated Express API deployed as a
// Firebase Functions v2 onRequest (Cloud Run under the hood).
//
// Replaces the ten httpsCallable wrappers that previously fanned out to
// individual Cloud Functions. The server lives at:
//   https://us-central1-<projectId>.cloudfunctions.net/api
// or its mirror at *.run.app. The base URL can be overridden with
// VITE_API_BASE for local emulator use.

import { getAppAuth, isFirebaseConfigured } from './config';

function deriveDefaultBase(): string {
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined;
  if (!projectId) return '';
  // The consolidated `api` function is deployed in asia-east1 for the
  // dmjone project. Override with VITE_API_BASE for local emulator or for
  // pointing at a different region.
  return `https://asia-east1-${projectId}.cloudfunctions.net/api`;
}

const API_BASE: string =
  (import.meta.env.VITE_API_BASE as string | undefined)?.replace(/\/+$/, '') ||
  deriveDefaultBase();

export class ApiError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

interface ApiCallOptions {
  /** When false, skip the Firebase ID-token attach. Defaults to true. */
  auth?: boolean;
}

async function getIdTokenOrThrow(): Promise<string> {
  if (!isFirebaseConfigured()) {
    throw new ApiError(0, 'firebase-not-configured', 'Firebase not configured');
  }
  const user = getAppAuth().currentUser;
  if (!user) throw new ApiError(401, 'unauthenticated', 'Sign in required.');
  return user.getIdToken();
}

async function call<TResp>(
  path: string,
  body: unknown,
  opts: ApiCallOptions = {},
): Promise<TResp> {
  if (!API_BASE) {
    throw new ApiError(0, 'no-api-base', 'API base URL not configured. Set VITE_API_BASE or VITE_FIREBASE_PROJECT_ID.');
  }

  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (opts.auth !== false) {
    headers.authorization = `Bearer ${await getIdTokenOrThrow()}`;
  }

  const url = `${API_BASE}/${path.replace(/^\/+/, '')}`;
  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body ?? {}),
      credentials: 'omit',
    });
  } catch (err) {
    throw new ApiError(0, 'network-error', err instanceof Error ? err.message : 'Network error');
  }

  let parsed: unknown = null;
  try {
    parsed = await res.json();
  } catch {
    // ignore; non-JSON error body
  }

  if (!res.ok) {
    const body = (parsed ?? {}) as { error?: string; code?: string };
    throw new ApiError(res.status, body.code || 'http-error', body.error || res.statusText);
  }

  return parsed as TResp;
}

// ── Typed API surface ───────────────────────────────────────────────

export interface PublishCriteriaInput {
  jobTitle: string;
  description?: string;
  requiredSkills: string[];
  preferredSkills?: string[];
  customSignals?: { name: string; weight: number; description: string }[];
  weights: Record<string, number>;
  threshold?: number;
  testConfig?: { skillsToTest: string[]; difficultyFloor: number; questionCount: number };
}

export interface StartTestSessionInput {
  criteriaCode: string;
  /** Opaque pin used for anti-gaming dedupe. Server treats it as an
   *  equality value, so a hashed string is preferable to a deep object. */
  resumePin: unknown;
  deviceId?: string;
}

export interface SignScorecardInput {
  version: number;
  criteriaCode: string;
  criteriaHash: string;
  sessionId: string;
  timestamp: string;
  /** Free-shape score blobs — kept opaque end-to-end so server signs
   *  whatever the client produces without imposing a shape constraint. */
  resumeScore: unknown;
  resumePin: unknown;
  verification: unknown;
  integrity: unknown;
  gap: number;
  calibration: unknown;
}

export interface SendMatchSignalInput {
  criteriaCode: string;
  scorecardSignature: string;
  contactInfo: { name: string; email: string; phone?: string; linkedin?: string; github?: string };
  resumeScore: number;
  verifiedScore: number;
  integrityScore: number;
  gap: number;
}

export const api = {
  publishCriteria: (data: PublishCriteriaInput) =>
    call<{ shortCode: string }>('publishCriteria', data),
  startTestSession: (data: StartTestSessionInput) =>
    call<{ sessionId: string }>('startTestSession', data),
  heartbeat: (data: { sessionId: string }) =>
    call<{ ok: true }>('heartbeat', data),
  signScorecard: (data: SignScorecardInput) =>
    call<{ scorecardId: string; signature: string }>('signScorecard', data),
  sendMatchSignal: (data: SendMatchSignalInput) =>
    call<{ matchId: string }>('sendMatchSignal', data),
  replyToMatch: (data: { matchId: string; message?: string }) =>
    call<{ replyId: string }>('replyToMatch', data),

  // Shared-resume endpoints are public — no Firebase auth attached.
  createSharedResume: (data: { resume: unknown; password: string }) =>
    call<{ slug: string }>('createSharedResume', data, { auth: false }),
  updateSharedResume: (data: { slug: string; resume: unknown; password: string }) =>
    call<{ ok: true }>('updateSharedResume', data, { auth: false }),
  verifySharedResumePassword: (data: { slug: string; password?: string }) =>
    call<{ ok: boolean; hasPassword: boolean }>('verifySharedResumePassword', data, { auth: false }),
} as const;
