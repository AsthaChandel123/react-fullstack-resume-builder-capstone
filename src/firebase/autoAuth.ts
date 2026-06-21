import { getCurrentUser, signInAnon } from './auth';
import { isFirebaseConfigured, getDb } from './config';
import { getDeviceId } from './deviceId';
import { doc, setDoc, arrayUnion } from 'firebase/firestore';

// Idempotent device/email-binding writes. We never pre-read these docs
// because the strict read rule (uid match) denies non-existent paths and
// throws permission-denied before we even know whether to create or update.
// Every write is a merge-write with the minimal field set that satisfies
// both the create and update rule branches.

export async function ensureAuth() {
  if (!isFirebaseConfigured()) return null;

  const existing = getCurrentUser();
  if (existing) return existing;

  try {
    const deviceId = await getDeviceId();
    const user = await signInAnon();

    const db = getDb();
    const deviceRef = doc(db, 'devices', deviceId);

    // Fire-and-forget. We don't care about the resolution; failure here is
    // non-blocking for the user's session.
    setDoc(deviceRef, {
      uid: user.uid,
      deviceId,
      lastSeen: new Date().toISOString(),
    }, { merge: true }).catch(() => {});

    return user;
  } catch {
    return null;
  }
}

/**
 * Bind an email (from resume) to the current device fingerprint.
 * One email can have multiple devices; one device can carry multiple emails.
 * Used as a fraud signal in the Bridge flow, not as auth.
 */
export async function bindEmailToDevice(email: string) {
  if (!email || !isFirebaseConfigured()) return;

  const normalized = email.trim().toLowerCase();
  if (!normalized.includes('@')) return;

  try {
    const deviceId = await getDeviceId();
    const db = getDb();
    const now = new Date().toISOString();

    const emailRef = doc(db, 'emailDevices', normalized.replace(/[.@]/g, '_'));
    setDoc(emailRef, {
      email: normalized,
      devices: arrayUnion(deviceId),
      lastSeen: now,
    }, { merge: true }).catch(() => {});

    const deviceRef = doc(db, 'devices', deviceId);
    setDoc(deviceRef, {
      emails: arrayUnion(normalized),
      lastSeen: now,
    }, { merge: true }).catch(() => {});
  } catch {
    // Non-blocking. Firestore may not be writable.
  }
}
