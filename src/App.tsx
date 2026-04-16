import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { lazy, Suspense, useEffect } from 'react';
import { Layout } from './layout/Layout';
import { Landing } from './pages/Landing';
const BuilderLegacy = lazy(() =>
  import('./pages/Builder').then((m) => ({ default: m.Builder })),
);
const PrintPreview = lazy(() =>
  import('./pages/PrintPreview').then((m) => ({ default: m.PrintPreview })),
);

const Employer = lazy(() =>
  import('./pages/Employer').then((m) => ({ default: m.Employer })),
);
const CandidateDetail = lazy(() =>
  import('./pages/CandidateDetail').then((m) => ({
    default: m.CandidateDetail,
  })),
);
const PitchDeck = lazy(() =>
  import('./pages/PitchDeck').then((m) => ({ default: m.PitchDeck })),
);
const CapstoneReport = lazy(() =>
  import('./pages/CapstoneReport').then((m) => ({ default: m.CapstoneReport })),
);
const EmployerPublish = lazy(() => import('./pages/EmployerPublish'));
const EmployerMatches = lazy(() => import('./pages/EmployerMatches'));
const EmployerCriteria = lazy(() => import('./pages/EmployerCriteria'));
const BridgeLanding = lazy(() => import('./pages/BridgeLanding'));
const BridgeTest = lazy(() => import('./pages/BridgeTest'));
const BridgeScorecard = lazy(() => import('./pages/BridgeScorecard'));
const BridgeDashboard = lazy(() => import('./pages/BridgeDashboard'));
const SaathiBuilder = lazy(() =>
  import('./pages/SaathiBuilder').then((m) => ({ default: m.SaathiBuilder })),
);
const CandidateDashboard = lazy(() =>
  import('./pages/CandidateDashboard').then((m) => ({ default: m.CandidateDashboard })),
);
const SharedResume = lazy(() => import('./pages/SharedResume'));

function Loading() {
  return (
    <div
      className="flex min-h-[60vh] items-center justify-center"
      role="status"
      aria-label="Loading"
    >
      <div
        className="animate-pulse text-lg"
        style={{ color: 'var(--text-muted)' }}
      >
        Loading...
      </div>
    </div>
  );
}

export function App() {
  // Background model download — never blocks the app.
  // Capability-gated: only tier-2+ devices attempt the 1.5GB Gemma fetch.
  // The actual model-ready flag is owned by webllm.ts via webllmStatus —
  // App.tsx must NOT claim readiness before the model finishes loading.
  useEffect(() => {
    localStorage.setItem('resumeai_ai_level', 'L2'); // baseline always available

    let cancelled = false;
    (async () => {
      const { detectCapabilities } = await import('./ai/models/capabilities');
      const caps = await detectCapabilities();
      if (cancelled) return;
      if (!caps.canRunL3) return; // tier-0/1 device — skip the heavy preload
      if (!caps.isOnline) return; // offline — can't download

      const { isModelReady } = await import('./ai/models/webllmStatus');
      if (isModelReady()) {
        localStorage.setItem('resumeai_ai_level', 'L3');
        return;
      }

      const { preloadModel } = await import('./ai/models/webllm');
      preloadModel((report) => {
        if (report.progress >= 1 && !cancelled) {
          localStorage.setItem('resumeai_ai_level', 'L3');
        }
      }).catch(() => {
        // Model download failed silently. L2 remains active.
      });
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <BrowserRouter>
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Landing />} />
            <Route path="builder" element={<SaathiBuilder />} />
            <Route path="builder/form" element={<BuilderLegacy />} />
            <Route path="builder/dashboard" element={<CandidateDashboard />} />
            <Route path="builder/preview" element={<PrintPreview />} />
            <Route path="employer" element={<Employer />} />
            <Route path="employer/publish" element={<EmployerPublish />} />
            <Route path="employer/matches" element={<EmployerMatches />} />
            <Route path="employer/criteria" element={<EmployerCriteria />} />
            <Route path="employer/:id" element={<CandidateDetail />} />
            <Route path="bridge/dashboard" element={<BridgeDashboard />} />
            <Route path="bridge/:code" element={<BridgeLanding />} />
            <Route path="bridge/:code/test" element={<BridgeTest />} />
            <Route path="bridge/:code/scorecard" element={<BridgeScorecard />} />
            <Route path="r/:slug" element={<SharedResume />} />
          </Route>
          <Route path="pitch" element={<PitchDeck />} />
          <Route path="capstone-report" element={<CapstoneReport />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
