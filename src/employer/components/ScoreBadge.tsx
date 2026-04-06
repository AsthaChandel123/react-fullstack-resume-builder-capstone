interface ScoreBadgeProps {
  score: number;
  label?: string;
}

export function ScoreBadge({ score, label }: ScoreBadgeProps) {
  const color =
    score > 75 ? '#16a34a' : score > 50 ? '#ca8a04' : '#dc2626';
  const textColor = '#fff';

  return (
    <span
      className="inline-flex min-h-[28px] min-w-[48px] items-center justify-center rounded-full px-3 py-1 text-sm font-bold"
      style={{ backgroundColor: color, color: textColor }}
      role="status"
      aria-label={label ? `${label}: ${score}%` : `Score: ${score}%`}
    >
      {score}%
    </span>
  );
}
