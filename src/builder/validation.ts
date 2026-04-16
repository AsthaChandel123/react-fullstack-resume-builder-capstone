// /mnt/experiments/astha-resume/src/builder/validation.ts
//
// Field-level resume validation. Kept deliberately tiny — form uses this
// to surface per-field error messages and to gate share/print actions.
// Not a replacement for downstream server-side checks.

import type { PersonalInfo, Resume } from '@/store/types';

export type PersonalErrors = Partial<Record<keyof PersonalInfo, string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Loose international phone: 7-15 digits, optional +, spaces/dashes allowed.
const PHONE_RE = /^\+?[\d\s\-()]{7,20}$/;
const URL_RE = /^https?:\/\/.+/i;

export function validatePersonal(p: PersonalInfo): PersonalErrors {
  const errors: PersonalErrors = {};
  if (!p.name.trim()) {
    errors.name = 'Name is required.';
  } else if (p.name.trim().length < 2) {
    errors.name = 'Name is too short.';
  }

  if (!p.email.trim()) {
    errors.email = 'Email is required.';
  } else if (!EMAIL_RE.test(p.email.trim())) {
    errors.email = 'Enter a valid email address.';
  }

  if (!p.phone.trim()) {
    errors.phone = 'Phone is required.';
  } else if (!PHONE_RE.test(p.phone.trim())) {
    errors.phone = 'Enter a valid phone number.';
  }

  if (p.linkedin && !URL_RE.test(p.linkedin.trim())) {
    errors.linkedin = 'LinkedIn must start with http:// or https://';
  }
  if (p.github && !URL_RE.test(p.github.trim())) {
    errors.github = 'URL must start with http:// or https://';
  }
  return errors;
}

export interface ResumeValidation {
  personal: PersonalErrors;
  isValid: boolean;
  firstError: string | null;
}

export function validateResume(resume: Resume): ResumeValidation {
  const personal = validatePersonal(resume.personal);
  const personalErrs = Object.values(personal).filter(Boolean);
  const isValid = personalErrs.length === 0;
  return {
    personal,
    isValid,
    firstError: personalErrs[0] ?? null,
  };
}
