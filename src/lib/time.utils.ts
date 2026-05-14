import ms from 'ms';
import type { Env } from '../config/env.js';

export function expiresAtFromDuration(duration: string, from = Date.now()): Date {
  const value = ms(duration as Parameters<typeof ms>[0]);
  if (typeof value !== 'number' || Number.isNaN(value)) {
    throw new Error(`Invalid duration string: ${duration}`);
  }
  return new Date(from + value);
}

export function getRefreshExpiresAt(env: Env): Date {
  return expiresAtFromDuration(env.JWT_REFRESH_EXPIRES_IN);
}

export function getPasswordResetExpiresAt(env: Env): Date {
  return expiresAtFromDuration(env.PASSWORD_RESET_EXPIRES_IN);
}

export function getEmailVerificationExpiresAt(env: Env): Date {
  return expiresAtFromDuration(env.EMAIL_VERIFICATION_EXPIRES_IN);
}
