import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme';
import { useState, useEffect, useRef, useCallback } from 'react';
import { isModelReady } from '../ai/models/webllm';

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
  return (
    <div
      className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
      style={{
        backgroundColor: aiLevel === 'L3' ? 'rgba(34,197,94,0.2)'
          : aiLevel === 'L4' ? 'rgba(99,102,241,0.2)'
          : 'rgba(234,179,8,0.2)',
        color: aiLevel === 'L3' ? '#22c55e'
          : aiLevel === 'L4' ? '#6366f1'
          : '#eab308',
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
        className="inline-block h-2 w-2 rounded-full"
        style={{
          backgroundColor: aiLevel === 'L3' ? '#22c55e'
            : aiLevel === 'L4' ? '#6366f1'
            : '#eab308',
        }}
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
  const [aiLevel, setAiLevel] = useState<'L1' | 'L2' | 'L3' | 'L4'>(() =>
    (localStorage.getItem('resumeai_ai_level') as 'L1' | 'L2' | 'L3' | 'L4') ?? 'L2'
  );
  const drawerRef = useRef<HTMLDivElement>(null);
  const hamburgerRef = useRef<HTMLButtonElement>(null);

  // Periodically check if L3 became available (background download completed)
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

  // Close drawer on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Focus trap inside drawer
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

  // Prevent body scroll when drawer is open
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
    <div className="flex rounded-full bg-white/10 p-0.5 text-xs">
      <button
        onClick={() => setMode('student')}
        className={`rounded-full px-3 py-1 transition-colors ${
          mode === 'student'
            ? 'bg-white text-gray-900 font-bold'
            : 'text-white/85 hover:text-white'
        }`}
        aria-pressed={mode === 'student'}
      >
        Student
      </button>
      <button
        onClick={() => setMode('employer')}
        className={`rounded-full px-3 py-1 transition-colors ${
          mode === 'employer'
            ? 'bg-white text-gray-900 font-bold'
            : 'text-white/85 hover:text-white'
        }`}
        aria-pressed={mode === 'employer'}
      >
        Employer
      </button>
    </div>
  );

  const navLinks = links.map(({ to, label }) => (
    <Link
      key={to}
      to={to}
      onClick={() => setMenuOpen(false)}
      className={`text-sm no-underline transition-colors ${
        pathname === to || pathname.startsWith(to + '/')
          ? 'border-b-2 border-[var(--accent-red)] pb-0.5 font-bold text-white'
          : 'text-white/85 hover:text-white'
      }`}
      aria-current={pathname === to ? 'page' : undefined}
    >
      {label}
    </Link>
  ));

  const themeButton = (
    <button
      onClick={toggle}
      className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-sm text-white transition-colors hover:bg-white/20"
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      <span aria-hidden="true">{theme === 'light' ? '\u2600\uFE0F' : '\uD83C\uDF19'}</span>
      <span className="sr-only">
        Current: {theme} mode
      </span>
    </button>
  );

  return (
    <nav
      className="flex items-center justify-between px-4 sm:px-6 py-3 print:hidden"
      style={{ background: 'var(--accent-navy)' }}
      role="navigation"
      aria-label="Main navigation"
    >
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-white focus:px-4 focus:py-2 focus:text-black"
      >
        Skip to content
      </a>

      <Link
        to="/"
        className="flex items-center gap-3 no-underline"
        aria-label="ResumeAI home"
      >
        <img
          src="/assets/images/shoolini-logo.png"
          alt="Shoolini University logo"
          className="h-9 w-9 rounded-md bg-white object-contain p-0.5"
          width={36}
          height={36}
        />
        <div>
          <div className="text-base font-bold leading-tight text-white">
            ResumeAI
          </div>
          <div className="text-xs leading-tight text-white/80">
            Shoolini University
          </div>
        </div>
      </Link>

      {/* Desktop nav */}
      <div className="hidden sm:flex items-center gap-4 sm:gap-6">
        {modeToggle}
        {navLinks}
        <AiLevelBadge aiLevel={aiLevel} />
        {themeButton}
      </div>

      {/* Mobile: AI badge + hamburger */}
      <div className="flex items-center gap-3 sm:hidden">
        <AiLevelBadge aiLevel={aiLevel} />
        <button
          ref={hamburgerRef}
          onClick={() => setMenuOpen((o) => !o)}
          className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 text-white transition-colors hover:bg-white/20"
          aria-expanded={menuOpen}
          aria-controls="mobile-nav-drawer"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
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
            {menuOpen ? (
              <>
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </>
            ) : (
              <>
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </>
            )}
          </svg>
        </button>
      </div>

      {/* Mobile drawer backdrop */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 sm:hidden"
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
        className="fixed right-0 top-0 z-50 flex h-full w-72 flex-col gap-6 p-6 sm:hidden"
        style={{
          background: 'var(--accent-navy)',
          transform: menuOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 300ms cubic-bezier(0.4, 0, 0.2, 1)',
          visibility: menuOpen ? 'visible' : 'hidden',
        }}
      >
        {/* Close button */}
        <div className="flex justify-end">
          <button
            onClick={closeDrawer}
            className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 text-white hover:bg-white/20"
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

        {/* Mode toggle */}
        {modeToggle}

        {/* Nav links */}
        <div className="flex flex-col gap-4">
          {navLinks}
        </div>

        {/* Theme toggle */}
        <div className="mt-auto">
          {themeButton}
        </div>
      </div>
    </nav>
  );
}
