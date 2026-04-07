import { useState, useEffect, useCallback, useRef, type ReactNode } from 'react';

interface PitchNavProps {
  children: ReactNode[];
}

export function PitchNav({ children }: PitchNavProps) {
  const [current, setCurrent] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [navVisible, setNavVisible] = useState(true);
  const [showHint, setShowHint] = useState(true);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const total = children.length;

  const go = useCallback(
    (dir: 1 | -1) => {
      setCurrent((i) => Math.max(0, Math.min(total - 1, i + dir)));
    },
    [total],
  );

  // Auto-hide nav after 3s of no mouse movement
  const resetHideTimer = useCallback(() => {
    setNavVisible(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setNavVisible(false), 3000);
  }, []);

  useEffect(() => {
    resetHideTimer();
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [resetHideTimer]);

  useEffect(() => {
    function onMouseMove() {
      resetHideTimer();
    }
    window.addEventListener('mousemove', onMouseMove);
    return () => window.removeEventListener('mousemove', onMouseMove);
  }, [resetHideTimer]);

  // Hide "Press F" hint after leaving first slide or after 5s
  useEffect(() => {
    if (current !== 0) setShowHint(false);
  }, [current]);

  useEffect(() => {
    const t = setTimeout(() => setShowHint(false), 5000);
    return () => clearTimeout(t);
  }, []);

  // Fullscreen toggle
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }, []);

  // Track fullscreen state
  useEffect(() => {
    function onFsChange() {
      setIsFullscreen(!!document.fullscreenElement);
    }
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        go(1);
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        go(-1);
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        toggleFullscreen();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go, toggleFullscreen]);

  const progress = total > 1 ? ((current + 1) / total) * 100 : 100;

  return (
    <div
      ref={containerRef}
      className="pitch-deck relative h-screen w-screen overflow-hidden"
      role="region"
      aria-roledescription="slide deck"
      aria-label="ResumeAI Pitch Deck"
    >
      {/* Slide track */}
      <div
        className="flex h-full transition-transform duration-500 ease-in-out print:block"
        style={{
          transform: `translateX(-${current * 100}vw)`,
          width: `${total * 100}vw`,
        }}
      >
        {children.map((child, i) => (
          <div
            key={i}
            className="pitch-slide flex h-screen w-screen flex-shrink-0 items-center justify-center overflow-auto print:h-auto print:min-h-screen"
            role="group"
            aria-roledescription="slide"
            aria-label={`Slide ${i + 1} of ${total}`}
            aria-hidden={i !== current}
            style={{ pageBreakAfter: 'always' }}
          >
            {child}
          </div>
        ))}
      </div>

      {/* "Press F for fullscreen" hint on first slide */}
      {showHint && current === 0 && (
        <div
          className="fixed left-1/2 top-6 z-50 -translate-x-1/2 rounded-lg px-4 py-2 text-sm text-white/80 transition-opacity duration-500 print:hidden"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}
          aria-live="polite"
        >
          Press <kbd className="mx-1 rounded border border-white/30 bg-white/10 px-1.5 py-0.5 font-mono text-xs">F</kbd> for fullscreen
        </div>
      )}

      {/* Navigation controls */}
      <nav
        className="fixed bottom-3 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-full px-4 py-2 transition-opacity duration-300 print:hidden"
        style={{
          backgroundColor: 'rgba(24, 43, 73, 0.6)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          opacity: navVisible ? 1 : 0,
          pointerEvents: navVisible ? 'auto' : 'none',
        }}
        aria-label="Slide navigation"
        onMouseEnter={() => {
          if (hideTimer.current) clearTimeout(hideTimer.current);
          setNavVisible(true);
        }}
        onMouseLeave={resetHideTimer}
      >
        {/* Previous */}
        <button
          onClick={() => go(-1)}
          disabled={current === 0}
          className="group relative rounded-full p-1.5 text-white transition-opacity disabled:opacity-30"
          aria-label="Previous slide"
        >
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M12 4L6 10L12 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-black/80 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
            Left arrow
          </span>
        </button>

        {/* Dots */}
        <div className="flex items-center gap-1.5">
          {children.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className="rounded-full transition-all"
              style={{
                width: i === current ? 20 : 8,
                height: 8,
                backgroundColor: i === current ? '#e41a1a' : 'rgba(255,255,255,0.4)',
              }}
              aria-label={`Go to slide ${i + 1}`}
              aria-current={i === current ? 'true' : undefined}
            />
          ))}
        </div>

        {/* Counter */}
        <span
          className="min-w-[2.5rem] text-center text-xs font-semibold text-white/90"
          aria-live="polite"
        >
          {current + 1}/{total}
        </span>

        {/* Next */}
        <button
          onClick={() => go(1)}
          disabled={current === total - 1}
          className="group relative rounded-full p-1.5 text-white transition-opacity disabled:opacity-30"
          aria-label="Next slide"
        >
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M8 4L14 10L8 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-black/80 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
            Right arrow
          </span>
        </button>

        {/* Divider */}
        <div className="mx-0.5 h-5 w-px bg-white/20" />

        {/* Fullscreen toggle */}
        <button
          onClick={toggleFullscreen}
          className="group relative rounded-full p-1.5 text-white transition-opacity hover:text-white/80"
          aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
        >
          {isFullscreen ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M8 3v3a2 2 0 01-2 2H3m18 0h-3a2 2 0 01-2-2V3m0 18v-3a2 2 0 012-2h3M3 16h3a2 2 0 012 2v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M8 3H5a2 2 0 00-2 2v3m18-5h-3a2 2 0 00-2 2v3m0 8v3a2 2 0 002 2h3M3 16v3a2 2 0 002 2h3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
          <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-black/80 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
            {isFullscreen ? 'Exit (Esc)' : 'Fullscreen (F)'}
          </span>
        </button>
      </nav>

      {/* Progress bar at bottom */}
      <div
        className="fixed bottom-0 left-0 z-50 h-[3px] w-full print:hidden"
        style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
      >
        <div
          className="h-full transition-all duration-500 ease-in-out"
          style={{
            width: `${progress}%`,
            background: 'linear-gradient(90deg, #e41a1a, #ff6b35)',
          }}
        />
      </div>
    </div>
  );
}
