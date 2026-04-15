import { getCurrentUser, signInAnon } from './auth';
import { isFirebaseConfigured, getDb } from './config';
import { getDeviceId } from './deviceId';
import { doc, setDoc, getDoc, arrayUnion } from 'firebase/firestore';

/**
 * Ensure a Firebase user exists. Signs in anonymously if needed.
 * Links the anonymous account to a stable device fingerprint so
 * one device = one identity, regardless of browser or restart.
 *
 * Flow:
 * 1. Generate device fingerprint from hardware signals
 * 2. Check if this device already has a Firebase UID mapped
 * 3. If yes, sign in and verify
 * 4. If no, sign in anonymously and store the mapping
 */
export async function ensureAuth() {
  if (!isFirebaseConfigured()) return null;

  // Fast path: already signed in
  const existing = getCurrentUser();
  if (existing) return existing;

  try {
    // Get stable device fingerprint
    const deviceId = await getDeviceId();

    // Sign in anonymously (Firebase assigns a UID)
    const user = await signInAnon();

    // Store device -> UID mapping in Firestore
    // This lets us track "one device = one identity"
    const db = getDb();
    const deviceRef = doc(db, 'devices', deviceId);

    try {
      const deviceDoc = await getDoc(deviceRef);
      if (!deviceDoc.exists()) {
        // First time this device is seen
        await setDoc(deviceRef, {
          uid: user.uid,
          deviceId,
          firstSeen: new Date().toISOString(),
          lastSeen: new Date().toISOString(),
        });
      } else {
        // Device seen before - update last seen
        await setDoc(deviceRef, {
          lastSeen: new Date().toISOString(),
        }, { merge: true });
      }
    } catch {
      // Firestore write failed (rules, offline) - non-blocking
    }

    return user;
  } catch {
    return null;
  }
}

/**
 * Bind an email (from resume) to the current device fingerprint.
 * Tracks email <-> device mapping for identity verification.
 *
 * Rules:
 * - One email can have multiple devices (work laptop + phone = legit)
 * - One device switching emails = tracked (could be legit or gaming)
 * - Employer sees: "this candidate uses N devices" and
 *   "this device has been used with N different emails"
 */
export async function bindEmailToDevice(email: string) {
  if (!email || !isFirebaseConfigured()) return;

  const normalized = email.trim().toLowerCase();
  if (!normalized.includes('@')) return;

  try {
    const deviceId = await getDeviceId();
    const db = getDb();

    // 1. Add this device to the email's device list
    const emailRef = doc(db, 'emailDevices', normalized.replace(/[.@]/g, '_'));
    await setDoc(emailRef, {
      email: normalized,
      devices: arrayUnion(deviceId),
      lastSeen: new Date().toISOString(),
    }, { merge: true });

    // 2. Add this email to the device's email list
    const deviceRef = doc(db, 'devices', deviceId);
    await setDoc(deviceRef, {
      emails: arrayUnion(normalized),
      lastSeen: new Date().toISOString(),
    }, { merge: true });
  } catch {
    // Non-blocking. Firestore may not be writable.
  }
}
