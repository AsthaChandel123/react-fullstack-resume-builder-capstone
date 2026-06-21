import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer
      className="mt-20 print:hidden"
      style={{
        borderTop: '1px solid var(--border)',
        background: 'var(--bg-secondary)',
        color: 'var(--text-secondary)',
      }}
      role="contentinfo"
    >
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-5 text-xs sm:flex-row">
        <div className="flex items-center gap-3">
          <img
            src="/assets/images/shoolini-logo.png"
            alt="Shoolini University"
            className="h-6 w-6 rounded bg-white object-contain p-0.5"
            width={24}
            height={24}
          />
          <span>
            <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>
              ResumeAI
            </span>{' '}
            &middot; built by{' '}
            <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
              Astha Chandel
            </span>{' '}
            &middot; Shoolini University
          </span>
        </div>
        <nav
          aria-label="Footer links"
          className="flex items-center gap-5"
        >
          <Link
            to="/pitch"
            className="no-underline transition-colors hover:opacity-100"
            style={{ color: 'var(--text-secondary)' }}
          >
            Pitch
          </Link>
          <Link
            to="/capstone-report"
            className="no-underline transition-colors hover:opacity-100"
            style={{ color: 'var(--text-secondary)' }}
          >
            Capstone Report
          </Link>
          <a
            href="https://github.com/divyamohan1993"
            target="_blank"
            rel="noopener noreferrer"
            className="no-underline transition-colors hover:opacity-100"
            style={{ color: 'var(--text-secondary)' }}
          >
            GitHub
          </a>
        </nav>
      </div>
    </footer>
  );
}
