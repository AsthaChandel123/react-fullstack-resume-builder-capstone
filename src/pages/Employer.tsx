import { useEffect, useCallback, useState } from 'react';
import { useEmployerStore } from '../store/employerStore';
import { JDInput } from '../employer/components/JDInput';
import { ResumeUploader } from '../employer/components/ResumeUploader';
import { CandidateTable } from '../employer/components/CandidateTable';
import { analyzeResume } from '../ai/pipeline';

export function Employer() {
  const { job, loaded, load, updateCandidate } = useEmployerStore();
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });

  useEffect(() => {
    if (!loaded) load();
  }, [loaded, load]);

  const analyzeAll = useCallback(async () => {
    if (!job) return;
    const pending = job.candidates.filter((c) => c.analysisStatus === 'pending');
    if (pending.length === 0) return;

    setAnalyzing(true);
    setProgress({ done: 0, total: pending.length });

    const jdText = job.description;
    const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY ?? '';

    for (const c of pending) {
      // Mark as in-progress
      updateCandidate(c.id, { analysisStatus: 'l1' });

      try {
        const result = await analyzeResume(
          c.id,
          c.resumeText,
          jdText,
          { geminiApiKey },
          (prog) => {
            // Update analysis layer as pipeline progresses
            updateCandidate(c.id, {
              analysisStatus: prog.layer === 'done' ? 'done' : prog.layer.toLowerCase() as 'l1' | 'l2' | 'l3',
              analysisLayers: prog.pipelineLevel
                ? [prog.pipelineLevel]
                : (c.analysisLayers ?? []),
            });
          },
        );

        updateCandidate(c.id, {
          scores: result.scores,
          redFlags: result.redFlags,
          analysisStatus: 'done',
          analysisLayers: result.scores.parseability ? ['L1', 'L2', result.redFlags.length > 0 ? 'L3' : 'L2'] : ['L1'],
        });
      } catch (err) {
        updateCandidate(c.id, {
          analysisStatus: 'error',
          analysisLayers: ['L1'],
        });
      }

      setProgress((prev) => ({ ...prev, done: prev.done + 1 }));
    }

    setAnalyzing(false);
  }, [job, updateCandidate]);

  if (!loaded) {
    return (
      <main id="main-content" className="flex min-h-[60vh] items-center justify-center">
        <p className="animate-pulse" style={{ color: 'var(--text-muted)' }}>
          Loading...
        </p>
      </main>
    );
  }

  return (
    <main id="main-content" className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
        Employer Dashboard
      </h1>

      <JDInput />
      <ResumeUploader />

      {job && job.candidates.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
              Candidates ({job.candidates.length})
            </h2>
            <div className="flex items-center gap-3">
              {analyzing && (
                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  Analyzing {progress.done}/{progress.total}...
                </span>
              )}
              <button
                onClick={analyzeAll}
                disabled={analyzing || !job.candidates.some((c) => c.analysisStatus === 'pending')}
                className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50"
                aria-label="Analyze all pending candidates"
              >
                {analyzing ? `Analyzing ${progress.done}/${progress.total}` : 'Analyze All'}
              </button>
            </div>
          </div>

          <CandidateTable />
        </div>
      )}

      <footer
        className="pt-4 text-center text-sm"
        style={{ color: 'var(--text-muted)' }}
      >
        Powered by ResumeAI - Astha Chandel
      </footer>
    </main>
  );
}
