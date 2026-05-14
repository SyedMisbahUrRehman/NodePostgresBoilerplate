import jwt from 'jsonwebtoken';
import type { StringValue } from 'ms';
import type { Env } from '../config/env.js';

export type AccessTokenPayload = {
  sub: string;
  email: string;
  typ: 'access';
};

export function signAccessToken(
  env: Env,
  payload: Omit<AccessTokenPayload, 'typ'>,
): string {
  const body: AccessTokenPayload = { ...payload, typ: 'access' };
  return jwt.sign(body, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as StringValue,
    issuer: 'api',
    audience: 'api-users',
  });
}

export function verifyAccessToken(env: Env, token: string): AccessTokenPayload {
  const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET, {
    issuer: 'api',
    audience: 'api-users',
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
