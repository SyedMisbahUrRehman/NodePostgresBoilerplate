import type { NextFunction, Request, Response } from 'express';
import type { ZodTypeAny } from 'zod';
import { AppError } from '../common/AppError.js';
import { ErrorCode } from '../common/codes.js';
import { sendError } from '../common/apiResponse.js';
import { getEnv } from '../config/env.js';
import { jwtErrorToAppError, verifyAccessToken } from '../lib/jwt.utils.js';

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const env = getEnv();
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw new AppError(401, ErrorCode.UNAUTHORIZED);
    }
    const token = header.slice('Bearer '.length).trim();
    if (!token) {
      throw new AppError(401, ErrorCode.UNAUTHORIZED);
    }
    try {
      const payload = verifyAccessToken(env, token);
      req.auth = { userId: payload.sub, email: payload.email };
      next();
    } catch (err) {
      const authError = jwtErrorToAppError(err);
      if (authError) throw authError;
      throw err;
    }
  } catch (e) {
    next(e);
  }
}

export function validateBody<T extends ZodTypeAny>(schema: T) {
  return (req: Request, res: Response, next: NextFunction) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      sendError(res, 400, ErrorCode.VALIDATION_ERROR, {
        details: parsed.error.flatten(),
      });
      return;
    }
    req.validatedBody = parsed.data;
    next();
  };
}
