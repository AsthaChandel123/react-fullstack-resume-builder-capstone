import { useState, useCallback, type FormEvent } from 'react';
import {
  signInAnon,
  signInEmail,
  registerEmail,
  signInWithGoogle,
} from '../../firebase/auth';
import { isFirebaseConfigured } from '../../firebase/config';

interface AuthModalProps {
  onAuth: () => void;
  onClose: () => void;
}

type Mode = 'choice' | 'email-login' | 'email-register';

export function AuthModal({ onAuth, onClose }: AuthModalProps) {
  const [mode, setMode] = useState<Mode>('choice');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAnon = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      await signInAnon();
      onAuth();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-in failed');
    } finally {
      setLoading(false);
    }
  }, [onAuth]);

  const handleGoogle = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      await signInWithGoogle();
      onAuth();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Google sign-in failed';
      if (msg.includes('popup-closed-by-user')) {
        setError('');
      } else if (msg.includes('invalid_client') || msg.includes('OAuth')) {
        setError('Google Sign-In is not configured yet. Use email or guest sign-in instead.');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }, [onAuth]);

  const handleEmailSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      if (!email.trim() || !password.trim()) return;

      setLoading(true);
      setError('');
      try {
        if (mode === 'email-register') {
          await registerEmail(email.trim(), password);
        } else {
          await signInEmail(email.trim(), password);
        }
        onAuth();
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Auth failed';
        if (msg.includes('user-not-found') || msg.includes('invalid-credential')) {
          setError('Invalid email or password.');
        } else if (msg.includes('email-already-in-use')) {
          setError('Email already registered. Try signing in.');
        } else if (msg.includes('weak-password')) {
          setError('Password must be at least 6 characters.');
        } else {
          setError(msg);
        }
      } finally {
        setLoading(false);
      }
    },
    [email, password, mode, onAuth],
  );

  if (!isFirebaseConfigured()) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg p-6 max-w-sm w-full text-center space-y-4">
          <h2 className="text-lg font-bold">Firebase Not Configured</h2>
          <p className="text-sm opacity-60">
            Set VITE_FIREBASE_* environment variables to enable authentication.
          </p>
          <button onClick={onClose} className="px-4 py-2 border rounded">
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Sign in"
    >
      <div className="bg-white rounded-lg p-6 max-w-sm w-full space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">
            {mode === 'choice'
              ? 'Sign In'
              : mode === 'email-login'
                ? 'Sign In with Email'
                : 'Create Account'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl"
            aria-label="Close"
          >
            x
          </button>
        </div>

        {error && (
          <div className="p-2 bg-red-50 text-red-700 text-sm rounded" role="alert">
            {error}
          </div>
        )}

        {mode === 'choice' && (
          <div className="space-y-3">
            <p className="text-sm opacity-60">
              Sign in to publish criteria, take tests, and send match signals.
            </p>

            <button
              onClick={handleGoogle}
              disabled={loading}
              className="w-full py-3 bg-white border-2 border-gray-200 rounded-lg font-medium flex items-center justify-center gap-3 hover:bg-gray-50 disabled:opacity-40"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
                <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" />
                <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" />
                <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" />
                <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 2.58 9 2.58z" />
              </svg>
              {loading ? 'Signing in...' : 'Continue with Google'}
            </button>

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-2 text-xs text-gray-400">or</span>
              </div>
            </div>

            <button
              onClick={handleAnon}
              disabled={loading}
              className="w-full py-3 border rounded-lg font-medium disabled:opacity-40"
            >
              Continue as Guest
            </button>

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-2 text-xs text-gray-400">or</span>
              </div>
            </div>

            <button
              onClick={() => setMode('email-login')}
              className="w-full py-3 border rounded-lg font-medium"
            >
              Sign in with Email
            </button>

            <button
              onClick={() => setMode('email-register')}
              className="w-full py-2 text-sm text-blue-600 underline"
            >
              Create a new account
            </button>
          </div>
        )}

        {(mode === 'email-login' || mode === 'email-register') && (
          <form onSubmit={handleEmailSubmit} className="space-y-3">
            <div>
              <label htmlFor="auth-email" className="block text-sm font-medium mb-1">
                Email
              </label>
              <input
                id="auth-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2 border rounded"
                autoFocus
              />
            </div>
            <div>
              <label htmlFor="auth-password" className="block text-sm font-medium mb-1">
                Password
              </label>
              <input
                id="auth-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-3 py-2 border rounded"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium disabled:opacity-40"
            >
              {loading
                ? 'Please wait...'
                : mode === 'email-register'
                  ? 'Create Account'
                  : 'Sign In'}
            </button>
            <button
              type="button"
              onClick={() => setMode('choice')}
              className="w-full py-2 text-sm opacity-60 underline"
            >
              Back
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
