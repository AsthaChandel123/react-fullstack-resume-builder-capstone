import { useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface PitchNavProps {
  children: ReactNode[];
}

export function PitchNav({ children }: PitchNavProps) {
  const [current, setCurrent] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [navVisible, setNavVisible] = useState(true);
  const [showHint, setShowHint] = useState(true);
  const [showOverview, setShowOverview] = useState(false);
  const [needsFullscreen, setNeedsFullscreen] = useState(true);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const total = children.length;

  const go = useCallback(
    (dir: 1 | -1) => {
      setCurrent((i) => Math.max(0, Math.min(total - 1, i + dir)));
    },
    [total],
  );

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

  useEffect(() => {
    if (current !== 0) setShowHint(false);
  }, [current]);

  useEffect(() => {
    const t = setTimeout(() => setShowHint(false), 5000);
    return () => clearTimeout(t);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }, []);

  useEffect(() => {
    function onFsChange() {
      const fs = !!document.fullscreenElement;
      setIsFullscreen(fs);
      if (fs) setNeedsFullscreen(false);
    }
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const handleFirstClick = useCallback(() => {
    if (needsFullscreen && !document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(() => {
        setNeedsFullscreen(false);
      });
    }
  }, [needsFullscreen]);

  // Touch/swipe support
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }, []);

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!touchStart.current) return;
      const dx = e.changedTouches[0].clientX - touchStart.current.x;
      const dy = e.changedTouches[0].clientY - touchStart.current.y;
      touchStart.current = null;
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
        go(dx < 0 ? 1 : -1);
      }
    },
    [go],
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && showOverview) {
        e.preventDefault();
        setShowOverview(false);
        return;
      }
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        go(1);
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        go(-1);
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.key === 'g' || e.key === 'G') {
        e.preventDefault();
        setShowOverview((v) => !v);
      } else if (e.key === 'Home') {
        e.preventDefault();
        setCurrent(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        setCurrent(total - 1);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go, toggleFullscreen, showOverview, total]);

  const slideWidthPct = 100 / total;

  return (
    <div
      ref={containerRef}
      className="pitch-deck relative flex flex-col"
      style={{ width: '100%', height: '100dvh', overflow: 'hidden', backgroundColor: '#ffffff' }}
      role="region"
      aria-roledescription="slide deck"
      aria-label="ResumeAI Pitch Deck"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Fullscreen prompt overlay -- dismissed after first click/tap */}
      {needsFullscreen && (
        <div
          onClick={handleFirstClick}
          onTouchEnd={handleFirstClick}
          className="absolute inset-0 z-[100] flex cursor-pointer items-center justify-center print:hidden"
          style={{ backgroundColor: 'rgba(15,23,42,0.7)', backdropFilter: 'blur(4px)' }}
          role="button"
          aria-label="Tap to enter fullscreen"
        >
          <div className="text-center text-white">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto mb-3" aria-hidden="true">
              <path d="M4 4h4M4 4v4M20 4h-4M20 4v4M4 20h4M4 20v-4M20 20h-4M20 20v-4" />
            </svg>
            <p style={{ fontSize: '18px', fontWeight: 600 }}>Tap anywhere to start</p>
            <p style={{ fontSize: '13px', opacity: 0.7, marginTop: '4px' }}>Enters fullscreen for best experience</p>
          </div>
        </div>
      )}

      {/* Shoolini logo top-left */}
      <div className="pointer-events-none absolute left-4 top-3 z-40 print:hidden">
        <img
          src="/assets/images/shoolini-logo.png"
          alt=""
          className="h-8 w-8 rounded bg-white object-contain p-0.5"
          style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.12)' }}
          aria-hidden="true"
        />
      </div>

      {/* Home button top-right */}
      <Link
        to="/"
        className="absolute right-4 top-3 z-40 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold no-underline transition-opacity print:hidden"
        style={{
          backgroundColor: '#182B49',
          color: '#ffffff',
          opacity: navVisible ? 1 : 0,
          pointerEvents: navVisible ? 'auto' : 'none',
        }}
        aria-label="Back to home"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
        Home
      </Link>

      {/* "Press F" hint */}
      {showHint && current === 0 && (
        <div
          className="absolute left-1/2 top-6 z-50 -translate-x-1/2 rounded-lg px-4 py-2 text-sm print:hidden"
          style={{ backgroundColor: '#182B49', color: '#ffffff' }}
          aria-live="polite"
        >
          Press{' '}
          <kbd className="mx-1 rounded border border-white/30 bg-white/10 px-1.5 py-0.5 font-mono text-xs">
            F
          </kbd>{' '}
          for fullscreen
        </div>
      )}

      {/* Slide track */}
      <div
        className="flex flex-1 transition-transform duration-500 ease-in-out print:block"
        style={{
          width: `${total * 100}%`,
          transform: `translateX(-${current * slideWidthPct}%)`,
        }}
      >
        {children.map((child, i) => (
          <div
            key={i}
            className="pitch-slide flex items-center justify-center overflow-auto print:h-auto print:min-h-screen"
            style={{ width: `${slideWidthPct}%`, height: '100%' }}
            role="group"
            aria-roledescription="slide"
            aria-label={`Slide ${i + 1} of ${total}`}
            aria-hidden={i !== current}
          >
            {child}
          </div>
        ))}
      </div>

      {/* Formal footer */}
      <div
        className="absolute bottom-0 left-0 z-30 flex w-full items-center justify-between px-4 py-0.5 print:hidden"
        style={{ color: '#94a3b8', fontSize: '9px', backgroundColor: 'rgba(255,255,255,0.6)' }}
      >
        <span>Astha Chandel | GF202214559</span>
        <span>BTech CSE Capstone | Shoolini University, Solan, HP</span>
        <span>
          {current + 1}/{total}
        </span>
      </div>

      {/* Navigation */}
      <nav
        className="absolute bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-full px-4 py-1.5 transition-opacity duration-300 print:hidden"
        style={{
          backgroundColor: 'rgba(24, 43, 73, 0.9)',
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
        <button
          onClick={() => go(-1)}
          disabled={current === 0}
          className="rounded-full p-1.5 text-white transition-opacity disabled:opacity-30"
          aria-label="Previous slide"
        >
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path
              d="M12 4L6 10L12 16"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        <div className="flex items-center gap-1.5">
          {children.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className="rounded-full transition-all"
              style={{
                width: i === current ? 20 : 8,
                height: 8,
                backgroundColor: i === current ? '#b91c1c' : 'rgba(255,255,255,0.4)',
              }}
              aria-label={`Go to slide ${i + 1}`}
              aria-current={i === current ? 'true' : undefined}
            />
          ))}
        </div>

        <span
          className="min-w-[2.5rem] text-center text-xs font-semibold text-white"
          aria-live="polite"
        >
          {current + 1}/{total}
        </span>

        <button
          onClick={() => go(1)}
          disabled={current === total - 1}
          className="rounded-full p-1.5 text-white transition-opacity disabled:opacity-30"
          aria-label="Next slide"
        >
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path
              d="M8 4L14 10L8 16"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        <div className="mx-0.5 h-5 w-px bg-white/20" />

        {/* Grid overview toggle */}
        <button
          onClick={() => setShowOverview((v) => !v)}
          className="rounded-full p-1.5 text-white transition-opacity hover:text-white/80"
          aria-label="Slide overview (G)"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="2" />
            <rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="2" />
            <rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="2" />
            <rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="2" />
          </svg>
        </button>

        {/* Fullscreen toggle */}
        <button
          onClick={toggleFullscreen}
          className="rounded-full p-1.5 text-white transition-opacity hover:text-white/80"
          aria-label={isFullscreen ? 'Exit fullscreen (F)' : 'Enter fullscreen (F)'}
        >
          {isFullscreen ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M4 14h6v6M20 10h-6V4M14 10l7-7M3 21l7-7"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </button>
      </nav>

      {/* Slide overview grid */}
      {showOverview && (
        <div
          className="absolute inset-0 z-[60] overflow-auto p-8"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(8px)' }}
          onClick={() => setShowOverview(false)}
          role="dialog"
          aria-label="Slide overview"
        >
          <div className="mx-auto grid max-w-6xl grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {children.map((child, i) => (
              <button
                key={i}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrent(i);
                  setShowOverview(false);
                }}
                className="group relative overflow-hidden rounded-lg text-left transition-transform hover:scale-105"
                style={{
                  aspectRatio: '16/9',
                  border: i === current ? '3px solid #991b1b' : '2px solid rgba(255,255,255,0.15)',
                  backgroundColor: '#ffffff',
                }}
                aria-label={`Go to slide ${i + 1}`}
              >
                <div
                  className="pointer-events-none h-full w-full origin-top-left"
                  style={{ transform: 'scale(0.25)', width: '400%', height: '400%' }}
                >
                  {child}
                </div>
                <div
                  className="absolute bottom-0 left-0 right-0 px-2 py-1 text-center text-xs font-bold"
                  style={{ backgroundColor: i === current ? '#991b1b' : 'rgba(24,43,73,0.85)', color: '#ffffff' }}
                >
                  {i + 1}
                </div>
              </button>
            ))}
          </div>
          <p className="mt-4 text-center text-sm font-medium" style={{ color: 'rgba(255,255,255,0.6)' }}>
            Click a slide to jump. Press G or Esc to close.
          </p>
        </div>
      )}

      {/* Progress bar */}
      <div
        className="absolute bottom-0 left-0 z-50 h-[3px] w-full print:hidden"
        style={{ backgroundColor: 'rgba(0,0,0,0.06)' }}
      >
        <div
          className="h-full transition-all duration-500 ease-in-out"
          style={{
            width: `${((current + 1) / total) * 100}%`,
            background: 'linear-gradient(90deg, #991b1b, #182B49)',
          }}
        />
      </div>
    </div>
  );
}
