/**
 * Model Download Screen
 *
 * Full-screen overlay shown on first load when Gemma 4 E2B
 * has not been downloaded yet. Shows progress bar, percentage,
 * and status text. Dismisses automatically when download completes.
 *
 * Users can skip with "Use basic AI for now" to fall back to L2.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { preloadModel } from './models/webllm';

interface ModelDownloadScreenProps {
  onReady: () => void;
  onSkip: () => void;
}

export function ModelDownloadScreen({ onReady, onSkip }: ModelDownloadScreenProps) {
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('Initializing WebGPU pipeline...');
  const [error, setError] = useState<string | null>(null);
  const startedRef = useRef(false);

  const handleProgress = useCallback((report: { progress: number; text: string }) => {
    setProgress(report.progress);
    setStatusText(report.text);
  }, []);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    preloadModel(handleProgress)
      .then(() => {
        setProgress(1);
        setStatusText('Gemma 4 E2B ready.');
        // Brief delay so user sees 100% before dismissing
        setTimeout(onReady, 600);
      })
      .catch((err) => {
        setError(String(err));
        setStatusText('Download failed. You can retry or use basic AI.');
      });
  }, [handleProgress, onReady]);

  const pct = Math.min(100, Math.max(0, Math.round(progress * 100)));

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{ backgroundColor: 'var(--bg-primary, #0a0a1a)' }}
      role="dialog"
      aria-modal="true"
      aria-label="Downloading AI model"
    >
      <div className="w-full max-w-md px-6 text-center">
        {/* Title */}
        <h1
          className="mb-2 text-2xl font-bold"
          style={{ color: 'var(--text-primary, #fff)' }}
        >
          Downloading AI Models...
        </h1>

        <p
          className="mb-8 text-sm"
          style={{ color: 'var(--text-muted, #888)' }}
        >
          This is a one-time download (~1.5GB). The model runs entirely in your browser.
        </p>

        {/* Progress bar */}
        <div
          className="mb-3 h-3 w-full overflow-hidden rounded-full"
          style={{ backgroundColor: 'var(--bg-secondary, #1a1a2e)' }}
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Download progress: ${pct}%`}
        >
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${pct}%`,
              backgroundColor: 'var(--accent-red, #e63946)',
              minWidth: progress > 0 ? '12px' : '0',
            }}
          />
        </div>

        {/* Percentage */}
        <p
          className="mb-1 text-xl font-bold tabular-nums"
          style={{ color: 'var(--text-primary, #fff)' }}
        >
          {pct}%
        </p>

        {/* Status text */}
        <p
          className="mb-8 text-sm"
          style={{ color: 'var(--text-muted, #888)' }}
        >
          {statusText}
        </p>

        {/* Error state */}
        {error && (
          <p
            className="mb-4 text-sm"
            style={{ color: 'var(--accent-red, #e63946)' }}
          >
            {error}
          </p>
        )}

        {/* Skip link */}
        <button
          type="button"
          onClick={onSkip}
          className="min-h-[44px] min-w-[44px] cursor-pointer border-none bg-transparent text-sm underline"
          style={{ color: 'var(--text-muted, #888)' }}
          aria-label="Skip model download and use basic AI analysis"
        >
          Use basic AI for now
        </button>
      </div>
    </div>
  );
}
