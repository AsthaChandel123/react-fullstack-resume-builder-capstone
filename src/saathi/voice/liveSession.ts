// WebSocket client for the Gemini Live API (BidiGenerateContent).
//
// Protocol decisions:
//  - Model: `gemini-2.5-flash-preview-native-audio-dialog`. Native-audio
//    dialog gives server-side TTS and barge-in detection, so a CPU-only
//    Chromebook user just needs to send mic frames and play 24 kHz PCM
//    back — no client-side synthesis CPU spend.
//  - Response modality: AUDIO only. We rely on `outputTranscription` for
//    live captions instead of running a separate TEXT response, which
//    would double our token bill and add latency.
//  - Function calling: two tools — `fill_resume_field` (one slot at a
//    time, optional bullets/skills arrays) and `end_call`. We answer
//    every tool call with `{ result: "ok" }` so the model keeps the
//    turn going.
//  - Interruption: when the server emits `interrupted: true` inside
//    `serverContent`, we forward an `interrupted` event so the UI can
//    flush its playback queue instantly.

const WS_BASE =
  'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent';

export const LIVE_MODEL = 'gemini-2.5-flash-preview-native-audio-dialog';

const SYSTEM_PROMPT = `You are Saathi, a warm, plain-spoken resume assistant for Indian users. You are running in voice mode — speak naturally in short, conversational turns. Ask one cluster-style question at a time (e.g., "Tell me your name and where you are based" together; "Your degree, college, year and field of study" together). The user may answer in English, Hindi, Hinglish, Tamil, Telugu, Kannada, Bengali, Marathi, Gujarati or Punjabi — match their language.

CRITICAL TOOL USE RULES:
1. Every time the user gives you any concrete resume field — name, email, phone, location, target role, degree, institution, year, field, GPA, company, role, dates, LinkedIn, GitHub — you MUST call the \`fill_resume_field\` tool BEFORE you respond aloud. One call per field. Pass arrays via the \`bullets\` or \`skills\` parameter only when relevant.
2. Never invent or guess any field. If the user did not say it, do not record it.
3. Once you have collected: name, location, degree, institution, year, field, email and phone — and the user does not want to add more — call the \`end_call\` tool with reason="complete".
4. If the user asks to stop or hang up, call \`end_call\` with reason="user_stopped".

Conversation style:
- Keep replies to 1–2 short sentences. This is a phone call, not an essay.
- Acknowledge before asking: "Got it, B.Tech CSE from Shoolini, 2026." then move on.
- Don't repeat the user's name in every reply.
- If you don't understand, just ask them to repeat in one sentence.
- When you have everything, say "Your resume is ready — open the preview to see it." then call end_call.`;

const FUNCTION_DECLARATIONS = [
  {
    name: 'fill_resume_field',
    description:
      'Record one piece of resume information the user just shared. Never invent values. Call once per concrete field the user actually said.',
    parameters: {
      type: 'OBJECT',
      properties: {
        field: {
          type: 'STRING',
          description:
            'Which resume slot this value fills. Must be one of: name, email, phone, location, targetRole, degree, institution, year, field, gpa, company, role, dates, linkedin, github.',
          enum: [
            'name',
            'email',
            'phone',
            'location',
            'targetRole',
            'degree',
            'institution',
            'year',
            'field',
            'gpa',
            'company',
            'role',
            'dates',
            'linkedin',
            'github',
          ],
        },
        value: {
          type: 'STRING',
          description:
            'The exact value the user said for this field, properly cased and normalized (e.g., "Rahul Sharma", "B.Tech", "Computer Science").',
        },
        bullets: {
          type: 'ARRAY',
          items: { type: 'STRING' },
          description:
            'When the field is `role` or `company` and the user described what they did, include 1-3 short achievement bullets.',
        },
        skills: {
          type: 'ARRAY',
          items: { type: 'STRING' },
          description:
            'When the user mentions tools/languages/frameworks alongside a role or project, list them here. Normalize: react->React, py->Python, node->Node.js.',
        },
      },
      required: ['field', 'value'],
    },
  },
  {
    name: 'end_call',
    description:
      'Call when the user has provided everything needed or asks to stop.',
    parameters: {
      type: 'OBJECT',
      properties: {
        reason: {
          type: 'STRING',
          enum: ['complete', 'user_stopped', 'error'],
          description: 'Why the call is ending.',
        },
      },
      required: ['reason'],
    },
  },
];

// ── Event types emitted to the UI ────────────────────────────────────

export interface FunctionCall {
  id?: string;
  name: string;
  args: Record<string, unknown>;
}

export type LiveEvent =
  | { type: 'open' }
  | { type: 'ready' }
  | { type: 'audio'; base64: string; mimeType: string }
  | { type: 'transcript'; text: string; final: boolean }
  | { type: 'function_call'; call: FunctionCall }
  | { type: 'turn_complete' }
  | { type: 'interrupted' }
  | { type: 'error'; error: string }
  | { type: 'closed'; code: number; reason: string };

export interface LiveSessionOptions {
  apiKey: string;
  /**
   * Optional override; defaults to the native-audio dialog model so the
   * server does TTS for us. The text-prefer model is faster but we'd
   * need browser-side speech synth, which is uneven across devices.
   */
  model?: string;
  /** Optional system-prompt addendum (appended to Saathi persona). */
  systemAddendum?: string;
  onEvent: (event: LiveEvent) => void;
}

export interface LiveSession {
  /** Open the WebSocket and send the setup frame. */
  connect: () => Promise<void>;
  /** Send a single PCM16 16 kHz frame (base64). */
  sendAudioChunk: (base64: string) => void;
  /** Reply to a function call from the server. */
  sendToolResponse: (
    id: string | undefined,
    name: string,
    response: Record<string, unknown>,
  ) => void;
  /** Send the client-content turn that closes a user turn. */
  endUserTurn: () => void;
  /** Close cleanly. */
  close: () => void;
  /** Current connection state. */
  getState: () => 'idle' | 'connecting' | 'open' | 'closing' | 'closed';
}

type SocketState = 'idle' | 'connecting' | 'open' | 'closing' | 'closed';

interface ServerInlineData {
  mimeType?: string;
  data?: string;
}

interface ServerPart {
  text?: string;
  inlineData?: ServerInlineData;
  inline_data?: ServerInlineData;
}

interface ServerContent {
  modelTurn?: { parts?: ServerPart[] };
  model_turn?: { parts?: ServerPart[] };
  turnComplete?: boolean;
  turn_complete?: boolean;
  interrupted?: boolean;
  outputTranscription?: { text?: string; finished?: boolean };
  output_transcription?: { text?: string; finished?: boolean };
}

interface ServerToolCall {
  functionCalls?: { id?: string; name?: string; args?: Record<string, unknown> }[];
  function_calls?: { id?: string; name?: string; args?: Record<string, unknown> }[];
}

interface ServerMessage {
  setupComplete?: unknown;
  setup_complete?: unknown;
  serverContent?: ServerContent;
  server_content?: ServerContent;
  toolCall?: ServerToolCall;
  tool_call?: ServerToolCall;
  goAway?: { timeLeft?: string };
}

export function createLiveSession(opts: LiveSessionOptions): LiveSession {
  const model = opts.model ?? LIVE_MODEL;
  const apiKey = opts.apiKey;
  const systemText = opts.systemAddendum
    ? `${SYSTEM_PROMPT}\n\n${opts.systemAddendum}`
    : SYSTEM_PROMPT;

  let ws: WebSocket | null = null;
  let state: SocketState = 'idle';

  function setState(next: SocketState): void {
    state = next;
  }

  async function connect(): Promise<void> {
    if (state !== 'idle' && state !== 'closed') return;
    setState('connecting');
    const url = `${WS_BASE}?key=${encodeURIComponent(apiKey)}`;
    try {
      ws = new WebSocket(url);
    } catch (err) {
      setState('closed');
      opts.onEvent({
        type: 'error',
        error: err instanceof Error ? err.message : 'WebSocket construct failed',
      });
      throw err;
    }
    ws.binaryType = 'arraybuffer';

    return new Promise<void>((resolve, reject) => {
      if (!ws) return reject(new Error('No socket'));
      const sock = ws;
      let settled = false;

      sock.onopen = () => {
        setState('open');
        opts.onEvent({ type: 'open' });
        // Send the setup frame immediately.
        sock.send(
          JSON.stringify({
            setup: {
              model: `models/${model}`,
              generationConfig: {
                responseModalities: ['AUDIO'],
                speechConfig: {
                  voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: 'Aoede' },
                  },
                },
              },
              systemInstruction: {
                parts: [{ text: systemText }],
              },
              tools: [{ functionDeclarations: FUNCTION_DECLARATIONS }],
              outputAudioTranscription: {},
            },
          }),
        );
      };

      sock.onmessage = async (event: MessageEvent) => {
        try {
          let text: string;
          if (typeof event.data === 'string') {
            text = event.data;
          } else if (event.data instanceof ArrayBuffer) {
            text = new TextDecoder().decode(new Uint8Array(event.data));
          } else if (typeof Blob !== 'undefined' && event.data instanceof Blob) {
            text = await event.data.text();
          } else {
            return;
          }
          const msg = JSON.parse(text) as ServerMessage;
          handleServerMessage(msg);
          if (!settled && (msg.setupComplete !== undefined || msg.setup_complete !== undefined)) {
            settled = true;
            opts.onEvent({ type: 'ready' });
            resolve();
          }
        } catch (err) {
          if (import.meta.env?.DEV) {
            // eslint-disable-next-line no-console
            console.error('[saathi.live] message parse failed', err);
          }
        }
      };

      sock.onerror = () => {
        if (!settled) {
          settled = true;
          reject(new Error('WebSocket error'));
        }
        opts.onEvent({ type: 'error', error: 'WebSocket error' });
      };

      sock.onclose = (ev: CloseEvent) => {
        setState('closed');
        opts.onEvent({
          type: 'closed',
          code: ev.code,
          reason: ev.reason || '',
        });
        if (!settled) {
          settled = true;
          reject(new Error(`Closed before ready (${ev.code})`));
        }
      };
    });
  }

  function handleServerMessage(msg: ServerMessage): void {
    const content = msg.serverContent ?? msg.server_content;
    if (content) {
      if (content.interrupted) {
        opts.onEvent({ type: 'interrupted' });
      }
      const parts =
        content.modelTurn?.parts ?? content.model_turn?.parts ?? [];
      for (const part of parts) {
        const inline = part.inlineData ?? part.inline_data;
        if (inline?.data && inline.mimeType?.startsWith('audio/')) {
          opts.onEvent({
            type: 'audio',
            base64: inline.data,
            mimeType: inline.mimeType,
          });
        }
        if (part.text) {
          opts.onEvent({
            type: 'transcript',
            text: part.text,
            final: false,
          });
        }
      }
      const transcription =
        content.outputTranscription ?? content.output_transcription;
      if (transcription?.text) {
        opts.onEvent({
          type: 'transcript',
          text: transcription.text,
          final: !!transcription.finished,
        });
      }
      if (content.turnComplete || content.turn_complete) {
        opts.onEvent({ type: 'turn_complete' });
      }
    }

    const tool = msg.toolCall ?? msg.tool_call;
    if (tool) {
      const calls = tool.functionCalls ?? tool.function_calls ?? [];
      for (const call of calls) {
        opts.onEvent({
          type: 'function_call',
          call: {
            id: call.id,
            name: call.name ?? '',
            args: call.args ?? {},
          },
        });
      }
    }
  }

  function sendAudioChunk(base64: string): void {
    if (!ws || state !== 'open') return;
    try {
      ws.send(
        JSON.stringify({
          realtimeInput: {
            mediaChunks: [
              { mimeType: 'audio/pcm;rate=16000', data: base64 },
            ],
          },
        }),
      );
    } catch {
      /* ignore transient send failure */
    }
  }

  function sendToolResponse(
    id: string | undefined,
    name: string,
    response: Record<string, unknown>,
  ): void {
    if (!ws || state !== 'open') return;
    const fr: Record<string, unknown> = { name, response };
    if (id) fr.id = id;
    try {
      ws.send(
        JSON.stringify({
          toolResponse: {
            functionResponses: [fr],
          },
        }),
      );
    } catch {
      /* ignore */
    }
  }

  function endUserTurn(): void {
    if (!ws || state !== 'open') return;
    try {
      ws.send(
        JSON.stringify({
          clientContent: {
            turnComplete: true,
          },
        }),
      );
    } catch {
      /* ignore */
    }
  }

  function close(): void {
    if (!ws) return;
    if (state === 'closed' || state === 'closing') return;
    setState('closing');
    try {
      ws.close(1000, 'client closed');
    } catch {
      /* ignore */
    }
  }

  return {
    connect,
    sendAudioChunk,
    sendToolResponse,
    endUserTurn,
    close,
    getState: () => state,
  };
}
