import { normalizePhone } from './avatar';
import type { IdentifyInput } from './types';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_LIKE = /^\+?[\d\s().-]{7,}$/;

export const IDENTIFIER_PLACEHOLDERS = ['First Name', 'Full Name', 'Email', 'Phone Number'] as const;

export const ONBOARDING_MESSAGES = {
  NOT_FOUND: "We couldn't find an account with those details.",
  ENTER_IDENTIFIER: 'Enter your first name, full name, email, or phone number.',
  NAME_REQUIRED: 'Please enter your full name.',
  VERIFYING: 'Checking your details…',
} as const;

export type IdentifierKind = 'email' | 'phone' | 'name';

export function classifyIdentifier(raw: string): IdentifierKind {
  const value = raw.trim();
  if (!value) return 'name';
  if (value.includes('@') || EMAIL_PATTERN.test(value)) return 'email';
  const digits = normalizePhone(value);
  if (PHONE_LIKE.test(value) && /^\+?\d{7,15}$/.test(digits)) return 'phone';
  return 'name';
}

export function toIdentifyInput(raw: string): IdentifyInput {
  const kind = classifyIdentifier(raw);
  const value = raw.trim();
  if (kind === 'email') return { email: value };
  if (kind === 'phone') return { phone: value };
  return { name: value };
}

export function validateIdentifierInput(raw: string): string | undefined {
  const value = raw.trim();
  if (!value) return ONBOARDING_MESSAGES.ENTER_IDENTIFIER;
  const kind = classifyIdentifier(value);
  if (kind === 'email' && !EMAIL_PATTERN.test(value)) {
    return 'Enter a valid email address.';
  }
  if (kind === 'phone') {
    const phone = normalizePhone(value);
    if (!/^\+?\d{7,15}$/.test(phone)) {
      return 'Enter a valid phone number (7–15 digits).';
    }
  }
  return undefined;
}
