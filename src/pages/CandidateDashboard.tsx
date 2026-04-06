// /mnt/experiments/astha-resume/src/pages/CandidateDashboard.tsx

import { useState, useMemo } from 'react';
import { useResumeStore } from '@/store/resumeStore';
import {
  computeWellbeing,
  type WellbeingInput,
  type WellbeingResult,
  type SubScore,
} from '@/wellbeing/engine/wellbeingScorer';

function ScoreCard({
  label,
  value,
  suffix,
  color,
}: {
  label: string;
  value: number;
  suffix: string;
  color: string;
}) {
  return (
    <div
      className="rounded-xl p-6 text-center"
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--saathi-radius)',
      }}
    >
      <div
        className="text-xs font-medium uppercase tracking-wider"
        style={{ color: 'var(--text-muted)' }}
      >
        {label}
      </div>
      <div className="mt-2 text-4xl font-extrabold" style={{ color }}>
        {value}
        <span className="text-lg">{suffix}</span>
      </div>
    </div>
  );
}

function SubScoreRow({ sub }: { sub: SubScore & { key: string } }) {
  const barColor =
    sub.score >= 70
      ? 'var(--saathi-success-text)'
      : sub.score >= 40
        ? 'var(--saathi-warning)'
        : 'var(--saathi-concern)';

  return (
    <div
      className="border-b p-4 last:border-b-0"
      style={{ borderColor: 'var(--border)' }}
    >
      <div className="flex items-center justify-between">
        <div>
          <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            {sub.label}
          </span>
          <span className="ml-2 text-xs" style={{ color: 'var(--text-muted)' }}>
            {sub.detail}
          </span>
        </div>
        <span className="text-sm font-bold" style={{ color: barColor }}>
          {sub.score}
        </span>
      </div>
      <div
        className="mt-2 h-1.5 overflow-hidden rounded-full"
        style={{ background: 'var(--border)' }}
      >
        <div
          className="h-full rounded-full"
          style={{
            width: `${sub.score}%`,
            background: barColor,
            transition: 'width var(--saathi-transition)',
          }}
        />
      </div>
      {sub.citations.length > 0 && (
        <p
          className="mt-1 text-xs italic"
          style={{ color: 'var(--text-muted)' }}
        >
          {sub.citations.join('; ')}
        </p>
      )}
    </div>
  );
}

export function CandidateDashboard() {
  const resume = useResumeStore((s) => s.resume);
  const name = resume.personal.name || 'Candidate';

  // For demo/initial state, use reasonable defaults
  const [input] = useState<WellbeingInput>({
    commuteMinutes: 30,
    workHoursPerWeek: 45,
    workMode: 'hybrid',
    offeredSalaryAnnual: 800000,
    officeCity: 'Bangalore',
    candidateCity: resume.personal.location || 'Bangalore',
    industry: 'technology',
    commuteMode: 'transit',
    isRelocation: false,
  });

  const result: WellbeingResult = useMemo(() => computeWellbeing(input), [input]);

  // Simple skills match placeholder (to be wired to orchestrator)
  const skillsMatch = 72;
  const overallFit = Math.round((skillsMatch + result.composite) / 2);

  const subscoreEntries = Object.entries(result.subscores).map(([key, sub]) => ({
    key,
    ...sub,
  }));

  const classification = result.classification;

  return (
    <div
      className="mx-auto max-w-3xl p-4 sm:p-6 lg:p-8"
      style={{
        background: `linear-gradient(180deg, var(--saathi-bg-warm) 0%, var(--saathi-bg-cream) 100%)`,
        minHeight: 'calc(100vh - 120px)',
      }}
    >
      <div className="mb-8 flex items-center justify-between">
        <h1
          className="text-2xl font-extrabold"
          style={{ color: 'var(--text-primary)' }}
        >
          Your Career Health
        </h1>
        <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
          {name}
        </span>
      </div>

      {/* Three score cards */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <ScoreCard
          label="Skills Match"
          value={skillsMatch}
          suffix="%"
          color="var(--saathi-accent-teal)"
        />
        <ScoreCard
          label="Wellbeing Score"
          value={result.composite}
          suffix=""
          color={classification.color}
        />
        <ScoreCard
          label="Overall Fit"
          value={overallFit}
          suffix="%"
          color="var(--saathi-accent-teal)"
        />
      </div>

      {/* Classification banner */}
      <div
        className="mb-8 rounded-xl p-4 text-center"
        style={{
          background: 'var(--saathi-accent-teal-light)',
          borderRadius: 'var(--saathi-radius)',
        }}
      >
        <p
          className="text-sm font-medium"
          style={{ color: classification.color, lineHeight: 'var(--saathi-line-height)' }}
        >
          {classification.message}
        </p>
      </div>

      {/* Life Impact Breakdown */}
      <h2
        className="mb-4 text-lg font-bold"
        style={{ color: 'var(--text-primary)' }}
      >
        Life Impact Breakdown
      </h2>
      <div
        className="mb-8 overflow-hidden rounded-xl"
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--saathi-radius)',
        }}
      >
        {subscoreEntries.map((sub) => (
          <SubScoreRow key={sub.key} sub={sub} />
        ))}
      </div>

      {/* Saathi's Take */}
      <h2
        className="mb-4 text-lg font-bold"
        style={{ color: 'var(--text-primary)' }}
      >
        Saathi's Take
      </h2>
      <div
        className="mb-8 rounded-xl p-5"
        style={{
          background: 'var(--saathi-accent-teal-light)',
          borderRadius: 'var(--saathi-radius)',
          lineHeight: 'var(--saathi-line-height)',
        }}
      >
        <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
          {generateSaathiTake(result, name, input)}
        </p>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          className="min-h-[44px] rounded-xl px-6 py-2 text-sm font-medium text-white"
          style={{
            background: 'var(--saathi-accent-teal)',
            borderRadius: 'var(--saathi-radius)',
          }}
        >
          Apply with Confidence
        </button>
        <button
          type="button"
          className="min-h-[44px] rounded-xl border px-6 py-2 text-sm font-medium"
          style={{
            borderColor: 'var(--border)',
            color: 'var(--text-secondary)',
            borderRadius: 'var(--saathi-radius)',
          }}
        >
          Save for Later
        </button>
      </div>
    </div>
  );
}

function generateSaathiTake(
  result: WellbeingResult,
  name: string,
  input: WellbeingInput,
): string {
  const parts: string[] = [];
  const { subscores } = result;

  // Lead with strengths
  const strengths = Object.values(subscores).filter((s) => s.score >= 80);
  if (strengths.length > 0) {
    parts.push(
      `Good news, ${name}: ${strengths.map((s) => s.label.toLowerCase()).join(' and ')} look strong.`,
    );
  }

  // Flag concerns
  const concerns = Object.values(subscores).filter((s) => s.score < 50);
  if (concerns.length > 0) {
    for (const c of concerns.slice(0, 2)) {
      if (c.label === 'Commute') {
        parts.push(
          `Watch the commute. ${input.commuteMinutes} minutes each way adds up. Consider locations closer to the office, or negotiate an extra WFH day.`,
        );
      } else if (c.label === 'Air Quality') {
        parts.push(
          `Air quality in ${input.officeCity} is a concern. An air purifier at home and an N95 for commute can help.`,
        );
      } else if (c.label === 'Work Hours') {
        parts.push(
          `${input.workHoursPerWeek} hours a week is above the WHO safety threshold. Make sure this is temporary, not the norm.`,
        );
      } else {
        parts.push(`Keep an eye on ${c.label.toLowerCase()}: ${c.detail}.`);
      }
    }
  }

  if (parts.length === 0) {
    parts.push(`This looks like a solid match, ${name}. The numbers back it up.`);
  }

  return parts.join(' ');
}
