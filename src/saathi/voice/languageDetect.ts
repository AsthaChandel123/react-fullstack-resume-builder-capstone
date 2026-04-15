// /mnt/experiments/astha-resume/src/saathi/voice/languageDetect.ts

export type Script =
  | 'latin'
  | 'devanagari'
  | 'tamil'
  | 'bengali'
  | 'telugu'
  | 'malayalam'
  | 'gujarati'
  | 'kannada'
  | 'punjabi'
  | 'odia';

const SCRIPT_RANGES: Array<{ script: Script; test: RegExp }> = [
  { script: 'devanagari', test: /[\u0900-\u097F]/ },
  { script: 'tamil', test: /[\u0B80-\u0BFF]/ },
  { script: 'bengali', test: /[\u0980-\u09FF]/ },
  { script: 'telugu', test: /[\u0C00-\u0C7F]/ },
  { script: 'malayalam', test: /[\u0D00-\u0D7F]/ },
  { script: 'gujarati', test: /[\u0A80-\u0AFF]/ },
  { script: 'kannada', test: /[\u0C80-\u0CFF]/ },
  { script: 'punjabi', test: /[\u0A00-\u0A7F]/ },
  { script: 'odia', test: /[\u0B00-\u0B7F]/ },
];

/**
 * Detect the dominant script in a text string.
 * Uses Unicode block detection. Returns 'latin' as default.
 */
export function detectScript(text: string): Script {
  let maxCount = 0;
  let dominant: Script = 'latin';

  for (const { script, test } of SCRIPT_RANGES) {
    const matches = text.match(new RegExp(test.source, 'g'));
    const count = matches?.length ?? 0;
    if (count > maxCount) {
      maxCount = count;
      dominant = script;
    }
  }

  return dominant;
}

const SPEECH_LANG_MAP: Record<Script, string> = {
  latin: 'en-IN',
  devanagari: 'hi-IN',
  tamil: 'ta-IN',
  bengali: 'bn-IN',
  telugu: 'te-IN',
  malayalam: 'ml-IN',
  gujarati: 'gu-IN',
  kannada: 'kn-IN',
  punjabi: 'pa-IN',
  odia: 'or-IN',
};

/** Map a detected script to the BCP-47 language tag for Web Speech API */
export function getSpeechLang(script: Script): string {
  return SPEECH_LANG_MAP[script] ?? 'en-IN';
}

/** All supported BCP-47 languages for the speech recognizer */
export const SUPPORTED_SPEECH_LANGS = Object.values(SPEECH_LANG_MAP);
