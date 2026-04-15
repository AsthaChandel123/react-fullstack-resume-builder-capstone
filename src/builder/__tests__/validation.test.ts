import { describe, it, expect } from 'vitest';
import { validatePersonal, validateResume } from '../validation';
import type { PersonalInfo, Resume } from '@/store/types';

function personal(overrides: Partial<PersonalInfo> = {}): PersonalInfo {
  return {
    name: 'Astha Chandel',
    email: 'astha@example.com',
    phone: '+91 98765 43210',
    location: 'Solan',
    linkedin: '',
    github: '',
    ...overrides,
  };
}

describe('validatePersonal', () => {
  it('accepts a fully valid record', () => {
    expect(validatePersonal(personal())).toEqual({});
  });

  it('flags missing required fields', () => {
    const e = validatePersonal(personal({ name: '', email: '', phone: '' }));
    expect(e.name).toMatch(/required/i);
    expect(e.email).toMatch(/required/i);
    expect(e.phone).toMatch(/required/i);
  });

  it('rejects malformed email', () => {
    expect(validatePersonal(personal({ email: 'not-an-email' })).email).toMatch(/valid/i);
    expect(validatePersonal(personal({ email: 'a@b' })).email).toMatch(/valid/i);
  });

  it('rejects too-short phone', () => {
    expect(validatePersonal(personal({ phone: '12345' })).phone).toMatch(/valid/i);
  });

  it('accepts international phone with spaces and dashes', () => {
    expect(validatePersonal(personal({ phone: '+1 (415) 555-1212' })).phone).toBeUndefined();
  });

  it('requires http(s) scheme on linkedin + github when present', () => {
    const e = validatePersonal(personal({ linkedin: 'linkedin.com/in/x', github: 'github.com/y' }));
    expect(e.linkedin).toMatch(/http/);
    expect(e.github).toMatch(/http/);
  });

  it('permits empty optional URLs', () => {
    const e = validatePersonal(personal({ linkedin: '', github: '' }));
    expect(e.linkedin).toBeUndefined();
    expect(e.github).toBeUndefined();
  });

  it('rejects 1-char name as too short', () => {
    expect(validatePersonal(personal({ name: 'A' })).name).toMatch(/short/i);
  });
});

describe('validateResume', () => {
  function resume(p: PersonalInfo): Resume {
    return {
      id: 'test',
      meta: { createdAt: '', updatedAt: '', templateId: 'ats-classic' },
      personal: p,
      summary: '',
      sections: [],
    };
  }

  it('isValid true for clean record', () => {
    const r = validateResume(resume(personal()));
    expect(r.isValid).toBe(true);
    expect(r.firstError).toBeNull();
  });

  it('surfaces first error', () => {
    const r = validateResume(resume(personal({ name: '' })));
    expect(r.isValid).toBe(false);
    expect(r.firstError).toMatch(/name/i);
  });
});
