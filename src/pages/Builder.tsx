import { useState } from 'react';
import { ResumeForm } from '@/builder/components/ResumeForm';
import { LivePreview } from '@/builder/components/LivePreview';
import { AICoachPanel } from '@/builder/components/AICoachPanel';
import { downloadPDF } from '@/utils/pdf';
import { printResume } from '@/utils/print';
import { fillDemoResume } from '@/utils/demoData';
import { useResumeStore } from '@/store/resumeStore';
import {
  generateSlug,
  saveResumeToShare,
  buildShareUrl,
} from '@/firebase/resumeShare';
import { isFirebaseConfigured } from '@/firebase/config';

export function Builder() {
  const resume = useResumeStore((s) => s.resume);
  const [shareState, setShareState] = useState<'idle' | 'creating' | 'ready' | 'error'>('idle');
  const [shareUrl, setShareUrl] = useState('');
  const [shareErr, setShareErr] = useState('');
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    if (!isFirebaseConfigured()) {
      setShareState('error');
      setShareErr('Firebase not configured.');
      return;
    }
    setShareState('creating');
    setShareErr('');
    try {
      const slug = generateSlug();
      await saveResumeToShare(slug, resume);
      const url = buildShareUrl(slug);
      setShareUrl(url);
      setShareState('ready');
      window.history.replaceState(null, '', `/r/${slug}`);
      window.location.assign(`/r/${slug}`);
    } catch (e) {
      setShareState('error');
      setShareErr(e instanceof Error ? e.message : String(e));
    }
  }

  function copyShare() {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl).then(
      () => {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1800);
      },
      () => {},
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-120px)] flex-col lg:flex-row">
      <div
        className="builder-form flex-1 overflow-y-auto lg:max-h-[calc(100vh-120px)]"
        style={{ borderRight: '1px solid var(--border)' }}
      >
        <div className="flex items-center justify-end px-4 pt-3 no-print" data-no-print>
          <button
            type="button"
            onClick={fillDemoResume}
            className="min-h-[36px] rounded-md border px-3 py-1.5 text-xs font-medium transition-colors hover:opacity-80"
            style={{
              borderColor: 'var(--border)',
              color: 'var(--text-muted)',
              background: 'var(--bg-surface)',
            }}
            aria-label="Fill form with demo resume data"
          >
            Fill Demo Resume
          </button>
        </div>
        <ResumeForm />
      </div>

      <div className="builder-preview w-full lg:sticky lg:top-0 lg:max-h-[calc(100vh-120px)] lg:w-[50%] lg:overflow-y-auto">
        <div className="space-y-4 p-4">
          <div className="no-print mb-2" data-no-print>
            <AICoachPanel />
          </div>
          <div className="flex flex-wrap gap-2 no-print" data-no-print>
            <button
              type="button"
              onClick={printResume}
              className="min-h-[44px] flex-1 rounded-md px-4 py-2 text-sm font-medium text-white"
              style={{ background: 'var(--accent-navy)' }}
            >
              Print
            </button>
            <button
              type="button"
              onClick={() => downloadPDF()}
              className="min-h-[44px] flex-1 rounded-md px-4 py-2 text-sm font-medium text-white"
              style={{ background: 'var(--accent-red)' }}
            >
              Download PDF
            </button>
            <button
              type="button"
              onClick={handleShare}
              disabled={shareState === 'creating'}
              className="min-h-[44px] flex-1 rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
              style={{ background: 'var(--accent-teal, #0f766e)' }}
              aria-label="Create a shareable, editable link for this resume"
            >
              {shareState === 'creating' ? 'Creating…' : 'Share / Edit Link'}
            </button>
          </div>
          {shareState === 'ready' && (
            <div
              className="rounded-md border p-3 text-sm no-print"
              style={{ borderColor: 'var(--border)', background: 'var(--bg-surface)' }}
              data-no-print
            >
              <p className="mb-1 font-semibold">Your editable link</p>
              <p
                className="break-all rounded px-2 py-1 text-xs"
                style={{ background: 'var(--bg-primary)', color: 'var(--text-secondary)' }}
              >
                {shareUrl}
              </p>
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={copyShare}
                  className="rounded-md border px-3 py-1 text-xs font-medium"
                  style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                >
                  {copied ? 'Copied!' : 'Copy link'}
                </button>
                <a
                  href={shareUrl}
                  className="rounded-md border px-3 py-1 text-xs font-medium"
                  style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                >
                  Open
                </a>
              </div>
              <p className="mt-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                Anyone with this link can view, edit, and download the resume.
                Edits auto-save.
              </p>
            </div>
          )}
          {shareState === 'error' && (
            <div
              className="rounded-md border p-3 text-sm no-print"
              style={{ borderColor: 'var(--accent-red)', color: 'var(--accent-red)' }}
              data-no-print
            >
              Could not create share link: {shareErr}
            </div>
          )}
          <LivePreview />
        </div>
      </div>
    </div>
  );
}
