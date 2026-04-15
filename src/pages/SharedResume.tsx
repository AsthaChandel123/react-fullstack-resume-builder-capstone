// /mnt/experiments/astha-resume/src/pages/SharedResume.tsx
// Password-gated shareable resume at /r/:slug.
// Reads are public. Editing requires the owner's password when one was set.

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Builder } from './Builder';
import { LivePreview } from '@/builder/components/LivePreview';
import { downloadPDF } from '@/utils/pdf';
import { printResume } from '@/utils/print';
import { useResumeStore } from '@/store/resumeStore';
import {
  loadResumeFromShare,
  updateSharedResume,
  verifySharedResumePassword,
  buildShareUrl,
} from '@/firebase/resumeShare';
import type { SharedResumeDoc } from '@/firebase/resumeShare';

const AUTOSAVE_DEBOUNCE_MS = 1500;

type Status =
  | { kind: 'loading' }
  | { kind: 'missing' }
  | { kind: 'error'; msg: string }
  | { kind: 'locked'; hasPassword: boolean }
  | { kind: 'unlocked' };

export default function SharedResume() {
  const { slug = '' } = useParams<{ slug: string }>();
  const resume = useResumeStore((s) => s.resume);
  const setResume = useResumeStore((s) => s.setResume);

  const [status, setStatus] = useState<Status>({ kind: 'loading' });
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [saveErr, setSaveErr] = useState('');

  const hydratedRef = useRef(false);
  const passwordRef = useRef('');
  const saveTimerRef = useRef<number | null>(null);
  const pendingResumeRef = useRef(resume);
  pendingResumeRef.current = resume;

  // Load on mount
  useEffect(() => {
    if (!slug) {
      setStatus({ kind: 'error', msg: 'Missing resume id.' });
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const remote: SharedResumeDoc | null = await loadResumeFromShare(slug);
        if (cancelled) return;
        if (!remote) {
          setStatus({ kind: 'missing' });
          return;
        }
        setResume(remote.resume);
        hydratedRef.current = true;

        // If the creator stashed the password in sessionStorage, try auto-unlock.
        const stashed = sessionStorage.getItem(`resume-pw:${slug}`) || '';
        if (!remote.hasPassword) {
          passwordRef.current = '';
          setStatus({ kind: 'unlocked' });
          return;
        }
        if (stashed) {
          try {
            const v = await verifySharedResumePassword(slug, stashed);
            if (cancelled) return;
            if (v.ok) {
              passwordRef.current = stashed;
              setStatus({ kind: 'unlocked' });
              return;
            }
          } catch {
            /* fall through to locked */
          }
        }
        setStatus({ kind: 'locked', hasPassword: true });
      } catch (e) {
        if (cancelled) return;
        setStatus({
          kind: 'error',
          msg: e instanceof Error ? e.message : String(e),
        });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug, setResume]);

  // Debounced auto-save — only while unlocked
  useEffect(() => {
    if (!hydratedRef.current) return;
    if (status.kind !== 'unlocked') return;
    setSaveState('saving');
    if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    saveTimerRef.current = window.setTimeout(async () => {
      try {
        await updateSharedResume(slug, pendingResumeRef.current, passwordRef.current);
        setSaveState('saved');
      } catch (e) {
        setSaveState('error');
        setSaveErr(e instanceof Error ? e.message : String(e));
        if (import.meta.env?.DEV) console.error('autosave failed', e);
      }
    }, AUTOSAVE_DEBOUNCE_MS);
    return () => {
      if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    };
  }, [resume, slug, status]);

  async function onUnlock(password: string) {
    setSaveErr('');
    try {
      const v = await verifySharedResumePassword(slug, password);
      if (!v.ok) {
        setSaveErr('Incorrect password.');
        return;
      }
      passwordRef.current = password;
      sessionStorage.setItem(`resume-pw:${slug}`, password);
      setStatus({ kind: 'unlocked' });
    } catch (e) {
      setSaveErr(e instanceof Error ? e.message : String(e));
    }
  }

  if (status.kind === 'loading') {
    return (
      <div className="flex min-h-[60vh] items-center justify-center" role="status">
        <div className="animate-pulse text-lg" style={{ color: 'var(--text-muted)' }}>
          Loading shared resume…
        </div>
      </div>
    );
  }

  if (status.kind === 'missing') {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="mb-2 text-2xl font-bold">Resume not found</h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          No resume exists at <code>{buildShareUrl(slug)}</code>.
          Build one in the editor and share the link.
        </p>
      </div>
    );
  }

  if (status.kind === 'error') {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="mb-2 text-2xl font-bold" style={{ color: 'var(--accent-red)' }}>
          Could not load resume
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{status.msg}</p>
      </div>
    );
  }

  if (status.kind === 'locked') {
    return (
      <>
        <Banner
          slug={slug}
          mode="locked"
          saveLabel=""
          onUnlock={onUnlock}
          unlockError={saveErr}
        />
        <ReadOnlyView />
      </>
    );
  }

  const saveLabel =
    saveState === 'saving'
      ? 'Saving…'
      : saveState === 'saved'
        ? 'Saved'
        : saveState === 'error'
          ? 'Save failed'
          : '';

  return (
    <>
      <Banner slug={slug} mode="unlocked" saveLabel={saveLabel} />
      <Builder />
    </>
  );
}

function ReadOnlyView() {
  return (
    <div className="mx-auto max-w-5xl p-4">
      <div className="mb-4 flex flex-wrap gap-2 no-print" data-no-print>
        <button
          type="button"
          onClick={printResume}
          className="min-h-[44px] rounded-md px-4 py-2 text-sm font-medium text-white"
          style={{ background: 'var(--accent-navy)' }}
        >
          Print
        </button>
        <button
          type="button"
          onClick={() => downloadPDF()}
          className="min-h-[44px] rounded-md px-4 py-2 text-sm font-medium text-white"
          style={{ background: 'var(--accent-red)' }}
        >
          Download PDF
        </button>
      </div>
      <LivePreview />
    </div>
  );
}

function Banner({
  slug,
  mode,
  saveLabel,
  onUnlock,
  unlockError,
}: {
  slug: string;
  mode: 'locked' | 'unlocked';
  saveLabel: string;
  onUnlock?: (password: string) => void;
  unlockError?: string;
}) {
  const url = buildShareUrl(slug);
  const [copied, setCopied] = useState(false);
  const [showUnlock, setShowUnlock] = useState(false);
  const [pw, setPw] = useState('');

  function copy() {
    navigator.clipboard.writeText(url).then(
      () => {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1800);
      },
      () => {},
    );
  }

  return (
    <div
      className="flex flex-wrap items-center gap-3 border-b px-4 py-2 text-sm no-print"
      style={{
        background: 'var(--bg-surface)',
        borderColor: 'var(--border)',
        color: 'var(--text-primary)',
      }}
      role="region"
      aria-label="Shared resume info"
      data-no-print
    >
      <span className="font-semibold">Shared resume</span>
      <code
        className="rounded px-2 py-0.5"
        style={{ background: 'var(--bg-primary)', color: 'var(--text-secondary)' }}
      >
        {url}
      </code>
      <button
        type="button"
        onClick={copy}
        className="rounded-md border px-3 py-1 text-xs font-medium"
        style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}
      >
        {copied ? 'Copied!' : 'Copy link'}
      </button>
      {mode === 'locked' ? (
        <>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            View only. Enter password to edit.
          </span>
          {!showUnlock ? (
            <button
              type="button"
              onClick={() => setShowUnlock(true)}
              className="ml-auto rounded-md px-3 py-1 text-xs font-medium text-white"
              style={{ background: 'var(--accent-teal, #0f766e)' }}
            >
              Unlock to edit
            </button>
          ) : (
            <form
              className="ml-auto flex items-center gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                onUnlock?.(pw);
              }}
            >
              <input
                type="password"
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                placeholder="Edit password"
                className="min-h-[32px] rounded-md border px-2 py-1 text-xs"
                style={{
                  borderColor: 'var(--border)',
                  background: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                }}
                autoFocus
                autoComplete="current-password"
              />
              <button
                type="submit"
                className="rounded-md px-3 py-1 text-xs font-medium text-white"
                style={{ background: 'var(--accent-teal, #0f766e)' }}
              >
                Unlock
              </button>
              {unlockError && (
                <span className="text-xs" style={{ color: 'var(--accent-red)' }}>
                  {unlockError}
                </span>
              )}
            </form>
          )}
        </>
      ) : (
        <span
          aria-live="polite"
          className="ml-auto text-xs"
          style={{
            color:
              saveLabel === 'Save failed'
                ? 'var(--accent-red)'
                : saveLabel === 'Saved'
                  ? 'var(--accent-green, #16a34a)'
                  : 'var(--text-muted)',
          }}
        >
          {saveLabel || 'Editable'}
        </span>
      )}
    </div>
  );
}
