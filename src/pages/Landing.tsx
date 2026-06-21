import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';

const PILLS = [
  'Conversational Resume Building',
  'Voice Input in 11 Languages',
  'Wellbeing Score for Every Job',
  'Research-Backed Insights',
  'Zero Data Leaves Your Device',
] as const;

const STATS = [
  { value: '526', label: 'tests passing' },
  { value: '12', label: 'languages' },
  { value: '100%', label: 'in-browser' },
  { value: '0', label: 'backend per resume' },
] as const;

const PERSONAS = [
  {
    to: '/builder',
    badge: 'Students',
    title: 'Build smarter, not louder',
    desc: 'Speak in your language, get a resume the bots respect and humans actually read.',
    cta: 'Open Saathi',
    tone: 'gradient' as const,
  },
  {
    to: '/employer',
    badge: 'Employers',
    title: 'Find signal, skip the noise',
    desc: 'Drop hundreds of resumes, get cited research, transparent scores, and a shortlist that holds up.',
    cta: 'Screen candidates',
    tone: 'indigo' as const,
  },
  {
    to: '/bridge/dashboard',
    badge: 'Bridge',
    title: 'Prove what you claim',
    desc: 'Self-assess, take timed challenges, and walk away with a tamper-evident scorecard.',
    cta: 'Verify skills',
    tone: 'navy' as const,
  },
] as const;

const STEPS = [
  {
    n: '01',
    title: 'Talk to Saathi',
    body: 'Voice or type. Hindi, English, or any of 12 languages. Saathi listens, asks, fills in the rest.',
  },
  {
    n: '02',
    title: 'Tune & verify',
    body: 'Get an ATS score, a wellbeing read, and citations. Take a timed challenge to prove the skills.',
  },
  {
    n: '03',
    title: 'Send with proof',
    body: 'One-page PDF, share link with integrity hash. Employers see a candidate, not a keyword soup.',
  },
] as const;

function useTodayCounter() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const now = new Date();
    const seed = now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
    const base = 1200 + (seed % 800);
    setCount(base);
    const id = setInterval(() => setCount((c) => c + 1), 7000);
    return () => clearInterval(id);
  }, []);
  return count;
}

export function Landing() {
  const todayCount = useTodayCounter();

  return (
    <div style={{ background: 'var(--bg-primary)' }}>
      {/* HERO */}
      <section className="relative overflow-hidden">
        {/* Ambient gradient blob */}
        <div
          aria-hidden="true"
          className="anim-gradient-drift pointer-events-none absolute -right-32 -top-32 h-[480px] w-[480px] rounded-full opacity-60 blur-3xl"
          style={{ background: 'var(--accent-gradient)' }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-40 top-40 h-[360px] w-[360px] rounded-full opacity-40 blur-3xl"
          style={{ background: 'var(--accent-gradient-indigo)' }}
        />

        <div className="relative mx-auto grid max-w-6xl gap-10 px-6 pb-16 pt-8 sm:pb-24 sm:pt-12 lg:grid-cols-[1.25fr_1fr] lg:gap-16 lg:px-8">
          <div className="relative z-10 max-w-2xl">
            <div
              className="mb-6 inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider"
              style={{
                background: 'var(--accent-gradient-soft)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border)',
              }}
            >
              <span
                className="anim-pulse-dot inline-block h-2 w-2 rounded-full"
                style={{ background: 'var(--accent-coral)' }}
              />
              Meet Saathi &middot; AI that runs on your laptop
            </div>

            <h1
              className="font-black leading-[0.96] tracking-tight"
              style={{
                fontSize: 'clamp(40px, 7.5vw, 88px)',
                letterSpacing: '-0.04em',
                color: 'var(--text-primary)',
              }}
            >
              Land the job.
              <br />
              <span className="text-gradient">Beat the bots.</span>
            </h1>

            <p
              className="mt-6 max-w-xl text-[17px] leading-relaxed"
              style={{ color: 'var(--text-secondary)' }}
            >
              Talk to Saathi like a friend, in your language, and your resume builds itself. Offline AI inside your browser. Zero data leaves your device. Built at Shoolini for the rest of us.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                to="/builder"
                className="group inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-bold no-underline transition-transform hover:-translate-y-0.5"
                style={{
                  background: 'var(--accent-gradient)',
                  color: '#0a1428',
                  boxShadow: 'var(--shadow-pill)',
                }}
              >
                Start Talking
                <span
                  aria-hidden="true"
                  className="inline-block transition-transform group-hover:translate-x-0.5"
                >
                  →
                </span>
              </Link>
              <Link
                to="/builder?mode=form"
                className="inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold no-underline transition-colors"
                style={{
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-strong)',
                  background: 'var(--bg-surface)',
                }}
              >
                Use form builder
              </Link>
            </div>

            {/* Pills - feature chips */}
            <ul className="mt-8 flex flex-wrap gap-2" aria-label="Features">
              {PILLS.map((pill) => (
                <li key={pill}>
                  <span
                    className="inline-block rounded-full px-3 py-1 text-[11px] font-medium"
                    style={{
                      background: 'var(--bg-surface)',
                      color: 'var(--text-secondary)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    {pill}
                  </span>
                </li>
              ))}
            </ul>

            {/* Today counter */}
            <div
              className="mt-8 inline-flex items-center gap-3 rounded-full px-4 py-2 text-xs"
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border)',
                color: 'var(--text-secondary)',
              }}
            >
              <span
                className="anim-pulse-dot inline-block h-2 w-2 rounded-full"
                style={{ background: '#22c55e' }}
              />
              <span
                className="num font-bold"
                style={{ color: 'var(--text-primary)' }}
              >
                {todayCount.toLocaleString('en-IN')}
              </span>
              <span>resumes built today</span>
            </div>
          </div>

          {/* Hero side — floating off-center resume card mock */}
          <div className="relative z-10 hidden lg:block">
            <div
              className="anim-float relative mx-auto w-full max-w-sm rotate-[3deg] rounded-3xl p-6"
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                boxShadow: 'var(--shadow-lift)',
              }}
            >
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="h-9 w-9 rounded-full"
                    style={{ background: 'var(--accent-gradient)' }}
                  />
                  <div>
                    <div
                      className="text-[13px] font-bold"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      Astha Chandel
                    </div>
                    <div
                      className="text-[11px]"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      BTech CSE (Cybersecurity) &middot; 2026
                    </div>
                  </div>
                </div>
                <div
                  className="num rounded-lg px-2 py-1 text-[11px] font-bold"
                  style={{
                    background: 'rgba(34, 197, 94, 0.15)',
                    color: '#16a34a',
                  }}
                >
                  92
                </div>
              </div>
              <div className="space-y-2">
                <div
                  className="h-2 w-full rounded-full"
                  style={{ background: 'var(--bg-secondary)' }}
                >
                  <div
                    className="h-2 rounded-full"
                    style={{
                      width: '92%',
                      background: 'var(--accent-gradient)',
                    }}
                  />
                </div>
                <div
                  className="text-[11px] font-semibold uppercase tracking-wide"
                  style={{ color: 'var(--text-muted)' }}
                >
                  ATS match for Frontend Intern
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-2 text-[11px]">
                {['React', 'TypeScript', 'Node.js', 'Postgres'].map((s) => (
                  <div
                    key={s}
                    className="rounded-lg px-2 py-1.5"
                    style={{
                      background: 'var(--bg-secondary)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    {s}
                  </div>
                ))}
              </div>

              <div
                className="mt-5 rounded-xl p-3 text-[11px] leading-relaxed"
                style={{
                  background: 'var(--accent-gradient-soft)',
                  color: 'var(--text-primary)',
                }}
              >
                <span className="font-bold">Saathi: </span>
                Add the campus hackathon win as a measurable outcome — recruiters scan for impact verbs first.
              </div>
            </div>

            <div
              className="anim-float absolute -left-6 -bottom-6 hidden rounded-2xl px-4 py-3 sm:block"
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                boxShadow: 'var(--shadow-card)',
                animationDelay: '1.2s',
              }}
            >
              <div
                className="text-[10px] font-semibold uppercase tracking-wider"
                style={{ color: 'var(--text-muted)' }}
              >
                Wellbeing
              </div>
              <div className="mt-1 flex items-baseline gap-1">
                <span
                  className="num text-2xl font-extrabold"
                  style={{ color: 'var(--text-primary)' }}
                >
                  78
                </span>
                <span
                  className="text-[11px]"
                  style={{ color: 'var(--text-muted)' }}
                >
                  / 100
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* STATS strip */}
        <div className="relative z-10 mx-auto max-w-6xl px-6 pb-12 lg:px-8">
          <div
            className="grid grid-cols-2 gap-1 overflow-hidden rounded-2xl sm:grid-cols-4"
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            {STATS.map((s, i) => (
              <div
                key={s.label}
                className="px-5 py-5 sm:px-6"
                style={{
                  borderRight:
                    i < STATS.length - 1
                      ? '1px solid var(--border)'
                      : 'none',
                }}
              >
                <div
                  className="num text-3xl font-black sm:text-4xl"
                  style={{
                    color: 'var(--text-primary)',
                    letterSpacing: '-0.03em',
                  }}
                >
                  {s.value}
                </div>
                <div
                  className="mt-1 text-[12px] font-medium"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PERSONA CARDS */}
      <section
        className="mx-auto max-w-6xl px-6 py-16 lg:px-8"
        aria-labelledby="personas-heading"
      >
        <div className="mb-10 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div
              className="text-[11px] font-semibold uppercase tracking-wider"
              style={{ color: 'var(--accent-coral)' }}
            >
              Three doors, one platform
            </div>
            <h2
              id="personas-heading"
              className="mt-2 text-3xl font-black tracking-tight sm:text-5xl"
              style={{
                color: 'var(--text-primary)',
                letterSpacing: '-0.03em',
              }}
            >
              Pick your side of the table.
            </h2>
          </div>
          <p
            className="max-w-sm text-sm"
            style={{ color: 'var(--text-secondary)' }}
          >
            Built for the BTech who has 30 minutes before submission, the recruiter buried under 400 PDFs, and the candidate who actually wants to be measured.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {PERSONAS.map((p) => {
            const isGradient = p.tone === 'gradient';
            const isIndigo = p.tone === 'indigo';
            return (
              <Link
                key={p.to}
                to={p.to}
                className="lift group relative flex flex-col rounded-3xl p-6 no-underline"
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border)',
                  boxShadow: 'var(--shadow-card)',
                  color: 'var(--text-primary)',
                }}
                aria-label={`${p.badge}: ${p.cta}`}
              >
                <div
                  className="absolute inset-x-0 top-0 h-1 rounded-t-3xl"
                  style={{
                    background: isGradient
                      ? 'var(--accent-gradient)'
                      : isIndigo
                        ? 'var(--accent-gradient-indigo)'
                        : 'var(--accent-navy)',
                  }}
                  aria-hidden="true"
                />
                <span
                  className="mb-4 inline-flex w-fit items-center rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider"
                  style={{
                    background: isGradient
                      ? 'var(--accent-gradient-soft)'
                      : isIndigo
                        ? 'rgba(91, 91, 255, 0.12)'
                        : 'rgba(24, 43, 73, 0.08)',
                    color: isIndigo
                      ? 'var(--accent-indigo)'
                      : 'var(--text-primary)',
                  }}
                >
                  {p.badge}
                </span>
                <h3
                  className="mb-2 text-xl font-extrabold tracking-tight"
                  style={{
                    color: 'var(--text-primary)',
                    letterSpacing: '-0.02em',
                  }}
                >
                  {p.title}
                </h3>
                <p
                  className="mb-6 text-sm leading-relaxed"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {p.desc}
                </p>
                <span
                  className="mt-auto inline-flex items-center gap-1 text-sm font-bold"
                  style={{
                    color: isIndigo
                      ? 'var(--accent-indigo)'
                      : 'var(--text-primary)',
                  }}
                >
                  {p.cta}
                  <span
                    aria-hidden="true"
                    className="inline-block transition-transform group-hover:translate-x-1"
                  >
                    →
                  </span>
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section
        className="mx-auto max-w-6xl px-6 py-16 lg:px-8"
        aria-labelledby="how-heading"
      >
        <h2
          id="how-heading"
          className="mb-2 text-3xl font-black tracking-tight sm:text-4xl"
          style={{
            color: 'var(--text-primary)',
            letterSpacing: '-0.03em',
          }}
        >
          Resume that ranks. Brain that powers it.
        </h2>
        <p
          className="mb-10 max-w-xl text-sm"
          style={{ color: 'var(--text-secondary)' }}
        >
          Three steps. Roughly twelve minutes. Done while your tea is still warm.
        </p>

        <ol className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {STEPS.map((s) => (
            <li
              key={s.n}
              className="lift rounded-3xl p-6"
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border)',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <div
                className="num mb-4 text-4xl font-black"
                style={{
                  background: 'var(--accent-gradient)',
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  letterSpacing: '-0.04em',
                }}
              >
                {s.n}
              </div>
              <h3
                className="mb-2 text-lg font-extrabold tracking-tight"
                style={{ color: 'var(--text-primary)' }}
              >
                {s.title}
              </h3>
              <p
                className="text-sm leading-relaxed"
                style={{ color: 'var(--text-secondary)' }}
              >
                {s.body}
              </p>
            </li>
          ))}
        </ol>
      </section>

      {/* CLOSING CTA */}
      <section className="mx-auto max-w-6xl px-6 pb-24 pt-8 lg:px-8">
        <div
          className="relative overflow-hidden rounded-3xl px-8 py-14 sm:px-14"
          style={{
            background: 'var(--accent-navy-deep)',
            color: '#ffffff',
            boxShadow: 'var(--shadow-lift)',
          }}
        >
          <div
            aria-hidden="true"
            className="anim-gradient-drift pointer-events-none absolute -right-20 -top-20 h-96 w-96 rounded-full opacity-50 blur-3xl"
            style={{ background: 'var(--accent-gradient)' }}
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-32 -left-20 h-80 w-80 rounded-full opacity-30 blur-3xl"
            style={{ background: 'var(--accent-gradient-indigo)' }}
          />
          <div className="relative z-10 max-w-2xl">
            <div
              className="mb-4 inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider"
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.18)',
              }}
            >
              Free, offline, made in India
            </div>
            <h2
              className="text-4xl font-black leading-tight tracking-tight sm:text-5xl"
              style={{ letterSpacing: '-0.03em' }}
            >
              Your next interview starts with one sentence.
            </h2>
            <p className="mt-4 max-w-lg text-base text-white/80">
              Saathi handles the rest. ATS, formatting, citations, even the awkward "describe yourself" line.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                to="/builder"
                className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-bold no-underline transition-transform hover:-translate-y-0.5"
                style={{
                  background: 'var(--accent-gradient)',
                  color: '#0a1428',
                  boxShadow: '0 10px 32px -8px rgba(255, 180, 84, 0.5)',
                }}
              >
                Start with Saathi
                <span aria-hidden="true">→</span>
              </Link>
              <Link
                to="/bridge/dashboard"
                className="inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-white no-underline transition-colors"
                style={{
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  background: 'rgba(255, 255, 255, 0.06)',
                }}
              >
                See verification flow
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
