export const ERROR_CODES = {
  INVALID_CREDENTIAL: 'INVALID_CREDENTIAL',
  EMAIL_IN_USE: 'EMAIL_IN_USE',
  WEAK_PASSWORD: 'WEAK_PASSWORD',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  TOO_MANY_REQUESTS: 'TOO_MANY_REQUESTS',
  ACCOUNT_INACTIVE: 'ACCOUNT_INACTIVE',
  UNAUTHENTICATED: 'UNAUTHENTICATED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION: 'VALIDATION',
  NETWORK: 'NETWORK',
  UNKNOWN: 'UNKNOWN',
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly fieldErrors?: Record<string, string>;

  constructor(code: ErrorCode, message: string, fieldErrors?: Record<string, string>) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.fieldErrors = fieldErrors;
  }
}

const AUTH_ERROR_MAP: Record<string, { code: ErrorCode; message: string }> = {
  'auth/invalid-credential': {
    code: ERROR_CODES.INVALID_CREDENTIAL,
    message: 'Invalid email or password.',
  },
  'auth/invalid-email': {
    code: ERROR_CODES.VALIDATION,
    message: 'Please enter a valid email address.',
  },
  'auth/user-not-found': {
    code: ERROR_CODES.INVALID_CREDENTIAL,
    message: 'Invalid email or password.',
  },
  'auth/wrong-password': {
    code: ERROR_CODES.INVALID_CREDENTIAL,
    message: 'Invalid email or password.',
  },
  'auth/email-already-in-use': {
    code: ERROR_CODES.EMAIL_IN_USE,
    message: 'An account already exists with this email.',
  },
  'auth/weak-password': {
    code: ERROR_CODES.WEAK_PASSWORD,
    message: 'Password is too weak. Use at least 8 characters.',
  },
  'auth/too-many-requests': {
    code: ERROR_CODES.TOO_MANY_REQUESTS,
    message: 'Too many attempts. Please try again later.',
  },
  'auth/network-request-failed': {
    code: ERROR_CODES.NETWORK,
    message: 'Network error. Check your connection and try again.',
  },
  'auth/user-disabled': {
    code: ERROR_CODES.ACCOUNT_INACTIVE,
    message: 'Your account has been deactivated. Please contact an administrator.',
  },
};

export function toAppError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (typeof error === 'object' && error !== null && 'code' in error) {
    const code = String((error as { code: string }).code);
    const mapped = AUTH_ERROR_MAP[code];
    if (mapped) {
      return new AppError(mapped.code, mapped.message);
    }
  }

  if (error instanceof Error && error.message) {
    return new AppError(ERROR_CODES.UNKNOWN, error.message);
  }

  return new AppError(ERROR_CODES.UNKNOWN, 'Something went wrong. Please try again.');
}

export function getErrorMessage(error: unknown): string {
  return toAppError(error).message;
}
