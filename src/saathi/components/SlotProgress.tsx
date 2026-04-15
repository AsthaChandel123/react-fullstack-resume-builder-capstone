// /mnt/experiments/astha-resume/src/saathi/components/SlotProgress.tsx

import { useRef, useEffect } from 'react';
import type { ConversationPhase } from '../engine/slots';

interface SlotProgressProps {
  filledPercentage: number;
  phase: ConversationPhase;
}

const PHASE_LABELS: Record<ConversationPhase, string> = {
  warmup: 'Getting started',
  education: 'Education',
  experience: 'Experience',
  projects: 'Projects',
  skills: 'Skills',
  wrapup: 'Final details',
  review: 'Review',
};

function getMilestoneLabel(pct: number): string {
  if (pct >= 100) return 'Complete!';
  if (pct >= 75) return 'Almost done!';
  if (pct >= 50) return 'Halfway there!';
  if (pct >= 25) return 'Getting started!';
  return '';
}

function getBarColor(pct: number): string {
  if (pct >= 75) return '#22c55e';
  if (pct >= 50) return '#16a34a';
  if (pct >= 25) return '#14b8a6';
  return '#f59e0b';
}

function getBarGlow(pct: number): string {
  if (pct >= 75) return '0 0 8px rgba(34,197,94,0.5)';
  return 'none';
}

/** Detect when percentage crosses a 25-point milestone boundary */
export function crossedMilestone(prev: number, next: number): number | null {
  const milestones = [25, 50, 75, 100];
  for (const m of milestones) {
    if (prev < m && next >= m) return m;
  }
  return null;
}

export function SlotProgress({ filledPercentage, phase }: SlotProgressProps) {
  const prevPct = useRef(filledPercentage);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const milestone = crossedMilestone(prevPct.current, filledPercentage);
    prevPct.current = filledPercentage;
    if (milestone && containerRef.current) {
      const el = containerRef.current;
      el.style.transform = 'scale(1.04)';
      const timer = setTimeout(() => {
        el.style.transform = 'scale(1)';
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [filledPercentage]);

  const milestoneLabel = getMilestoneLabel(filledPercentage);
  const barColor = getBarColor(filledPercentage);
  const barGlow = getBarGlow(filledPercentage);

  return (
    <div
      ref={containerRef}
      className="flex items-center gap-3 rounded-xl px-4 py-2"
      style={{
        background: 'var(--saathi-accent-teal-light)',
        transition: 'transform 300ms ease',
      }}
      role="progressbar"
      aria-valuenow={filledPercentage}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Resume ${filledPercentage}% complete. Currently: ${PHASE_LABELS[phase]}`}
    >
      <div
        className="h-2 flex-1 overflow-hidden rounded-full"
        style={{ background: 'var(--border)' }}
      >
        <div
          className="h-full rounded-full"
          style={{
            width: `${filledPercentage}%`,
            background: barColor,
            boxShadow: barGlow,
            transition: 'width var(--saathi-transition), background 400ms ease, box-shadow 400ms ease',
          }}
        />
      </div>
      <span
        className="shrink-0 text-xs font-medium"
        style={{ color: barColor }}
      >
        {filledPercentage}%
      </span>
      {milestoneLabel && (
        <span
          className="shrink-0 text-xs font-semibold"
          style={{ color: barColor }}
        >
          {milestoneLabel}
        </span>
      )}
      <span
        className="shrink-0 text-xs"
        style={{ color: 'var(--text-muted)' }}
      >
        {PHASE_LABELS[phase]}
      </span>
    </div>
  );
}
