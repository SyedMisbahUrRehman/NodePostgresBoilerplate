import type { ErrorCodeType } from './codes.js';
import { ErrorMessage } from './messages.js';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: ErrorCodeType;
  public readonly details?: unknown;

  constructor(statusCode: number, code: ErrorCodeType, message?: string, details?: unknown) {
    super(message ?? ErrorMessage[code]);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}
