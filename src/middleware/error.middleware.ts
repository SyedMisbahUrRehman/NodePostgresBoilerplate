import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import jwt from 'jsonwebtoken';
import { AppError } from '../common/AppError.js';
import { ErrorCode } from '../common/codes.js';
import { sendError } from '../common/apiResponse.js';
import { logger } from '../common/logger.js';

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

  if (err instanceof jwt.TokenExpiredError) {
    sendError(res, 401, ErrorCode.TOKEN_EXPIRED);
    return;
  }

  if (err instanceof jwt.JsonWebTokenError) {
    sendError(res, 401, ErrorCode.INVALID_TOKEN);
    return;
  }

  logger.error({ err }, 'Unhandled error');
  sendError(res, 500, ErrorCode.INTERNAL_SERVER_ERROR, {
    stack: err instanceof Error ? err.stack : undefined,
  });
}
