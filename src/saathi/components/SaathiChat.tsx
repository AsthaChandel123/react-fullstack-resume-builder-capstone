// /mnt/experiments/astha-resume/src/saathi/components/SaathiChat.tsx

import { useState, useRef, useEffect, useCallback } from 'react';
import { useResumeStore } from '@/store/resumeStore';
import {
  createConversation,
  processUserInput,
  type ConversationState,
} from '../engine/slotMachine';
import { slotsToResume } from '../engine/resumeGenerator';
import { isSpeechSupported, createSpeechInput, type SpeechInput } from '../voice/speechInput';
import { ChatBubble } from './ChatBubble';
import { VoiceButton } from './VoiceButton';
import { SlotProgress } from './SlotProgress';

export function SaathiChat() {
  const [conversation, setConversation] = useState<ConversationState>(() =>
    createConversation(),
  );
  const [inputValue, setInputValue] = useState('');
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const speechRef = useRef<SpeechInput | null>(null);
  const setPersonal = useResumeStore((s) => s.setPersonal);
  const setSummary = useResumeStore((s) => s.setSummary);

  const speechSupported = isSpeechSupported();

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation.messages.length]);

  // Sync conversation state to resume store when complete
  useEffect(() => {
    if (conversation.isComplete) {
      const resume = slotsToResume(conversation.slots);
      setPersonal(resume.personal);
      setSummary(resume.summary);
      // Sections are handled by the resume store reset + rebuild
      const store = useResumeStore.getState();
      // Update sections via store methods
      for (const section of resume.sections) {
        const existing = store.resume.sections.find((s) => s.type === section.type);
        if (existing) {
          for (const entry of section.entries) {
            store.addEntry(existing.id, entry);
          }
        }
      }
    }
  }, [conversation.isComplete, conversation.slots, setPersonal, setSummary]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = inputValue.trim();
      if (!trimmed) return;

      setConversation((prev) => processUserInput(prev, trimmed));
      setInputValue('');
      inputRef.current?.focus();
    },
    [inputValue],
  );

  const handleVoiceToggle = useCallback(() => {
    if (isListening) {
      speechRef.current?.stop();
      setIsListening(false);
      return;
    }

    if (!speechRef.current) {
      speechRef.current = createSpeechInput('en-IN');
      if (!speechRef.current) return;

      speechRef.current.onResult = (transcript, isFinal) => {
        setInputValue(transcript);
        if (isFinal) {
          setConversation((prev) => processUserInput(prev, transcript));
          setInputValue('');
          setIsListening(false);
        }
      };

      speechRef.current.onEnd = () => {
        setIsListening(false);
      };

      speechRef.current.onError = () => {
        setIsListening(false);
      };
    }

    speechRef.current.start();
    setIsListening(true);
  }, [isListening]);

  return (
    <div
      className="flex h-full flex-col"
      style={{
        background: `linear-gradient(180deg, var(--saathi-bg-warm) 0%, var(--saathi-bg-cream) 100%)`,
        minHeight: 'calc(100vh - 120px)',
      }}
    >
      {/* Progress bar */}
      <div className="p-4 pb-0">
        <SlotProgress
          filledPercentage={conversation.filledPercentage}
          phase={conversation.slots.phase}
        />
      </div>

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto p-4"
        role="list"
        aria-label="Conversation with Saathi"
      >
        {conversation.messages.map((msg) => (
          <ChatBubble key={msg.id} message={msg} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div
        className="border-t p-4"
        style={{ borderColor: 'var(--border)', background: 'var(--saathi-bg-warm)' }}
      >
        <form onSubmit={handleSubmit} className="flex gap-2">
          <VoiceButton
            isListening={isListening}
            isSupported={speechSupported}
            onToggle={handleVoiceToggle}
          />
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type or speak..."
            className="min-h-[44px] flex-1 rounded-xl border px-4 py-2 text-sm"
            style={{
              background: 'var(--bg-primary)',
              borderColor: 'var(--border)',
              color: 'var(--text-primary)',
              borderRadius: 'var(--saathi-radius)',
            }}
            aria-label="Message to Saathi"
            autoComplete="off"
          />
          <button
            type="submit"
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl px-4 text-sm font-medium text-white"
            style={{
              background: 'var(--saathi-accent-teal)',
              borderRadius: 'var(--saathi-radius)',
            }}
            aria-label="Send message"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
