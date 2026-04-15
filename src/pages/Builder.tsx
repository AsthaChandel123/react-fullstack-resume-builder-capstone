import { useState } from 'react';
import { ResumeForm } from '@/builder/components/ResumeForm';
import { LivePreview } from '@/builder/components/LivePreview';
import { AICoachPanel } from '@/builder/components/AICoachPanel';
import { downloadPDF } from '@/utils/pdf';
import { printResume } from '@/utils/print';
import { fillDemoResume } from '@/utils/demoData';
import { useResumeStore } from '@/store/resumeStore';
import { createSharedResume, buildShareUrl } from '@/firebase/resumeShare';
import { isFirebaseConfigured } from '@/firebase/config';

export function Builder() {
  const resume = useResumeStore((s) => s.resume);
  const [showDialog, setShowDialog] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [shareState, setShareState] = useState<'idle' | 'creating' | 'ready' | 'error'>('idle');
  const [shareUrl, setShareUrl] = useState('');
  const [shareSlug, setShareSlug] = useState('');
  const [shareErr, setShareErr] = useState('');
  const [copied, setCopied] = useState(false);

  function openDialog() {
    if (!isFirebaseConfigured()) {
      setShareState('error');
      setShareErr('Firebase not configured.');
      return;
    }
    setPassword('');
    setConfirm('');
    setShareErr('');
    setShareState('idle');
    setShowDialog(true);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setShareErr('Passwords do not match.');
      return;
    }
    if (password.length > 0 && password.length < 4) {
      setShareErr('Password must be at least 4 characters (or leave blank for no password).');
      return;
    }
    setShareState('creating');
    setShareErr('');
    try {
      const { slug } = await createSharedResume(resume, password);
      const url = buildShareUrl(slug);
      setShareSlug(slug);
      setShareUrl(url);
      setShareState('ready');
      // Store the password in sessionStorage so the editor page can unlock
      // automatically for the creator.
      if (password.length > 0) {
        sessionStorage.setItem(`resume-pw:${slug}`, password);
      }
    } catch (err) {
      setShareState('error');
      setShareErr(err instanceof Error ? err.message : String(err));
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
              onClick={openDialog}
              disabled={shareState === 'creating'}
              className="min-h-[44px] flex-1 rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
              style={{ background: 'var(--accent-teal, #0f766e)' }}
              aria-label="Create a shareable link with optional edit password"
            >
              {shareState === 'creating' ? 'Creating…' : 'Share / Edit Link'}
            </button>
          </div>

          {showDialog && shareState !== 'ready' && (
            <form
              onSubmit={handleCreate}
              className="space-y-3 rounded-md border p-3 text-sm no-print"
              style={{ borderColor: 'var(--border)', background: 'var(--bg-surface)' }}
              data-no-print
            >
              <p className="font-semibold">Create a shareable link</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Anyone with the link can <strong>view</strong> the resume.
                Set a password if you want editing to require it. Leave both
                fields empty for an open-editable link.
              </p>
              <label className="block">
                <span className="mb-1 block text-xs font-medium">
                  Edit password (optional)
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Leave blank for no password"
                  className="min-h-[40px] w-full rounded-md border px-3 py-2 text-sm"
                  style={{
                    borderColor: 'var(--border)',
                    background: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                  }}
                  autoComplete="new-password"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium">
                  Confirm password
                </span>
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Re-enter password"
                  className="min-h-[40px] w-full rounded-md border px-3 py-2 text-sm"
                  style={{
                    borderColor: 'var(--border)',
                    background: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                  }}
                  autoComplete="new-password"
                />
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="submit"
                  disabled={shareState === 'creating'}
                  className="min-h-[40px] flex-1 rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                  style={{ background: 'var(--accent-teal, #0f766e)' }}
                >
                  {shareState === 'creating' ? 'Creating…' : 'Create link'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowDialog(false);
                    setShareState('idle');
                  }}
                  className="min-h-[40px] rounded-md border px-3 py-2 text-sm"
                  style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                >
                  Cancel
                </button>
              </div>
              {shareErr && (
                <p className="text-xs" style={{ color: 'var(--accent-red)' }}>
                  {shareErr}
                </p>
              )}
            </form>
          )}

          {shareState === 'ready' && (
            <div
              className="rounded-md border p-3 text-sm no-print"
              style={{ borderColor: 'var(--border)', background: 'var(--bg-surface)' }}
              data-no-print
            >
              <p className="mb-1 font-semibold">Your shareable link</p>
              <p
                className="break-all rounded px-2 py-1 text-xs"
                style={{ background: 'var(--bg-primary)', color: 'var(--text-secondary)' }}
              >
                {shareUrl}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
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
                <button
                  type="button"
                  onClick={() => {
                    setShowDialog(false);
                    setShareState('idle');
                  }}
                  className="rounded-md border px-3 py-1 text-xs font-medium"
                  style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                >
                  Done
                </button>
              </div>
              <p className="mt-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                {password.length > 0
                  ? 'Anyone with this link can view the resume. Editing requires your password.'
                  : 'Anyone with this link can view, edit, and download the resume.'}{' '}
                Slug: <code>{shareSlug}</code>
              </p>
            </div>
          )}

          {!showDialog && shareState === 'error' && (
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
