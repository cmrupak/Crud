import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_BYTES, MIN_PASSWORD_LENGTH } from '../constants';
import { normalizePhone, splitFullName } from '../avatar';
import type { IdentifyInput, ProfileSetupInput, ProfileUpdateInput, RecordInput, RegisterInput } from '../types';

export type FieldErrors = Record<string, string>;

export interface ValidationResult {
  valid: boolean;
  errors: FieldErrors;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\+?\d{7,15}$/;

function result(errors: FieldErrors): ValidationResult {
  return { valid: Object.keys(errors).length === 0, errors };
}

export function validateEmail(email: string): string | undefined {
  const value = email.trim();
  if (!value) return 'Email is required.';
  if (!EMAIL_PATTERN.test(value)) return 'Enter a valid email address.';
  return undefined;
}

export function validatePhone(phone: string): string | undefined {
  const value = normalizePhone(phone);
  if (!value) return 'Phone number is required.';
  if (!PHONE_PATTERN.test(value)) return 'Enter a valid phone number (7–15 digits).';
  return undefined;
}

export function validatePassword(password: string): string | undefined {
  if (!password) return 'Password is required.';
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  return undefined;
}

export function validateRegistration(input: RegisterInput): ValidationResult {
  const errors: FieldErrors = {};
  const { firstName } = splitFullName(input.fullName ?? '');
  if (!firstName) errors.fullName = 'Full name is required.';
  const emailError = validateEmail(input.email);
  if (emailError) errors.email = emailError;
  const phoneError = validatePhone(input.phone);
  if (phoneError) errors.phone = phoneError;
  return result(errors);
}

export function validateIdentify(input: IdentifyInput): ValidationResult {
  const errors: FieldErrors = {};
  const email = input.email?.trim() ?? '';
  const name = input.name?.trim() ?? '';
  const phone = normalizePhone(input.phone ?? '');
  if (!email && !name && !phone) {
    errors.identifier = 'Enter email, name, or phone number.';
  }
  if (email) {
    const emailError = validateEmail(email);
    if (emailError) errors.email = emailError;
  }
  if (phone) {
    const phoneError = validatePhone(phone);
    if (phoneError) errors.phone = phoneError;
  }
  return result(errors);
}

/** @deprecated password login */
export function validateLogin(email: string, password: string): ValidationResult {
  const errors: FieldErrors = {};
  const emailError = validateEmail(email);
  if (emailError) errors.email = emailError;
  if (!password) errors.password = 'Password is required.';
  return result(errors);
}

export function validateRecord(input: RecordInput): ValidationResult {
  const errors: FieldErrors = {};
  if (!input.title.trim()) errors.title = 'Title is required.';
  else if (input.title.trim().length > 120) errors.title = 'Title must be 120 characters or fewer.';
  if (!input.description.trim()) errors.description = 'Description is required.';
  else if (input.description.trim().length > 2000) {
    errors.description = 'Description must be 2000 characters or fewer.';
  }
  if (input.status !== 'active' && input.status !== 'inactive') {
    errors.status = 'Select a valid status.';
  }
  return result(errors);
}

export function validateProfile(input: ProfileUpdateInput): ValidationResult {
  const errors: FieldErrors = {};
  if (!input.firstName.trim()) errors.firstName = 'First name is required.';
  if (!input.lastName.trim()) errors.lastName = 'Last name is required.';
  return result(errors);
}

export function validateProfileSetup(input: ProfileSetupInput): ValidationResult {
  const errors: FieldErrors = {};
  if (input.skip) return result(errors);
  const { firstName } = splitFullName(input.fullName ?? '');
  if (!firstName) errors.fullName = 'Full name is required.';
  const emailError = validateEmail(input.email);
  if (emailError) errors.email = emailError;
  if (input.gender !== 'male' && input.gender !== 'female') {
    errors.gender = 'Select male or female.';
  }
  if (!input.relation?.trim()) errors.relation = 'Select how you are related.';
  if (input.relation === 'other' && !input.relationOther?.trim()) {
    errors.relationOther = 'Please describe your relation.';
  }
  return result(errors);
}

export function validateImageFile(file: { type: string; size: number }): ValidationResult {
  const errors: FieldErrors = {};
  if (!ALLOWED_IMAGE_TYPES.includes(file.type as (typeof ALLOWED_IMAGE_TYPES)[number])) {
    errors.file = 'Use a JPEG, PNG, or WebP image.';
  }
  if (file.size > MAX_IMAGE_BYTES) {
    errors.file = 'Image must be 2 MB or smaller.';
  }
  return result(errors);
}

export function validatePasswordReset(password: string, confirmPassword: string): ValidationResult {
  const errors: FieldErrors = {};
  const passwordError = validatePassword(password);
  if (passwordError) errors.password = passwordError;
  if (!confirmPassword) errors.confirmPassword = 'Please confirm your password.';
  else if (password !== confirmPassword) errors.confirmPassword = 'Passwords do not match.';
  return result(errors);
}
