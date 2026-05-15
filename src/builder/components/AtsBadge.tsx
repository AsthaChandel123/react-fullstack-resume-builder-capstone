import { useMemo, useState } from 'react';
import { useResumeStore } from '@/store/resumeStore';
import { computeAtsScore } from '../ats/atsScore';

/**
 * Live ATS score pill. Recomputes on every resume change via Zustand
 * subscription. Hover / focus reveals the breakdown + "missing for 90+" tips.
 */
export function AtsBadge() {
  const resume = useResumeStore((s) => s.resume);
  const [open, setOpen] = useState(false);

  const result = useMemo(() => computeAtsScore(resume), [resume]);

  const score = Math.round(result.score);
  const color =
    score >= 90 ? '#16a34a' : score >= 75 ? '#0ea5e9' : score >= 60 ? '#f59e0b' : '#dc2626';

  return (
    <div className="relative inline-block no-print" data-no-print>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        className="inline-flex min-h-[32px] items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition"
        style={{
          borderColor: color,
          color,
          background: color + '15',
        }}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={`ATS score ${score} out of 100`}
      >
        <span
          className="inline-block h-1.5 w-1.5 rounded-full"
          style={{ background: color }}
          aria-hidden="true"
        />
        ATS {score} / 100
      </button>
      {open && (
        <div
          role="dialog"
          aria-label="ATS score breakdown"
          className="absolute right-0 top-full z-30 mt-2 w-72 rounded-md border p-3 text-xs shadow-lg"
          style={{
            borderColor: 'var(--border)',
            background: 'var(--bg-surface)',
            color: 'var(--text-primary)',
          }}
        >
          <p className="mb-1 font-semibold">Generic Software Engineer / Data Analyst JD</p>
          <ul className="mb-2 space-y-0.5" style={{ color: 'var(--text-secondary)' }}>
            <li>Skills match: {Math.round(result.breakdown.skills * 100)}%</li>
            <li>Experience: {Math.round(result.breakdown.experience * 100)}%</li>
            <li>Education: {Math.round(result.breakdown.education * 100)}%</li>
            <li>Projects: {Math.round(result.breakdown.projects * 100)}%</li>
            <li>Completeness: {Math.round(result.breakdown.completeness * 100)}%</li>
          </ul>
          {result.matchedSkills.length > 0 && (
            <p className="mb-1">
              <strong>Matched skills ({result.matchedSkills.length}):</strong>{' '}
              <span style={{ color: 'var(--text-muted)' }}>
                {result.matchedSkills.slice(0, 12).join(', ')}
                {result.matchedSkills.length > 12 ? '…' : ''}
              </span>
            </p>
          )}
          {result.missingForNinety.length > 0 && score < 90 && (
            <div>
              <p className="mt-1 font-semibold">To reach 90+:</p>
              <ul className="list-disc pl-4" style={{ color: 'var(--text-secondary)' }}>
                {result.missingForNinety.slice(0, 4).map((m, i) => (
                  <li key={i}>{m}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
