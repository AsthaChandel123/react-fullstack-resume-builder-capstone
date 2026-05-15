import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme';
import { useState, useEffect, useRef, useCallback } from 'react';
import { isModelReady } from '../ai/models/webllmStatus';

type Mode = 'student' | 'employer';

const STUDENT_LINKS = [
  { to: '/builder', label: 'Resume Builder' },
  { to: '/bridge/dashboard', label: 'My Applications' },
] as const;

const EMPLOYER_LINKS = [
  { to: '/employer', label: 'Screen Resumes' },
  { to: '/employer/publish', label: 'Publish Criteria' },
  { to: '/employer/matches', label: 'Match Signals' },
  { to: '/employer/criteria', label: 'My Criteria' },
] as const;

function getModeFromPath(path: string): Mode {
  if (path.startsWith('/employer')) return 'employer';
  return 'student';
}

function AiLevelBadge({ aiLevel }: { aiLevel: 'L1' | 'L2' | 'L3' | 'L4' }) {
  const color =
    aiLevel === 'L3' ? '#22c55e'
      : aiLevel === 'L4' ? '#6366f1'
        : '#eab308';
  const bg =
    aiLevel === 'L3' ? 'rgba(34,197,94,0.16)'
      : aiLevel === 'L4' ? 'rgba(99,102,241,0.16)'
        : 'rgba(234,179,8,0.16)';
  return (
    <div
      className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
      style={{
        backgroundColor: bg,
        color,
        border: `1px solid ${color}33`,
      }}
      title={
        aiLevel === 'L3' ? 'Gemma 4 E2B (local, private)'
          : aiLevel === 'L4' ? 'Gemini API (cloud)'
            : aiLevel === 'L2' ? 'Embeddings + TF-IDF'
              : 'Keyword analysis only'
      }
      role="status"
      aria-label={`AI engine: ${
        aiLevel === 'L3' ? 'Gemma 4 local model'
          : aiLevel === 'L4' ? 'Gemini cloud API'
            : aiLevel === 'L2' ? 'Embedding analysis'
              : 'Basic keyword analysis'
      }`}
    >
      <span
        className="anim-pulse-dot inline-block h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: color }}
      />
      {aiLevel === 'L3' ? 'Gemma 4' : aiLevel === 'L4' ? 'Gemini' : aiLevel}
    </div>
  );
}

export function Navbar() {
  const { theme, toggle } = useTheme();
  const { pathname } = useLocation();
  const [mode, setMode] = useState<Mode>(() => getModeFromPath(pathname));
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [aiLevel, setAiLevel] = useState<'L1' | 'L2' | 'L3' | 'L4'>(() =>
    (localStorage.getItem('resumeai_ai_level') as 'L1' | 'L2' | 'L3' | 'L4') ?? 'L2'
  );
  const drawerRef = useRef<HTMLDivElement>(null);
  const hamburgerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const check = () => {
      if (isModelReady() && (aiLevel === 'L1' || aiLevel === 'L2')) {
        setAiLevel('L3');
        localStorage.setItem('resumeai_ai_level', 'L3');
      }
    };
    check();
    const interval = setInterval(check, 5000);
    return () => clearInterval(interval);
  }, [aiLevel]);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const drawer = drawerRef.current;
    if (!drawer) return;

    const focusable = drawer.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    first?.focus();

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setMenuOpen(false);
        hamburgerRef.current?.focus();
        return;
      }
      if (e.key !== 'Tab') return;
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [menuOpen]);

  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  const closeDrawer = useCallback(() => {
    setMenuOpen(false);
    hamburgerRef.current?.focus();
  }, []);

  const links = mode === 'student' ? STUDENT_LINKS : EMPLOYER_LINKS;

  const modeToggle = (
    <div
      className="flex rounded-full p-0.5 text-[11px] font-semibold"
      style={{
        background: 'color-mix(in oklab, var(--text-primary) 8%, transparent)',
      }}
      role="group"
      aria-label="Switch context"
    >
      <button
        onClick={() => setMode('student')}
        className="rounded-full px-3 py-1 transition-all duration-200"
        style={{
          background: mode === 'student' ? 'var(--accent-gradient)' : 'transparent',
          color: mode === 'student' ? '#0a1428' : 'var(--text-secondary)',
          fontWeight: mode === 'student' ? 800 : 600,
        }}
        aria-pressed={mode === 'student'}
      >
        Student
      </button>
      <button
        onClick={() => setMode('employer')}
        className="rounded-full px-3 py-1 transition-all duration-200"
        style={{
          background: mode === 'employer' ? 'var(--accent-gradient-indigo)' : 'transparent',
          color: mode === 'employer' ? '#ffffff' : 'var(--text-secondary)',
          fontWeight: mode === 'employer' ? 800 : 600,
        }}
        aria-pressed={mode === 'employer'}
      >
        Employer
      </button>
    </div>
  );

  // Pick a single active link: prefer exact match, otherwise the LONGEST
  // prefix match. Prevents the parent route (e.g. /employer) staying
  // highlighted when a child route (/employer/matches) is also visible.
  const bestActiveTo = (() => {
    let best: string | null = null;
    for (const { to } of links) {
      if (pathname === to) return to;
      if (pathname.startsWith(to + '/') && (!best || to.length > best.length)) {
        best = to;
      }
    }
    return best;
  })();

  const navLinks = links.map(({ to, label }) => {
    const active = to === bestActiveTo;
    return (
      <Link
        key={to}
        to={to}
        onClick={() => setMenuOpen(false)}
        className="relative text-sm no-underline transition-colors"
        style={{
          color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
          fontWeight: active ? 700 : 500,
        }}
        aria-current={pathname === to ? 'page' : undefined}
      >
        {label}
        {active && (
          <span
            aria-hidden="true"
            className="absolute -bottom-1 left-0 right-0 h-[2px] rounded-full"
            style={{ background: 'var(--accent-gradient)' }}
          />
        )}
      </Link>
    );
  });

  const themeButton = (
    <button
      onClick={toggle}
      className="flex h-8 w-8 items-center justify-center rounded-full text-sm transition-all hover:scale-105"
      style={{
        background: 'color-mix(in oklab, var(--text-primary) 8%, transparent)',
        color: 'var(--text-primary)',
      }}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      <span aria-hidden="true">{theme === 'light' ? '☀️' : '🌙'}</span>
      <span className="sr-only">
        Current: {theme} mode
      </span>
    </button>
  );

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[60] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-black focus:shadow-lg"
      >
        Skip to content
      </a>

      <nav
        className="fixed left-1/2 z-50 -translate-x-1/2 print:hidden"
        style={{
          top: '16px',
          width: 'calc(100% - 24px)',
          maxWidth: '980px',
          transition: 'box-shadow var(--dur) var(--ease-out), transform var(--dur) var(--ease-out)',
        }}
        role="navigation"
        aria-label="Main navigation"
      >
        {/* Desktop pill */}
        <div
          className="glass hidden items-center gap-4 rounded-full px-3 py-2 sm:flex"
          style={{
            boxShadow: scrolled ? 'var(--shadow-lift)' : 'var(--shadow-pill)',
          }}
        >
          <Link
            to="/"
            className="flex items-center gap-2 pl-1 no-underline"
            aria-label="ResumeAI home"
          >
            <img
              src="/assets/images/shoolini-logo.png"
              alt="Shoolini University logo"
              className="h-8 w-8 rounded-md bg-white object-contain p-0.5"
              width={32}
              height={32}
            />
            <span
              className="text-[15px] font-extrabold tracking-tight"
              style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}
            >
              ResumeAI
            </span>
          </Link>

          <div
            aria-hidden="true"
            className="h-6 w-px"
            style={{ background: 'var(--border)' }}
          />

          <div className="flex items-center gap-5">
            {navLinks}
          </div>

          <div className="ml-auto flex items-center gap-2">
            {modeToggle}
            <AiLevelBadge aiLevel={aiLevel} />
            {themeButton}
          </div>
        </div>

        {/* Mobile bar */}
        <div
          className="glass flex items-center justify-between gap-2 rounded-full px-3 py-2 sm:hidden"
          style={{
            boxShadow: scrolled ? 'var(--shadow-lift)' : 'var(--shadow-pill)',
          }}
        >
          <Link
            to="/"
            className="flex items-center gap-2 no-underline"
            aria-label="ResumeAI home"
          >
            <img
              src="/assets/images/shoolini-logo.png"
              alt="Shoolini University logo"
              className="h-7 w-7 rounded-md bg-white object-contain p-0.5"
              width={28}
              height={28}
            />
            <span
              className="text-sm font-extrabold tracking-tight"
              style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}
            >
              ResumeAI
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <AiLevelBadge aiLevel={aiLevel} />
            <button
              ref={hamburgerRef}
              onClick={() => setMenuOpen((o) => !o)}
              className="flex h-9 w-9 items-center justify-center rounded-full transition-colors"
              style={{
                background: 'color-mix(in oklab, var(--text-primary) 10%, transparent)',
                color: 'var(--text-primary)',
              }}
              aria-expanded={menuOpen}
              aria-controls="mobile-nav-drawer"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                {menuOpen ? (
                  <>
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </>
                ) : (
                  <>
                    <line x1="4" y1="7" x2="20" y2="7" />
                    <line x1="4" y1="12" x2="20" y2="12" />
                    <line x1="4" y1="17" x2="14" y2="17" />
                  </>
                )}
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile drawer backdrop */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-40 sm:hidden"
          style={{ background: 'rgba(5, 10, 21, 0.55)', backdropFilter: 'blur(4px)' }}
          onClick={closeDrawer}
          aria-hidden="true"
        />
      )}

      {/* Mobile drawer */}
      <div
        ref={drawerRef}
        id="mobile-nav-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        className="fixed right-0 top-0 z-50 flex h-full w-80 max-w-[90vw] flex-col gap-6 p-6 sm:hidden"
        style={{
          background: 'var(--bg-surface)',
          color: 'var(--text-primary)',
          borderLeft: '1px solid var(--border)',
          transform: menuOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 300ms cubic-bezier(0.4, 0, 0.2, 1)',
          visibility: menuOpen ? 'visible' : 'hidden',
          boxShadow: menuOpen ? 'var(--shadow-lift)' : 'none',
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              src="/assets/images/shoolini-logo.png"
              alt="Shoolini University logo"
              className="h-8 w-8 rounded-md bg-white object-contain p-0.5"
              width={32}
              height={32}
            />
            <span className="text-base font-extrabold tracking-tight">ResumeAI</span>
          </div>
          <button
            onClick={closeDrawer}
            className="flex h-10 w-10 items-center justify-center rounded-full"
            style={{
              background: 'color-mix(in oklab, var(--text-primary) 10%, transparent)',
              color: 'var(--text-primary)',
            }}
            aria-label="Close menu"
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {modeToggle}

        <div className="flex flex-col gap-3">
          {navLinks}
        </div>

        <div className="mt-auto flex items-center justify-between">
          <AiLevelBadge aiLevel={aiLevel} />
          {themeButton}
        </div>
      </div>
    </>
  );
}
