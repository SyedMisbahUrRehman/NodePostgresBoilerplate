import type { Response } from 'express';
import type { ErrorCodeType, SuccessCodeType } from './codes.js';
import { SuccessMessage } from './messages.js';
import { ErrorMessage } from './messages.js';
import { getEnv } from '../config/env.js';

export type ApiSuccess<T> = {
  success: true;
  code: SuccessCodeType;
  message: string;
  data: T;
};

export type ApiErrorBody = {
  success: false;
  code: ErrorCodeType;
  message: string;
  details?: unknown;
  stack?: string;
};

export function sendSuccess<T>(
  res: Response,
  statusCode: number,
  code: SuccessCodeType,
  data: T,
  message?: string,
): void {
  const body: ApiSuccess<T> = {
    success: true,
    code,
    message: message ?? SuccessMessage[code],
    data,
  };
  res.status(statusCode).json(body);
}

export function sendError(
  res: Response,
  statusCode: number,
  code: ErrorCodeType,
  options?: { message?: string; details?: unknown; stack?: string },
): void {
  const showStack = getEnv().ENABLE_STACK_TRACE;
  const body: ApiErrorBody = {
    success: false,
    code,
    message: options?.message ?? ErrorMessage[code],
    ...(options?.details !== undefined ? { details: options.details } : {}),
    ...(showStack && options?.stack ? { stack: options.stack } : {}),
  };
  res.status(statusCode).json(body);
}
