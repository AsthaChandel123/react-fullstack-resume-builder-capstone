import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme';
import { useState, useEffect } from 'react';
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

export function Navbar() {
  const { theme, toggle } = useTheme();
  const { pathname } = useLocation();
  const [mode, setMode] = useState<Mode>(() => getModeFromPath(pathname));
  const [aiLevel, setAiLevel] = useState<'L2' | 'L3'>(() =>
    (localStorage.getItem('resumeai_ai_level') as 'L2' | 'L3') ?? 'L2'
  );

  // Periodically check if L3 became available (background download completed)
  useEffect(() => {
    const check = () => {
      if (isModelReady() && aiLevel !== 'L3') {
        setAiLevel('L3');
        localStorage.setItem('resumeai_ai_level', 'L3');
      }
    };
    check();
    const interval = setInterval(check, 5000);
    return () => clearInterval(interval);
  }, [aiLevel]);

  const links = mode === 'student' ? STUDENT_LINKS : EMPLOYER_LINKS;

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
          <div className="text-xs leading-tight text-white/50">
            Shoolini University
          </div>
        </div>
      </Link>

      <div className="flex items-center gap-4 sm:gap-6">
        {/* Mode toggle */}
        <div className="flex rounded-full bg-white/10 p-0.5 text-xs">
          <button
            onClick={() => setMode('student')}
            className={`rounded-full px-3 py-1 transition-colors ${
              mode === 'student'
                ? 'bg-white text-gray-900 font-bold'
                : 'text-white/70 hover:text-white'
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
                : 'text-white/70 hover:text-white'
            }`}
            aria-pressed={mode === 'employer'}
          >
            Employer
          </button>
        </div>

        {/* Context-specific links */}
        {links.map(({ to, label }) => (
          <Link
            key={to}
            to={to}
            className={`text-sm no-underline transition-colors ${
              pathname === to || pathname.startsWith(to + '/')
                ? 'border-b-2 border-[var(--accent-red)] pb-0.5 font-bold text-white'
                : 'text-white/70 hover:text-white'
            }`}
            aria-current={pathname === to ? 'page' : undefined}
          >
            {label}
          </Link>
        ))}

        {/* AI Level indicator */}
        <div
          className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
          style={{
            backgroundColor: aiLevel === 'L3' ? 'rgba(34,197,94,0.2)' : 'rgba(234,179,8,0.2)',
            color: aiLevel === 'L3' ? '#22c55e' : '#eab308',
          }}
          title={aiLevel === 'L3' ? 'Gemma 4 E2B active' : 'TF-IDF analysis active'}
        >
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ backgroundColor: aiLevel === 'L3' ? '#22c55e' : '#eab308' }}
          />
          {aiLevel === 'L3' ? 'Gemma 4' : 'L2'}
        </div>

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
      </div>
    </nav>
  );
}
