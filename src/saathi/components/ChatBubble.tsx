// /mnt/experiments/astha-resume/src/saathi/components/ChatBubble.tsx

import type { ChatMessage } from '../engine/slotMachine';

interface ChatBubbleProps {
  message: ChatMessage;
}

export function ChatBubble({ message }: ChatBubbleProps) {
  const isSaathi = message.role === 'saathi';
  const isSystem = message.role === 'system';

  if (isSystem) {
    return (
      <div className="mb-3 flex justify-center" role="listitem">
        <p
          className="m-0 px-4 py-2 text-center text-xs italic"
          style={{ color: 'var(--text-muted, #888)', lineHeight: '1.5' }}
        >
          {message.text}
        </p>
      </div>
    );
  }

  return (
    <div
      className={`flex ${isSaathi ? 'justify-start' : 'justify-end'} mb-3`}
      role="listitem"
    >
      <div
        className="max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed sm:max-w-[70%]"
        style={{
          background: isSaathi
            ? 'var(--saathi-accent-teal-light)'
            : 'var(--bg-surface)',
          color: 'var(--text-primary)',
          borderRadius: isSaathi
            ? 'var(--saathi-radius) var(--saathi-radius) var(--saathi-radius) 4px'
            : 'var(--saathi-radius) var(--saathi-radius) 4px var(--saathi-radius)',
          border: isSaathi ? 'none' : '1px solid var(--border)',
          lineHeight: 'var(--saathi-line-height)',
        }}
      >
        {isSaathi && (
          <span
            className="mb-1 block text-xs font-semibold"
            style={{ color: 'var(--saathi-accent-teal)' }}
          >
            Saathi
          </span>
        )}
        <p className="m-0 whitespace-pre-wrap">{message.text}</p>
      </div>
    </div>
  );
}
