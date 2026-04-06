import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { lazy, Suspense, useState, useEffect } from 'react';
import { Layout } from './layout/Layout';
import { Landing } from './pages/Landing';
const BuilderLegacy = lazy(() =>
  import('./pages/Builder').then((m) => ({ default: m.Builder })),
);
import { PrintPreview } from './pages/PrintPreview';
import { ModelDownloadScreen } from './ai/ModelDownloadScreen';
import { isModelReady, preloadModel } from './ai/models/webllm';

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

async function hasWebGPU(): Promise<boolean> {
  try {
    if (typeof navigator === 'undefined' || !('gpu' in navigator)) return false;
    const gpu = (navigator as { gpu?: { requestAdapter(): Promise<unknown> } }).gpu;
    if (!gpu) return false;
    const adapter = await gpu.requestAdapter();
    return adapter !== null;
  } catch {
    return false;
  }
}

export function App() {
  const [modelState, setModelState] = useState<'checking' | 'downloading' | 'ready'>(() => {
    if (localStorage.getItem('resumeai_ai_ready') === '1') return 'ready';
    return 'checking';
  });

  useEffect(() => {
    if (modelState !== 'checking') return;

    // Already loaded from a previous session
    if (isModelReady()) {
      localStorage.setItem('resumeai_ai_ready', '1');
      localStorage.setItem('resumeai_ai_level', 'L3');
      setModelState('ready');
      return;
    }

    // Detect WebGPU: if available, show download screen for Gemma 4
    // If not, skip straight to the app - Gemini API handles reasoning
    hasWebGPU().then((gpu) => {
      if (gpu) {
        // WebGPU available - show download screen for local Gemma 4
        setModelState('downloading');
      } else {
        // No WebGPU - use Gemini API for L4, skip download entirely
        localStorage.setItem('resumeai_ai_ready', '1');
        localStorage.setItem('resumeai_ai_level', 'L2');
        setModelState('ready');
        // Try downloading in background silently (for WASM fallback)
        preloadModel().catch(() => {});
      }
    });
  }, [modelState]);

  if (modelState === 'checking') {
    return <Loading />;
  }

  if (modelState === 'downloading') {
    return (
      <ModelDownloadScreen
        onReady={(level) => {
          localStorage.setItem('resumeai_ai_ready', '1');
          localStorage.setItem('resumeai_ai_level', level);
          setModelState('ready');
        }}
      />
    );
  }

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
          </Route>
          <Route path="pitch" element={<PitchDeck />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
