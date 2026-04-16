// /mnt/experiments/astha-resume/src/firebase/resumeShare.ts
// Public, slug-addressable resume sharing with optional password-gated editing.
// Reads go straight to Firestore (public). Writes go through Cloud Functions
// so the server can verify the password hash before letting the update land.

import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getDb, initFirebase, isFirebaseConfigured } from './config';
import type { Resume } from '@/store/types';

const COLLECTION = 'resumes';

export interface SharedResumeDoc {
  resume: Resume;
  hasPassword?: boolean;
}

function functions() {
  const { app } = initFirebase();
  return getFunctions(app);
}

export async function createSharedResume(
  resume: Resume,
  password: string,
): Promise<{ slug: string }> {
  if (!isFirebaseConfigured()) throw new Error('Firebase not configured');
  const fn = httpsCallable<
    { resume: Resume; password: string },
    { slug: string }
  >(functions(), 'createSharedResume');
  const res = await fn({ resume, password });
  return res.data;
}

export async function updateSharedResume(
  slug: string,
  resume: Resume,
  password: string,
): Promise<void> {
  if (!isFirebaseConfigured()) throw new Error('Firebase not configured');
  const fn = httpsCallable<
    { slug: string; resume: Resume; password: string },
    { ok: boolean }
  >(functions(), 'updateSharedResume');
  await fn({ slug, resume, password });
}

export async function verifySharedResumePassword(
  slug: string,
  password: string,
): Promise<{ ok: boolean; hasPassword: boolean }> {
  if (!isFirebaseConfigured()) throw new Error('Firebase not configured');
  const fn = httpsCallable<
    { slug: string; password: string },
    { ok: boolean; hasPassword: boolean }
  >(functions(), 'verifySharedResumePassword');
  const res = await fn({ slug, password });
  return res.data;
}

export async function loadResumeFromShare(
  slug: string,
): Promise<SharedResumeDoc | null> {
  if (!isFirebaseConfigured()) throw new Error('Firebase not configured');
  const snap = await getDoc(doc(getDb(), COLLECTION, slug));
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    resume: data.resume as Resume,
    hasPassword: Boolean(data.hasPassword),
  };
}

export function subscribeResumeShare(
  slug: string,
  onUpdate: (doc: SharedResumeDoc | null) => void,
  onError?: (err: Error) => void,
): () => void {
  if (!isFirebaseConfigured()) {
    onError?.(new Error('Firebase not configured'));
    return () => {};
  }
  return onSnapshot(
    doc(getDb(), COLLECTION, slug),
    (snap) => {
      if (!snap.exists()) onUpdate(null);
      else {
        const d = snap.data();
        onUpdate({ resume: d.resume as Resume, hasPassword: Boolean(d.hasPassword) });
      }
    },
    (err) => onError?.(err),
  );
}

export function buildShareUrl(slug: string): string {
  if (typeof window === 'undefined') return `/r/${slug}`;
  return `${window.location.origin}/r/${slug}`;
}
