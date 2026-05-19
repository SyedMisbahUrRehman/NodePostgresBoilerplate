import jwt from 'jsonwebtoken';
import type { StringValue } from 'ms';
import { AppError } from '../common/AppError.js';
import { ErrorCode } from '../common/codes.js';
import type { Env } from '../config/env.js';

export type AccessTokenPayload = {
  sub: string;
  email: string;
  typ: 'access';
};

export function signAccessToken(env: Env, payload: Omit<AccessTokenPayload, 'typ'>): string {
  const body: AccessTokenPayload = { ...payload, typ: 'access' };
  return jwt.sign(body, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as StringValue,
    issuer: 'api',
    audience: 'api-users',
    algorithm: 'HS256',
  });
}

export function verifyAccessToken(env: Env, token: string): AccessTokenPayload {
  const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET, {
    issuer: 'api',
    audience: 'api-users',
    algorithms: ['HS256'],
  });
  if (typeof decoded === 'string' || !decoded || typeof decoded !== 'object') {
    throw new Error('Invalid token payload');
  }
  const sub = 'sub' in decoded ? decoded.sub : undefined;
  const email = 'email' in decoded ? decoded.email : undefined;
  const typ = 'typ' in decoded ? decoded.typ : undefined;
  if (typ !== 'access' || typeof sub !== 'string' || typeof email !== 'string') {
    throw new Error('Invalid access token');
  }
  return { sub, email, typ: 'access' };
}

export function jwtErrorToAppError(err: unknown): AppError | null {
  if (err instanceof jwt.TokenExpiredError) {
    return new AppError(401, ErrorCode.TOKEN_EXPIRED);
  }

  if (err instanceof jwt.JsonWebTokenError) {
    return new AppError(401, ErrorCode.INVALID_TOKEN);
  }

  return null;
}
