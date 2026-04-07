import { describe, it, expect } from 'vitest';
import { detectScript, getSpeechLang } from '../voice/languageDetect';

describe('languageDetect', () => {
  it('detects Devanagari script', () => {
    expect(detectScript('मेरा नाम राहुल है')).toBe('devanagari');
  });

  it('detects Latin script', () => {
    expect(detectScript('My name is Rahul')).toBe('latin');
  });

  it('detects Tamil script', () => {
    expect(detectScript('என் பெயர் ராகுல்')).toBe('tamil');
  });

  it('detects Bengali script', () => {
    expect(detectScript('আমার নাম রাহুল')).toBe('bengali');
  });

  it('returns devanagari for mixed text with Devanagari', () => {
    expect(detectScript('Hello world मेरा')).toBe('devanagari');
  });

  it('maps scripts to BCP-47 speech lang', () => {
    expect(getSpeechLang('devanagari')).toBe('hi-IN');
    expect(getSpeechLang('latin')).toBe('en-IN');
    expect(getSpeechLang('tamil')).toBe('ta-IN');
    expect(getSpeechLang('bengali')).toBe('bn-IN');
  });
});
