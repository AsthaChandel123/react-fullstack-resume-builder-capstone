// /mnt/experiments/astha-resume/src/pages/SharedResume.tsx
// Public, shareable, editable resume at /r/:slug.
// Anyone with the URL can read AND edit. Edits auto-save to Firestore.

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Builder } from './Builder';
import { useResumeStore } from '@/store/resumeStore';
import {
  loadResumeFromShare,
  saveResumeToShare,
  buildShareUrl,
} from '@/firebase/resumeShare';

const AUTOSAVE_DEBOUNCE_MS = 1500;

export default function SharedResume() {
  const { slug = '' } = useParams<{ slug: string }>();
  const resume = useResumeStore((s) => s.resume);
  const setResume = useResumeStore((s) => s.setResume);
  const [status, setStatus] = useState<'loading' | 'ready' | 'missing' | 'error'>('loading');
  const [errMsg, setErrMsg] = useState('');
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const hydratedRef = useRef(false);
  const saveTimerRef = useRef<number | null>(null);

  // Load on mount
  useEffect(() => {
    if (!slug) {
      setStatus('error');
      setErrMsg('Missing resume id.');
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const remote = await loadResumeFromShare(slug);
        if (cancelled) return;
        if (!remote) {
          setStatus('missing');
          return;
        }
        setResume(remote);
        hydratedRef.current = true;
        setStatus('ready');
      } catch (e) {
        if (cancelled) return;
        setStatus('error');
        setErrMsg(e instanceof Error ? e.message : String(e));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug, setResume]);

  // Debounced auto-save on every resume change after hydration
  useEffect(() => {
    if (!hydratedRef.current || status !== 'ready') return;
    setSaveState('saving');
    if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    saveTimerRef.current = window.setTimeout(async () => {
      try {
        await saveResumeToShare(slug, resume);
        setSaveState('saved');
      } catch (e) {
        setSaveState('error');
        if (import.meta.env?.DEV) console.error('autosave failed', e);
      }
    }, AUTOSAVE_DEBOUNCE_MS);
    return () => {
      if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    };
  }, [resume, slug, status]);

  if (status === 'loading') {
    return (
      <div className="flex min-h-[60vh] items-center justify-center" role="status">
        <div className="animate-pulse text-lg" style={{ color: 'var(--text-muted)' }}>
          Loading shared resume…
        </div>
      </div>
    );
  }

  if (status === 'missing') {
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

  if (status === 'error') {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="mb-2 text-2xl font-bold" style={{ color: 'var(--accent-red)' }}>
          Could not load resume
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{errMsg}</p>
      </div>
    );
  }

  return (
    <div>
      <ShareBanner slug={slug} saveState={saveState} />
      <Builder />
    </div>
  );
}

function ShareBanner({
  slug,
  saveState,
}: {
  slug: string;
  saveState: 'idle' | 'saving' | 'saved' | 'error';
}) {
  const url = buildShareUrl(slug);
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(url).then(
      () => {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1800);
      },
      () => {},
    );
  }

  const stateLabel =
    saveState === 'saving'
      ? 'Saving…'
      : saveState === 'saved'
        ? 'Saved'
        : saveState === 'error'
          ? 'Save failed'
          : '';

  return (
    <div
      className="flex flex-wrap items-center gap-3 border-b px-4 py-2 text-sm"
      style={{
        background: 'var(--bg-surface)',
        borderColor: 'var(--border)',
        color: 'var(--text-primary)',
      }}
      role="region"
      aria-label="Shared resume info"
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
      <span
        aria-live="polite"
        className="ml-auto text-xs"
        style={{
          color:
            saveState === 'error'
              ? 'var(--accent-red)'
              : saveState === 'saved'
                ? 'var(--accent-green, #16a34a)'
                : 'var(--text-muted)',
        }}
      >
        {stateLabel}
      </span>
    </div>
  );
}
