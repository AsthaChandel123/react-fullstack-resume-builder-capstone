// Voice-direct Saathi: bidirectional audio with Gemini Live.
// Mic → 16 kHz PCM16 → WS → Gemini → 24 kHz PCM16 + transcript + function calls.

import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useResumeStore } from '@/store/resumeStore';
import { getGeminiApiKey } from '../engine/aiExtractor';
import { slotsToResume } from '../engine/resumeGenerator';
import {
  createConversation,
  fillSlotsFromVoiceArgs,
  loadFromStorage,
  type ConversationState,
  type VoiceFillArgs,
} from '../engine/slotMachine';
import {
  createAudioCapture,
  isVoiceCaptureSupported,
  pcm16ToBase64,
  type AudioCapture,
} from '../voice/audioCapture';
import { createAudioPlayback, type AudioPlayback } from '../voice/audioPlayback';
import { createLiveSession, type LiveSession } from '../voice/liveSession';

type CallStatus =
  | 'idle'
  | 'connecting'
  | 'listening'
  | 'speaking'
  | 'ended'
  | 'error';

interface CaptionEntry {
  id: number;
  text: string;
  final: boolean;
}

interface SaathiVoiceChatProps {
  onSwitchToText?: () => void;
}

function syncSlotsToStore(slots: ConversationState['slots']): void {
  const resume = slotsToResume(slots);
  const store = useResumeStore.getState();
  store.setPersonal(resume.personal);
  store.setSummary(resume.summary);
  for (const section of resume.sections) {
    const existing = store.resume.sections.find((s) => s.type === section.type);
    if (!existing) continue;
    for (const oldEntry of existing.entries) {
      store.removeEntry(existing.id, oldEntry.id);
    }
    for (const entry of section.entries) {
      store.addEntry(existing.id, entry);
    }
  }
}

const STATUS_LABEL: Record<CallStatus, string> = {
  idle: 'Tap the mic to start talking',
  connecting: 'Connecting to Saathi…',
  listening: 'Listening…',
  speaking: 'Saathi is speaking…',
  ended: 'Call ended.',
  error: 'Something went wrong. Try again.',
};

export function SaathiVoiceChat({ onSwitchToText }: SaathiVoiceChatProps) {
  const apiKey = getGeminiApiKey();
  const captureSupported = isVoiceCaptureSupported();
  const enabled = !!apiKey && captureSupported;
  const disabledReason = !captureSupported
    ? 'Microphone capture is not available in this browser. Use Chrome on HTTPS or localhost.'
    : !apiKey
      ? 'Set VITE_GEMINI_API_KEY to enable voice mode.'
      : '';

  const [status, setStatus] = useState<CallStatus>('idle');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [muted, setMuted] = useState(false);
  const [level, setLevel] = useState(0);
  const [captions, setCaptions] = useState<CaptionEntry[]>([]);
  const [callComplete, setCallComplete] = useState(false);
  const [filledPct, setFilledPct] = useState(0);

  const sessionRef = useRef<LiveSession | null>(null);
  const captureRef = useRef<AudioCapture | null>(null);
  const playbackRef = useRef<AudioPlayback | null>(null);
  const conversationRef = useRef<ConversationState>(
    loadFromStorage() ?? createConversation(),
  );
  const captionIdRef = useRef(0);
  const captionsEndRef = useRef<HTMLDivElement>(null);

  const appendCaption = useCallback((text: string, final: boolean) => {
    setCaptions((prev) => {
      const trimmed = text.trim();
      if (!trimmed) return prev;
      // If the previous entry is non-final, replace its text with the
      // accumulated transcript so the captions scroll like a live stream.
      const last = prev[prev.length - 1];
      if (last && !last.final) {
        const merged: CaptionEntry = {
          id: last.id,
          text: trimmed.startsWith(last.text) ? trimmed : `${last.text} ${trimmed}`.trim(),
          final,
        };
        return [...prev.slice(0, -1), merged];
      }
      captionIdRef.current += 1;
      return [...prev, { id: captionIdRef.current, text: trimmed, final }];
    });
  }, []);

  useEffect(() => {
    captionsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [captions.length]);

  const cleanup = useCallback(async () => {
    sessionRef.current?.close();
    sessionRef.current = null;
    await captureRef.current?.stop();
    captureRef.current = null;
    await playbackRef.current?.close();
    playbackRef.current = null;
  }, []);

  useEffect(() => {
    return () => {
      void cleanup();
    };
  }, [cleanup]);

  const endCall = useCallback(
    async (reason: 'complete' | 'user_stopped' | 'error') => {
      await cleanup();
      setStatus(reason === 'error' ? 'error' : 'ended');
      if (reason === 'complete') setCallComplete(true);
    },
    [cleanup],
  );

  const handleFunctionCall = useCallback(
    (id: string | undefined, name: string, args: Record<string, unknown>) => {
      if (name === 'fill_resume_field') {
        const field = typeof args.field === 'string' ? args.field : '';
        const value = typeof args.value === 'string' ? args.value : '';
        if (field && value) {
          const fillArgs: VoiceFillArgs = {
            field: field as VoiceFillArgs['field'],
            value,
            bullets: Array.isArray(args.bullets)
              ? (args.bullets as unknown[]).map((b) => String(b))
              : undefined,
            skills: Array.isArray(args.skills)
              ? (args.skills as unknown[]).map((s) => String(s))
              : undefined,
          };
          try {
            const next = fillSlotsFromVoiceArgs(conversationRef.current, fillArgs);
            conversationRef.current = next;
            setFilledPct(next.requiredFilledPercentage);
            syncSlotsToStore(next.slots);
          } catch (err) {
            if (import.meta.env?.DEV) {
              // eslint-disable-next-line no-console
              console.warn('[saathi.voice] fillSlotsFromVoiceArgs failed', err);
            }
          }
        }
        sessionRef.current?.sendToolResponse(id, name, { result: 'ok' });
        return;
      }
      if (name === 'end_call') {
        const reason =
          (args.reason as 'complete' | 'user_stopped' | 'error' | undefined) ??
          'complete';
        sessionRef.current?.sendToolResponse(id, name, { result: 'ok' });
        // Give the model a beat to finish its closing utterance before we tear
        // the socket down so the user actually hears "Resume ready".
        setTimeout(() => {
          void endCall(reason);
        }, 1500);
        return;
      }
      // Unknown tool — still ack so the model isn't stuck waiting.
      sessionRef.current?.sendToolResponse(id, name, { result: 'unknown_tool' });
    },
    [endCall],
  );

  const startCall = useCallback(async () => {
    if (!enabled) return;
    setErrorMsg('');
    setCaptions([]);
    setCallComplete(false);
    setStatus('connecting');

    const playback = createAudioPlayback({
      sampleRate: 24000,
      onActive: () => setStatus('speaking'),
      onIdle: () => setStatus((prev) => (prev === 'speaking' ? 'listening' : prev)),
    });
    playbackRef.current = playback;

    try {
      await playback.prime();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Audio init failed');
      setStatus('error');
      return;
    }

    const session = createLiveSession({
      apiKey,
      onEvent: (ev) => {
        switch (ev.type) {
          case 'ready':
            setStatus('listening');
            break;
          case 'audio':
            playbackRef.current?.enqueueBase64(ev.base64);
            break;
          case 'transcript':
            appendCaption(ev.text, ev.final);
            break;
          case 'interrupted':
            // Barge-in: user spoke over the model. Drop pending playback.
            playbackRef.current?.flush();
            setStatus('listening');
            break;
          case 'turn_complete':
            setStatus((prev) =>
              prev === 'speaking' || prev === 'listening' ? 'listening' : prev,
            );
            break;
          case 'function_call':
            handleFunctionCall(ev.call.id, ev.call.name, ev.call.args);
            break;
          case 'error':
            setErrorMsg(ev.error);
            setStatus('error');
            break;
          case 'closed':
            setStatus((prev) =>
              prev === 'ended' || prev === 'error' ? prev : 'ended',
            );
            break;
        }
      },
    });
    sessionRef.current = session;

    try {
      await session.connect();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Connection failed');
      setStatus('error');
      await cleanup();
      return;
    }

    const capture = createAudioCapture({
      onFrame: (pcm) => {
        const b64 = pcm16ToBase64(pcm);
        sessionRef.current?.sendAudioChunk(b64);
      },
      onLevel: (l) => setLevel(l),
      onError: (err) => {
        setErrorMsg(err.message || 'Mic capture failed');
        setStatus('error');
      },
    });
    captureRef.current = capture;
    try {
      await capture.start();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Mic permission denied');
      setStatus('error');
      await cleanup();
    }
  }, [apiKey, appendCaption, cleanup, enabled, handleFunctionCall]);

  const stopCall = useCallback(() => {
    void endCall('user_stopped');
  }, [endCall]);

  const toggleMute = useCallback(() => {
    setMuted((prev) => {
      const next = !prev;
      captureRef.current?.setMuted(next);
      return next;
    });
  }, []);

  const restartCall = useCallback(() => {
    void cleanup().then(() => {
      void startCall();
    });
  }, [cleanup, startCall]);

  const ringScale = 1 + Math.min(0.35, level * 0.6);
  const idle = status === 'idle' || status === 'ended' || status === 'error';
  const busy = status === 'connecting';
  const mainAction = idle ? startCall : stopCall;

  return (
    <div
      className="flex h-full flex-col"
      style={{
        background: `linear-gradient(180deg, var(--saathi-bg-warm) 0%, var(--saathi-bg-cream) 100%)`,
        minHeight: 'calc(100vh - 120px)',
      }}
    >
      {/* Header strip with back-to-text toggle */}
      <div className="flex items-center justify-between px-4 pt-4">
        <div
          className="rounded-full px-3 py-1 text-xs font-medium"
          style={{
            background: 'var(--saathi-accent-teal-light)',
            color: 'var(--saathi-accent-teal)',
          }}
        >
          Voice mode · {filledPct}% complete
        </div>
        {onSwitchToText && (
          <button
            type="button"
            onClick={onSwitchToText}
            className="rounded-lg border px-3 py-1 text-xs font-medium"
            style={{
              borderColor: 'var(--border)',
              color: 'var(--text-secondary)',
              background: 'transparent',
            }}
            aria-label="Switch back to text chat"
          >
            Back to text
          </button>
        )}
      </div>

      {/* Mic button + waveform ring */}
      <div className="flex flex-1 flex-col items-center justify-center p-6">
        <button
          type="button"
          onClick={mainAction}
          disabled={!enabled || busy}
          aria-label={
            idle
              ? 'Start voice call with Saathi'
              : 'End voice call'
          }
          aria-pressed={!idle}
          title={disabledReason || undefined}
          className="relative flex items-center justify-center rounded-full"
          style={{
            width: 160,
            height: 160,
            background: idle
              ? 'var(--saathi-accent-teal-light)'
              : 'var(--saathi-accent-teal)',
            color: idle ? 'var(--saathi-accent-teal)' : '#fff',
            border: 'none',
            cursor: enabled && !busy ? 'pointer' : 'not-allowed',
            opacity: enabled ? 1 : 0.5,
            boxShadow: idle ? 'none' : '0 12px 32px rgba(0,0,0,0.18)',
            transition: 'background 300ms ease, box-shadow 300ms ease',
          }}
        >
          {/* Reactive ring */}
          <span
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: -16,
              borderRadius: '50%',
              border: '3px solid var(--saathi-accent-teal)',
              opacity: idle ? 0 : 0.35,
              transform: `scale(${ringScale})`,
              transition: 'transform 80ms ease-out, opacity 200ms ease',
              pointerEvents: 'none',
            }}
          />
          <svg
            width="56"
            height="56"
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
        </button>

        <p
          className="mt-6 text-sm font-medium"
          aria-live="polite"
          style={{ color: 'var(--text-secondary)' }}
        >
          {STATUS_LABEL[status]}
        </p>

        {errorMsg && (
          <p
            className="mt-2 max-w-sm text-center text-xs"
            style={{ color: '#dc2626' }}
            role="alert"
          >
            {errorMsg}
          </p>
        )}

        {disabledReason && (
          <p
            className="mt-2 max-w-sm text-center text-xs"
            style={{ color: 'var(--text-muted)' }}
          >
            {disabledReason}
          </p>
        )}

        {!idle && (
          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={toggleMute}
              className="min-h-[44px] rounded-xl border px-4 py-2 text-sm font-medium"
              style={{
                borderColor: muted ? 'var(--saathi-accent-teal)' : 'var(--border)',
                color: muted ? 'var(--saathi-accent-teal)' : 'var(--text-secondary)',
                background: muted ? 'var(--saathi-accent-teal-light)' : 'transparent',
              }}
              aria-pressed={muted}
            >
              {muted ? 'Mic muted' : 'Mute mic'}
            </button>
            <button
              type="button"
              onClick={stopCall}
              className="min-h-[44px] rounded-xl px-4 py-2 text-sm font-medium text-white"
              style={{ background: '#dc2626' }}
            >
              End call
            </button>
          </div>
        )}

        {status === 'ended' && !callComplete && (
          <button
            type="button"
            onClick={restartCall}
            className="mt-6 min-h-[44px] rounded-xl px-5 py-2 text-sm font-medium text-white"
            style={{ background: 'var(--saathi-accent-teal)' }}
          >
            Talk again
          </button>
        )}
      </div>

      {/* Live captions */}
      <div
        className="mx-4 mb-4 max-h-48 overflow-y-auto rounded-2xl border p-3"
        style={{
          borderColor: 'var(--border)',
          background: 'var(--bg-primary)',
        }}
        aria-live="polite"
        aria-label="Saathi's transcript"
      >
        {captions.length === 0 ? (
          <p
            className="text-center text-xs"
            style={{ color: 'var(--text-muted)' }}
          >
            Saathi's words will appear here while you talk.
          </p>
        ) : (
          captions.map((c) => (
            <p
              key={c.id}
              className="mb-2 text-sm"
              style={{
                color: c.final ? 'var(--text-primary)' : 'var(--text-secondary)',
                opacity: c.final ? 1 : 0.85,
              }}
            >
              {c.text}
            </p>
          ))
        )}
        <div ref={captionsEndRef} />
      </div>

      {callComplete && (
        <div
          className="mx-4 mb-6 rounded-2xl p-5 text-center"
          style={{
            background: 'var(--saathi-accent-teal-light)',
            border: '2px solid var(--saathi-accent-teal)',
          }}
        >
          <p
            className="mb-3 text-base font-semibold"
            style={{ color: 'var(--saathi-accent-teal)' }}
          >
            Resume ready — open the preview.
          </p>
          <Link
            to="/builder/preview"
            className="inline-flex min-h-[44px] items-center justify-center rounded-xl px-5 py-2 text-sm font-medium text-white no-underline"
            style={{ background: 'var(--saathi-accent-teal)' }}
          >
            Open preview
          </Link>
        </div>
      )}
    </div>
  );
}
