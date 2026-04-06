import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEmployerStore } from '../store/employerStore';
import { KeywordAnalysis } from '../employer/components/KeywordAnalysis';
import { RedFlagPanel } from '../employer/components/RedFlagPanel';
import { ScoreBreakdown } from '../employer/components/ScoreBreakdown';
import { ScoreBadge } from '../employer/components/ScoreBadge';

export function CandidateDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { job, loaded, load } = useEmployerStore();

  useEffect(() => {
    if (!loaded) load();
  }, [loaded, load]);

  if (!loaded) {
    return (
      <div
        className="flex min-h-[60vh] items-center justify-center"
        role="status"
        aria-label="Loading candidate details"
      >
        <p style={{ color: 'var(--text-muted)' }}>Loading...</p>
      </div>
    );
  }

  const candidate = job?.candidates.find((c) => c.id === id);

  if (!candidate || !job) {
    return (
      <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
        <button
          type="button"
          className="min-h-[44px] min-w-[44px] rounded-md px-4 py-2 text-sm font-medium text-white"
          style={{ backgroundColor: 'var(--accent-navy)' }}
          onClick={() => navigate('/employer')}
          aria-label="Back to employer dashboard"
        >
          Back to Dashboard
        </button>
        <p
          className="mt-8 text-center text-lg"
          style={{ color: 'var(--text-muted)' }}
        >
          Candidate not found.
        </p>
      </div>
    );
  }

  return (
    <div
      className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8"
      style={{ color: 'var(--text-primary)' }}
    >
      <header className="flex flex-wrap items-center gap-4">
        <button
          type="button"
          className="min-h-[44px] min-w-[44px] rounded-md px-4 py-2 text-sm font-medium text-white"
          style={{ backgroundColor: 'var(--accent-navy)' }}
          onClick={() => navigate('/employer')}
          aria-label="Back to employer dashboard"
        >
          Back
        </button>
        <div className="flex-1">
          <h1
            className="text-2xl font-bold"
            style={{ color: 'var(--accent-navy)' }}
          >
            {candidate.name}
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Status: {candidate.analysisStatus}
          </p>
        </div>
        <ScoreBadge score={candidate.scores.overall} label="Overall ATS Score" />
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        <KeywordAnalysis
          scores={candidate.scores}
          requirements={job.extractedRequirements}
        />
        <RedFlagPanel flags={candidate.redFlags} />
        <ScoreBreakdown scores={candidate.scores} />
      </div>

      {candidate.coachSuggestions && candidate.coachSuggestions.length > 0 && (
        <section className="mt-6">
          <h3
            className="mb-3 text-lg font-bold"
            style={{ color: 'var(--accent-navy)' }}
          >
            Coach Suggestions
          </h3>
          <div className="space-y-3">
            {candidate.coachSuggestions.map((suggestion, i) => (
              <div
                key={i}
                className="rounded-lg p-4"
                style={{
                  background:
                    suggestion.severity === 'high'
                      ? 'rgba(228,26,26,0.08)'
                      : suggestion.severity === 'medium'
                        ? 'rgba(255,220,0,0.08)'
                        : 'rgba(46,204,64,0.08)',
                  border: `1px solid ${
                    suggestion.severity === 'high'
                      ? 'var(--accent-red)'
                      : suggestion.severity === 'medium'
                        ? 'var(--accent-gold)'
                        : '#2ecc40'
                  }20`,
                }}
              >
                <div className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                  {suggestion.title}
                </div>
                <p className="mt-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
                  {suggestion.description}
                </p>
                {suggestion.fix && (
                  <p className="mt-1 text-xs italic" style={{ color: 'var(--text-muted)' }}>
                    Fix: {suggestion.fix}
                  </p>
                )}
                {suggestion.citation && (
                  <p className="mt-1 text-xs italic" style={{ color: 'var(--text-muted)' }}>
                    {suggestion.citation}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      <section
        className="rounded-lg p-4"
        style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border)',
        }}
        aria-labelledby="resume-text-heading"
      >
        <h3
          id="resume-text-heading"
          className="mb-3 text-base font-bold"
          style={{ color: 'var(--accent-navy)' }}
        >
          Full Resume
        </h3>
        <pre
          className="max-h-[600px] overflow-auto whitespace-pre-wrap text-sm"
          style={{
            color: 'var(--text-primary)',
            backgroundColor: 'var(--bg-primary)',
            padding: '1rem',
            borderRadius: '0.5rem',
            border: '1px solid var(--border)',
          }}
        >
          {candidate.resumeText || 'No resume text available.'}
        </pre>
      </section>

      <footer
        className="pt-4 text-center text-xs"
        style={{ color: 'var(--text-muted)' }}
      >
        Powered by ResumeAI - Astha Chandel
      </footer>
    </div>
  );
}
