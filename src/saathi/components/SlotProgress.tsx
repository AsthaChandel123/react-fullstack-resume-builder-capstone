// /mnt/experiments/astha-resume/src/saathi/components/SlotProgress.tsx

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

export function SlotProgress({ filledPercentage, phase }: SlotProgressProps) {
  return (
    <div
      className="flex items-center gap-3 rounded-xl px-4 py-2"
      style={{
        background: 'var(--saathi-accent-teal-light)',
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
            background: 'var(--saathi-accent-teal)',
            transition: 'width var(--saathi-transition)',
          }}
        />
      </div>
      <span
        className="shrink-0 text-xs font-medium"
        style={{ color: 'var(--saathi-accent-teal)' }}
      >
        {filledPercentage}%
      </span>
      <span
        className="shrink-0 text-xs"
        style={{ color: 'var(--text-muted)' }}
      >
        {PHASE_LABELS[phase]}
      </span>
    </div>
  );
}
