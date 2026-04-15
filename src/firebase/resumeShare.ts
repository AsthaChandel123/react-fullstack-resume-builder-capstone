// /mnt/experiments/astha-resume/src/firebase/resumeShare.ts
// Public, slug-addressable resume sharing. Anyone with the URL can read AND edit.

import { doc, getDoc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { getDb, isFirebaseConfigured } from './config';
import type { Resume } from '@/store/types';

const COLLECTION = 'resumes';

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no I, O, 0, 1
const SLUG_LEN = 8;

export function generateSlug(): string {
  const bytes = new Uint8Array(SLUG_LEN);
  crypto.getRandomValues(bytes);
  let s = '';
  for (let i = 0; i < SLUG_LEN; i++) {
    s += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return s;
}

export interface SharedResumeDoc {
  resume: Resume;
  updatedAt: ReturnType<typeof serverTimestamp> | Date;
  createdAt?: ReturnType<typeof serverTimestamp> | Date;
}

export async function saveResumeToShare(slug: string, resume: Resume): Promise<void> {
  if (!isFirebaseConfigured()) throw new Error('Firebase not configured');
  const ref = doc(getDb(), COLLECTION, slug);
  const snap = await getDoc(ref);
  const payload: Partial<SharedResumeDoc> = {
    resume,
    updatedAt: serverTimestamp(),
  };
  if (!snap.exists()) payload.createdAt = serverTimestamp();
  await setDoc(ref, payload, { merge: true });
}

export async function loadResumeFromShare(slug: string): Promise<Resume | null> {
  if (!isFirebaseConfigured()) throw new Error('Firebase not configured');
  const snap = await getDoc(doc(getDb(), COLLECTION, slug));
  if (!snap.exists()) return null;
  const data = snap.data() as SharedResumeDoc;
  return data.resume ?? null;
}

export function subscribeResumeShare(
  slug: string,
  onUpdate: (resume: Resume | null) => void,
  onError?: (err: Error) => void,
): () => void {
  if (!isFirebaseConfigured()) {
    onError?.(new Error('Firebase not configured'));
    return () => {};
  }
  const unsub = onSnapshot(
    doc(getDb(), COLLECTION, slug),
    (snap) => {
      if (!snap.exists()) onUpdate(null);
      else onUpdate((snap.data() as SharedResumeDoc).resume ?? null);
    },
    (err) => onError?.(err),
  );
  return unsub;
}

export function buildShareUrl(slug: string): string {
  if (typeof window === 'undefined') return `/r/${slug}`;
  return `${window.location.origin}/r/${slug}`;
}
