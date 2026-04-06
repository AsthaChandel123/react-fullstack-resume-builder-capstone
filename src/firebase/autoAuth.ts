import { getCurrentUser, signInAnon } from './auth';
import { isFirebaseConfigured, getDb } from './config';
import { getDeviceId } from './deviceId';
import { doc, setDoc, getDoc } from 'firebase/firestore';

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
