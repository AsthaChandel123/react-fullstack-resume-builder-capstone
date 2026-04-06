import { useEffect, useCallback, useState } from 'react';
import { useEmployerStore } from '../store/employerStore';
import { JDInput } from '../employer/components/JDInput';
import { ResumeUploader } from '../employer/components/ResumeUploader';
import { CandidateTable } from '../employer/components/CandidateTable';
import { analyzeResumeAgentic } from '../ai/orchestrator';
import type { AgentTrace } from '../ai/orchestrator';

export function Employer() {
  const { job, loaded, load, updateCandidate } = useEmployerStore();
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [traces, setTraces] = useState<AgentTrace[]>([]);

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
      updateCandidate(c.id, { analysisStatus: 'l1' });

      try {
        const result = await analyzeResumeAgentic(
          c.id,
          c.resumeText,
          jdText,
          { geminiApiKey, enableCoach: true },
          (prog) => {
            // Map orchestrator layers to valid analysisStatus values
            const layerMap: Record<string, 'l1' | 'l2' | 'l3' | 'done' | 'error'> = {
              L1: 'l1', L2: 'l2', L3: 'l3', L4: 'l3',
              jd: 'l1', skills: 'l2', score: 'l3', coach: 'l3',
              done: 'done', error: 'error',
            };
            const status = layerMap[prog.layer] ?? 'l1';
            updateCandidate(c.id, {
              analysisStatus: status,
              analysisLayers: prog.pipelineLevel
                ? [prog.pipelineLevel]
                : (c.analysisLayers ?? []),
            });
            if (prog.traces.length > 0) setTraces(prog.traces);
          },
        );

        localStorage.setItem('resumeai_ai_level', result.pipelineLevel);
        setTraces(result.traces);

        updateCandidate(c.id, {
          scores: result.scores,
          redFlags: result.redFlags,
          coachSuggestions: result.coachSuggestions ?? undefined,
          analysisStatus: 'done',
          analysisLayers: [result.pipelineLevel],
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

      {/* Agent Trace Panel -- shows how AI analyzed resumes */}
      {traces.length > 0 && (
        <details className="rounded-lg border p-4" style={{ borderColor: 'var(--border)', background: 'var(--bg-surface)' }}>
          <summary
            className="cursor-pointer text-sm font-semibold"
            style={{ color: 'var(--text-primary)' }}
          >
            Agent Trace ({traces.filter((t) => t.status === 'success').length}/{traces.length} agents)
          </summary>
          <div className="mt-3 space-y-2">
            {traces.map((trace) => (
              <div
                key={trace.agentId}
                className="rounded-md px-3 py-2 text-xs"
                style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)' }}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                    {trace.agentName}
                  </span>
                  <span
                    className="rounded-full px-2 py-0.5 text-xs font-bold"
                    style={{
                      background: trace.status === 'success' ? 'rgba(34,197,94,0.15)'
                        : trace.status === 'failed' ? 'rgba(239,68,68,0.15)'
                        : trace.status === 'skipped' ? 'rgba(156,163,175,0.15)'
                        : 'rgba(234,179,8,0.15)',
                      color: trace.status === 'success' ? '#22c55e'
                        : trace.status === 'failed' ? '#ef4444'
                        : trace.status === 'skipped' ? '#9ca3af'
                        : '#eab308',
                    }}
                  >
                    {trace.status}
                    {trace.endTime ? ` ${Math.round(trace.endTime - trace.startTime)}ms` : ''}
                  </span>
                </div>
                {trace.steps.length > 0 && (
                  <div className="mt-1" style={{ color: 'var(--text-muted)' }}>
                    {trace.steps[trace.steps.length - 1].observation}
                  </div>
                )}
                {trace.error && (
                  <div className="mt-1" style={{ color: '#ef4444' }}>
                    {trace.error}
                  </div>
                )}
              </div>
            ))}
          </div>
        </details>
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
