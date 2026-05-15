import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../common/AppError.js';
import { ErrorCode } from '../common/codes.js';
import { sendError } from '../common/apiResponse.js';
import { logger } from '../common/logger.js';
import { jwtErrorToAppError } from '../lib/jwt.utils.js';

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    sendError(res, err.statusCode, err.code, {
      message: err.message,
      details: err.details,
    });
    return;
  }

  if (err instanceof ZodError) {
    sendError(res, 400, ErrorCode.VALIDATION_ERROR, {
      details: err.flatten(),
    });
    return;
  }

  const authError = jwtErrorToAppError(err);
  if (authError) {
    sendError(res, authError.statusCode, authError.code);
    return;
  }

  logger.error({ err }, 'Unhandled error');
  sendError(res, 500, ErrorCode.INTERNAL_SERVER_ERROR, {
    stack: err instanceof Error ? err.stack : undefined,
  });
}
