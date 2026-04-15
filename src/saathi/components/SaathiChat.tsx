// /mnt/experiments/astha-resume/src/saathi/components/SaathiChat.tsx

import { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useResumeStore } from '@/store/resumeStore';
import {
  createConversation,
  processUserInputAsync,
  loadFromStorage,
  clearStorage,
  type ConversationState,
  type ChatMessage,
} from '../engine/slotMachine';
import { getGeminiApiKey, getLastExtractionSource, type ExtractionSource } from '../engine/aiExtractor';
import { isModelReady as isLocalGemmaReady } from '@/ai/models/webllmStatus';
import { slotsToResume } from '../engine/resumeGenerator';
import { getResponse } from '../engine/responseBank';
import { isSpeechSupported, createSpeechInput, type SpeechInput } from '../voice/speechInput';
import { detectScript, getSpeechLang } from '../voice/languageDetect';
import { ChatBubble } from './ChatBubble';
import { VoiceButton } from './VoiceButton';
import { SlotProgress, crossedMilestone } from './SlotProgress';

/** Sync partial resume data from conversation slots into the store. */
function syncSlotsToStore(slots: ConversationState['slots']) {
  const resume = slotsToResume(slots);
  const store = useResumeStore.getState();
  store.setPersonal(resume.personal);
  store.setSummary(resume.summary);
  for (const section of resume.sections) {
    const existing = store.resume.sections.find((s) => s.type === section.type);
    if (existing) {
      // Clear existing entries then re-add to avoid duplicates
      for (const oldEntry of existing.entries) {
        store.removeEntry(existing.id, oldEntry.id);
      }
      for (const entry of section.entries) {
        store.addEntry(existing.id, entry);
      }
    }
  }
}

let _systemMsgCounter = 0;
function systemMsgId(): string {
  return `sys-${++_systemMsgCounter}-${Date.now()}`;
}

function TypingIndicator({ thinking = false }: { thinking?: boolean }) {
  return (
    <div className="mb-3 flex justify-start" role="listitem" aria-hidden="true">
      <div
        className="flex items-center gap-1 rounded-2xl px-4 py-3"
        style={{
          background: 'var(--saathi-accent-teal-light)',
          borderRadius: 'var(--saathi-radius) var(--saathi-radius) var(--saathi-radius) 4px',
        }}
      >
        <span
          className="text-xs font-semibold"
          style={{ color: 'var(--saathi-accent-teal)' }}
        >
          {thinking ? 'Saathi is thinking' : 'Saathi is typing'}
        </span>
        <span className="saathi-typing-dots" aria-hidden="true">
          <span className="saathi-dot" />
          <span className="saathi-dot" />
          <span className="saathi-dot" />
        </span>
        <style>{`
          .saathi-typing-dots {
            display: inline-flex;
            gap: 3px;
            margin-left: 4px;
            align-items: center;
          }
          .saathi-dot {
            width: 5px;
            height: 5px;
            border-radius: 50%;
            background: var(--saathi-accent-teal);
            opacity: 0.4;
            animation: saathi-bounce 1.2s infinite ease-in-out;
          }
          .saathi-dot:nth-child(2) { animation-delay: 0.2s; }
          .saathi-dot:nth-child(3) { animation-delay: 0.4s; }
          @keyframes saathi-bounce {
            0%, 80%, 100% { opacity: 0.4; transform: scale(1); }
            40% { opacity: 1; transform: scale(1.2); }
          }
        `}</style>
      </div>
    </div>
  );
}

function AiSourceBadge({ source }: { source: ExtractionSource }) {
  const meta: Record<ExtractionSource, { label: string; color: string; bg: string; title: string }> = {
    'local-gemma': {
      label: 'Gemma (on-device)',
      color: '#22c55e',
      bg: 'rgba(34,197,94,0.15)',
      title: 'Running entirely on this device. Private and offline.',
    },
    'cloud-gemma': {
      label: 'Gemma (cloud)',
      color: '#818cf8',
      bg: 'rgba(99,102,241,0.15)',
      title: 'Gemma via Google Generative Language API. Install on-device model for offline use.',
    },
    'cloud-gemini': {
      label: 'Gemini (cloud)',
      color: '#a78bfa',
      bg: 'rgba(167,139,250,0.15)',
      title: 'Using Gemini 2.5 Flash backup.',
    },
    none: {
      label: 'No AI available',
      color: '#eab308',
      bg: 'rgba(234,179,8,0.15)',
      title: 'No on-device model and no API key. Set VITE_GEMINI_API_KEY or download the local model.',
    },
  };
  const m = meta[source];
  return (
    <div
      className="flex items-center gap-1 rounded-full px-2 py-0.5"
      style={{
        fontSize: '10px',
        fontWeight: 500,
        background: m.bg,
        color: m.color,
        whiteSpace: 'nowrap',
      }}
      title={m.title}
      aria-label={`AI source: ${m.label}`}
    >
      <span
        className="inline-block h-1.5 w-1.5 rounded-full"
        style={{ background: m.color }}
      />
      {m.label}
    </div>
  );
}

function CompletionCTA() {
  return (
    <div
      className="mx-auto my-6 max-w-sm animate-fade-in rounded-2xl p-6 text-center"
      style={{
        background: 'var(--saathi-accent-teal-light)',
        border: '2px solid var(--saathi-accent-teal)',
        borderRadius: 'var(--saathi-radius)',
      }}
    >
      <p
        className="mb-4 text-lg font-semibold"
        style={{ color: 'var(--saathi-accent-teal)' }}
      >
        Your resume is ready!
      </p>
      <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
        <Link
          to="/builder/preview"
          className="inline-flex min-h-[44px] items-center justify-center rounded-xl px-5 py-2 text-sm font-medium text-white no-underline"
          style={{
            background: 'var(--saathi-accent-teal)',
            borderRadius: 'var(--saathi-radius)',
          }}
        >
          Preview Resume
        </Link>
        <Link
          to="/builder/form"
          className="inline-flex min-h-[44px] items-center justify-center rounded-xl border px-5 py-2 text-sm font-medium no-underline"
          style={{
            borderColor: 'var(--saathi-accent-teal)',
            color: 'var(--saathi-accent-teal)',
            borderRadius: 'var(--saathi-radius)',
          }}
        >
          Edit in Form
        </Link>
        <Link
          to="/builder/dashboard"
          className="inline-flex min-h-[44px] items-center justify-center rounded-xl border px-5 py-2 text-sm font-medium no-underline"
          style={{
            borderColor: 'var(--saathi-accent-teal)',
            color: 'var(--saathi-accent-teal)',
            borderRadius: 'var(--saathi-radius)',
          }}
        >
          Career Health Check
        </Link>
      </div>
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fade-in 0.5s ease-out; }
      `}</style>
    </div>
  );
}

export function SaathiChat() {
  const [conversation, setConversation] = useState<ConversationState>(() => {
    const saved = loadFromStorage();
    if (saved) return saved;
    return createConversation();
  });
  const [inputValue, setInputValue] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [showWelcomeBack, setShowWelcomeBack] = useState(() => !!loadFromStorage());
  const [displayedMessages, setDisplayedMessages] = useState<ChatMessage[]>(
    () => {
      const saved = loadFromStorage();
      if (saved) return saved.messages;
      return createConversation().messages;
    },
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const speechRef = useRef<SpeechInput | null>(null);
  const [aiSource, setAiSource] = useState<ExtractionSource>(() =>
    isLocalGemmaReady() ? 'local-gemma' : getGeminiApiKey() ? 'cloud-gemma' : 'none',
  );

  const speechSupported = isSpeechSupported();

  // Show "Welcome back" system message on restore
  useEffect(() => {
    if (showWelcomeBack) {
      const welcomeMsg: ChatMessage = {
        id: systemMsgId(),
        role: 'system',
        text: 'Welcome back! Picking up where we left off.',
        timestamp: Date.now(),
      };
      setDisplayedMessages((prev) => [...prev, welcomeMsg]);
      setShowWelcomeBack(false);
    }
  }, [showWelcomeBack]);

  const handleStartOver = useCallback(() => {
    clearStorage();
    const fresh = createConversation();
    setConversation(fresh);
    setDisplayedMessages(fresh.messages);
    setInputValue('');
  }, []);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [displayedMessages.length, isTyping, isThinking]);

  // When conversation messages change, show typing indicator then reveal new messages
  useEffect(() => {
    const convMsgs = conversation.messages;
    // Find new messages not yet displayed (comparing by length since messages are append-only)
    if (convMsgs.length <= displayedMessages.length) return;

    const newMessages = convMsgs.slice(displayedMessages.length);
    const hasSaathiReply = newMessages.some((m) => m.role === 'saathi');

    if (hasSaathiReply) {
      // Show user message(s) immediately, delay saathi reply
      const userMsgs = newMessages.filter((m) => m.role !== 'saathi');
      if (userMsgs.length > 0) {
        setDisplayedMessages((prev) => [...prev, ...userMsgs]);
      }
      setIsTyping(true);
      const delay = 400 + Math.random() * 400; // 400-800ms
      const timer = setTimeout(() => {
        setIsTyping(false);
        setDisplayedMessages(convMsgs);
      }, delay);
      return () => clearTimeout(timer);
    } else {
      setDisplayedMessages(convMsgs);
    }
  }, [conversation.messages, displayedMessages.length]);

  const applyInput = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      setInputValue('');

      // Always use the AI path. Show thinking indicator, await result.
      setIsThinking(true);

      const userMsg: ChatMessage = {
        id: `msg-pending-${Date.now()}`,
        role: 'user',
        text: trimmed,
        timestamp: Date.now(),
      };
      setDisplayedMessages((prev) => [...prev, userMsg]);

      try {
        const prev = conversation;
        const next = await processUserInputAsync(prev, trimmed);
        setAiSource(getLastExtractionSource());
        syncSlotsToStore(next.slots);

        const milestone = crossedMilestone(prev.requiredFilledPercentage, next.requiredFilledPercentage);
        if (milestone) {
          const name = (next.slots.values.get('personal.name') as string) || '';
          const encouragementText = milestone === 100
            ? '\uD83C\uDF89 You did it! Your resume is complete!'
            : getResponse('encouragement', { name });

          const encouragementMsg: ChatMessage = {
            id: systemMsgId(),
            role: 'saathi',
            text: encouragementText,
            timestamp: Date.now(),
          };

          setConversation({ ...next, messages: [...next.messages, encouragementMsg] });
        } else {
          setConversation(next);
        }
      } catch (err) {
        const errMsg: ChatMessage = {
          id: systemMsgId(),
          role: 'saathi',
          text: "I'm having trouble reaching the AI service. Please try again in a moment.",
          timestamp: Date.now(),
        };
        setConversation((prev) => ({ ...prev, messages: [...prev.messages, errMsg] }));
        if (import.meta.env?.DEV) console.error('[saathi] AI path failed', err);
      } finally {
        setIsThinking(false);
      }

      inputRef.current?.focus();
    },
    [conversation],
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      void applyInput(inputValue);
    },
    [inputValue, applyInput],
  );

  const addSystemMessage = useCallback((text: string) => {
    const msg: ChatMessage = {
      id: systemMsgId(),
      role: 'system',
      text,
      timestamp: Date.now(),
    };
    setDisplayedMessages((prev) => [...prev, msg]);
  }, []);

  const handleVoiceToggle = useCallback(() => {
    if (isListening) {
      speechRef.current?.stop();
      setIsListening(false);
      return;
    }

    if (!speechRef.current) {
      // Detect language from any previous user input, default to en-IN
      const lastUserMsg = conversation.messages.filter((m) => m.role === 'user').pop();
      const detectedScript = lastUserMsg ? detectScript(lastUserMsg.text) : 'latin';
      const speechLang = getSpeechLang(detectedScript);
      speechRef.current = createSpeechInput(speechLang);
      if (!speechRef.current) return;

      speechRef.current.onResult = (transcript, isFinal) => {
        setInputValue(transcript);
        if (isFinal) {
          void applyInput(transcript);
          setIsListening(false);
        }
      };

      speechRef.current.onEnd = () => {
        setIsListening(false);
      };

      speechRef.current.onError = () => {
        setIsListening(false);
        addSystemMessage(
          "I couldn't hear that. Make sure your mic is enabled, or just type instead.",
        );
      };
    }

    // Update language based on recent input
    const recentMsg = conversation.messages.filter((m) => m.role === 'user').pop();
    if (recentMsg) {
      const script = detectScript(recentMsg.text);
      speechRef.current.setLang(getSpeechLang(script));
    }

    speechRef.current.start();
    setIsListening(true);
  }, [isListening, applyInput, addSystemMessage, conversation.messages]);

  return (
    <div
      className="flex h-full flex-col"
      style={{
        background: `linear-gradient(180deg, var(--saathi-bg-warm) 0%, var(--saathi-bg-cream) 100%)`,
        minHeight: 'calc(100vh - 120px)',
      }}
    >
      {/* AI model badge + Progress bar + Start Over */}
      <div className="flex items-center gap-2 p-4 pb-0">
        <AiSourceBadge source={aiSource} />
        <div className="flex-1">
          <SlotProgress
            filledPercentage={conversation.requiredFilledPercentage}
            phase={conversation.slots.phase}
          />
        </div>
        <button
          type="button"
          onClick={handleStartOver}
          className="min-h-[32px] rounded-lg border px-3 py-1 text-xs font-medium"
          style={{
            borderColor: 'var(--border)',
            color: 'var(--text-secondary)',
            background: 'transparent',
          }}
          aria-label="Start over and clear conversation"
        >
          Start Over
        </button>
      </div>

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto p-4"
        role="list"
        aria-label="Conversation with Saathi"
        aria-live="polite"
        aria-relevant="additions"
      >
        {displayedMessages.map((msg) => (
          <ChatBubble key={msg.id} message={msg} />
        ))}
        {isThinking && <TypingIndicator thinking />}
        {isTyping && !isThinking && <TypingIndicator />}
        {conversation.isComplete && !isTyping && !isThinking && <CompletionCTA />}
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
