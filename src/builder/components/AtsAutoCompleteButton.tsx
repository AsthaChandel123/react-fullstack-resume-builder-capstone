import { useMemo, useState } from 'react';
import { useResumeStore } from '@/store/resumeStore';
import { autoCompleteResume } from '../ats/autoComplete';
import { computeAtsScore } from '../ats/atsScore';

/**
 * "Optimize for ATS (no fake data)" button + diff modal.
 *
 * Clicking the button runs `autoCompleteResume` against the current store
 * state and opens a modal showing:
 *  - the new ATS score before/after,
 *  - the structural placeholders that will be inserted,
 *  - the list of reformatting changes.
 * The user can accept (commit to store) or cancel.
 */
export function AtsAutoCompleteButton() {
  const resume = useResumeStore((s) => s.resume);
  const setResume = useResumeStore((s) => s.setResume);
  const [open, setOpen] = useState(false);

  const preview = useMemo(() => {
    if (!open) return null;
    const before = computeAtsScore(resume);
    const ac = autoCompleteResume(resume);
    const after = computeAtsScore(ac.resume);
    return { ...ac, beforeScore: before.score, afterScore: after.score };
  }, [open, resume]);

  function commit() {
    if (!preview) return;
    setResume(preview.resume);
    setOpen(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="min-h-[36px] rounded-md border px-3 py-1.5 text-xs font-medium transition-colors hover:opacity-80"
        style={{
          borderColor: 'var(--accent-teal, #0f766e)',
          color: 'var(--accent-teal, #0f766e)',
          background: 'transparent',
        }}
        aria-label="Optimize the resume for ATS without inventing any data"
      >
        Optimize for ATS (no fake data)
      </button>

      {open && preview && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="ATS optimization preview"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 no-print"
          style={{ background: 'rgba(0,0,0,0.45)' }}
          data-no-print
        >
          <div
            className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-lg border p-5"
            style={{
              background: 'var(--bg-surface)',
              borderColor: 'var(--border)',
              color: 'var(--text-primary)',
            }}
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-semibold">ATS Optimization Preview</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded p-1 text-sm"
                aria-label="Close"
                style={{ color: 'var(--text-muted)' }}
              >
                ✕
              </button>
            </div>

            <div className="mb-3 flex items-center gap-2 text-sm">
              <span className="rounded px-2 py-0.5" style={{ background: 'var(--bg-primary)' }}>
                Before: <strong>{Math.round(preview.beforeScore)}</strong>
              </span>
              <span aria-hidden="true">→</span>
              <span
                className="rounded px-2 py-0.5 font-semibold"
                style={{
                  background:
                    preview.afterScore >= 90 ? '#16a34a25' : '#f59e0b25',
                  color: preview.afterScore >= 90 ? '#16a34a' : '#b45309',
                }}
              >
                After: <strong>{Math.round(preview.afterScore)}</strong>
              </span>
            </div>

            <p
              className="mb-2 text-xs"
              style={{ color: 'var(--text-secondary)' }}
            >
              We will reformat your resume for ATS friendliness. We never
              invent companies, roles, dates, or achievements. Missing
              required sections get a single <code>[EDIT: …]</code>{' '}
              placeholder so you know what to fill in.
            </p>

            {preview.changes.length > 0 && (
              <div className="mb-3">
                <p className="mb-1 text-xs font-semibold">Changes:</p>
                <ul
                  className="list-disc pl-5 text-xs"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {preview.changes.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              </div>
            )}

            {preview.placeholders.length > 0 && (
              <div className="mb-3">
                <p className="mb-1 text-xs font-semibold" style={{ color: '#b45309' }}>
                  Placeholders inserted (please edit before sharing):
                </p>
                <ul
                  className="list-disc pl-5 text-xs"
                  style={{ color: '#b45309' }}
                >
                  {preview.placeholders.map((p, i) => (
                    <li key={i}>{p}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="min-h-[36px] rounded-md border px-3 py-1.5 text-xs"
                style={{
                  borderColor: 'var(--border)',
                  color: 'var(--text-primary)',
                  background: 'transparent',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={commit}
                className="min-h-[36px] rounded-md px-3 py-1.5 text-xs font-medium text-white"
                style={{ background: 'var(--accent-teal, #0f766e)' }}
              >
                Apply changes
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
