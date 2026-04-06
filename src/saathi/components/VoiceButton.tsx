// /mnt/experiments/astha-resume/src/saathi/components/VoiceButton.tsx

interface VoiceButtonProps {
  isListening: boolean;
  isSupported: boolean;
  onToggle: () => void;
}

export function VoiceButton({ isListening, isSupported, onToggle }: VoiceButtonProps) {
  if (!isSupported) return null;

  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full transition-all"
      style={{
        background: isListening
          ? 'var(--saathi-accent-teal)'
          : 'var(--bg-surface)',
        color: isListening ? '#fff' : 'var(--text-secondary)',
        border: isListening ? 'none' : '1px solid var(--border)',
        boxShadow: isListening
          ? '0 0 0 4px var(--saathi-accent-teal-light)'
          : 'none',
        transition: 'var(--saathi-transition)',
      }}
      aria-label={isListening ? 'Stop listening' : 'Start voice input'}
      aria-pressed={isListening}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
        <line x1="12" x2="12" y1="19" y2="22" />
      </svg>
      {isListening && (
        <span
          className="ml-1 text-xs font-medium"
          aria-live="polite"
        >
          Listening...
        </span>
      )}
    </button>
  );
}
