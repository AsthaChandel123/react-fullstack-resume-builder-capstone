/**
 * Model Download Screen
 *
 * Tries to load Gemma 4 E2B. If it succeeds, shows "Gemma 4 loaded".
 * If it fails (no WebGPU, unsupported ops), auto-falls back to L2
 * after a brief message. No manual skip needed.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { preloadModel } from './models/webllm';

interface ModelDownloadScreenProps {
  onReady: (level: 'L3' | 'L2') => void;
}

export function ModelDownloadScreen({ onReady }: ModelDownloadScreenProps) {
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('Detecting hardware capabilities...');
  const [level, setLevel] = useState<'loading' | 'L3' | 'L2'>('loading');
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
        setLevel('L3');
        setStatusText('Gemma 4 E2B loaded. Full AI ready.');
        setTimeout(() => onReady('L3'), 800);
      })
      .catch(() => {
        // Auto-fallback to L2. No blocking, no manual action needed.
        setLevel('L2');
        setStatusText('Using TF-IDF analysis. Works great for scoring.');
        setTimeout(() => onReady('L2'), 1500);
      });
  }, [handleProgress, onReady]);

  const pct = Math.min(100, Math.max(0, Math.round(progress * 100)));

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{ backgroundColor: 'var(--bg-primary, #0a0a1a)' }}
      role="dialog"
      aria-modal="true"
      aria-label="Loading AI"
    >
      <div className="w-full max-w-md px-6 text-center">
        <h1
          className="mb-2 text-2xl font-bold"
          style={{ color: 'var(--text-primary, #fff)' }}
        >
          {level === 'loading' ? 'Loading AI...' : level === 'L3' ? 'Gemma 4 Ready' : 'AI Ready'}
        </h1>

        <p
          className="mb-8 text-sm"
          style={{ color: 'var(--text-muted, #888)' }}
        >
          {level === 'loading'
            ? 'One-time setup. The model runs entirely in your browser.'
            : level === 'L3'
              ? 'Full AI reasoning with Gemma 4 E2B.'
              : 'Running with fast TF-IDF analysis.'}
        </p>

        {/* Progress bar */}
        <div
          className="mb-3 h-3 w-full overflow-hidden rounded-full"
          style={{ backgroundColor: 'var(--bg-secondary, #1a1a2e)' }}
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${level === 'L2' ? 100 : pct}%`,
              backgroundColor: level === 'L3' ? '#22c55e' : level === 'L2' ? '#eab308' : '#e63946',
              minWidth: progress > 0 || level === 'L2' ? '12px' : '0',
            }}
          />
        </div>

        {/* Status indicator */}
        <div className="mb-2 flex items-center justify-center gap-2">
          {level !== 'loading' && (
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: level === 'L3' ? '#22c55e' : '#eab308' }}
            />
          )}
          <p
            className="text-sm font-medium"
            style={{ color: level === 'L3' ? '#22c55e' : level === 'L2' ? '#eab308' : 'var(--text-muted, #888)' }}
          >
            {level === 'L3' ? 'Gemma 4 E2B loaded' : level === 'L2' ? 'Level 2 loaded' : `${pct}%`}
          </p>
        </div>

        <p
          className="text-xs"
          style={{ color: 'var(--text-muted, #666)' }}
        >
          {statusText}
        </p>
      </div>
    </div>
  );
}
