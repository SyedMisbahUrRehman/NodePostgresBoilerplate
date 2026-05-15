import argon2 from 'argon2';
import type { Env } from '../../config/env.js';
import { AppError } from '../../common/AppError.js';
import { ErrorCode } from '../../common/codes.js';
import { prisma } from '../../lib/prisma.js';
import { generateOpaqueToken, sha256Hex } from '../../lib/crypto.utils.js';
import { signAccessToken } from '../../lib/jwt.utils.js';
import {
  getEmailVerificationExpiresAt,
  getPasswordResetExpiresAt,
  getRefreshExpiresAt,
} from '../../lib/time.utils.js';
import {
  buildEmailVerificationEmail,
  buildPasswordResetEmail,
  sendMail,
} from '../../lib/mailer.js';
import { logger } from '../../common/logger.js';
import { toPublicUser } from '../user/user.mapper.js';
import type {
  ForgotPasswordBody,
  LoginBody,
  LogoutBody,
  RefreshTokenBody,
  ResetPasswordBody,
  SignupBody,
  VerifyEmailBody,
} from './auth.validation.js';

export async function signupService(env: Env, body: SignupBody) {
  const existing = await prisma.user.findUnique({ where: { email: body.email.toLowerCase() } });
  if (existing) {
    throw new AppError(409, ErrorCode.EMAIL_ALREADY_REGISTERED);
  }

  const passwordHash = await argon2.hash(body.password);
  const email = body.email.toLowerCase();

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      emailVerifiedAt: env.EMAIL_VERIFICATION_ON_SIGNUP ? undefined : new Date(),
    },
  });

  if (env.EMAIL_VERIFICATION_ON_SIGNUP) {
    const plain = generateOpaqueToken();
    const tokenHash = sha256Hex(plain);
    const expiresAt = getEmailVerificationExpiresAt(env);
    await prisma.emailVerificationToken.create({
      data: { userId: user.id, tokenHash, expiresAt },
    });
    try {
      await sendMail(env, buildEmailVerificationEmail(env, user.email, plain));
    } catch {
      logger.warn({ userId: user.id }, 'Signup succeeded but verification email failed');
    }
  }

  const accessToken = signAccessToken(env, { sub: user.id, email: user.email });
  const refreshPlain = generateOpaqueToken();
  const refreshHash = sha256Hex(refreshPlain);
  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: refreshHash,
      expiresAt: getRefreshExpiresAt(env),
    },
  });

  return {
    user: toPublicUser(user),
    accessToken,
    refreshToken: refreshPlain,
  };
}

export async function loginService(env: Env, body: LoginBody) {
  const email = body.email.toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new AppError(401, ErrorCode.INVALID_CREDENTIALS);
  }

  const ok = await argon2.verify(user.passwordHash, body.password);
  if (!ok) {
    throw new AppError(401, ErrorCode.INVALID_CREDENTIALS);
  }

  const accessToken = signAccessToken(env, { sub: user.id, email: user.email });
  const refreshPlain = generateOpaqueToken();
  const refreshHash = sha256Hex(refreshPlain);
  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: refreshHash,
      expiresAt: getRefreshExpiresAt(env),
    },
  });

  return {
    user: toPublicUser(user),
    accessToken,
    refreshToken: refreshPlain,
  };
}

export async function refreshTokenService(env: Env, body: RefreshTokenBody) {
  const hash = sha256Hex(body.refreshToken);
  const record = await prisma.refreshToken.findFirst({
    where: {
      tokenHash: hash,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
  });

  if (!record) {
    throw new AppError(401, ErrorCode.INVALID_REFRESH_TOKEN);
  }

  await prisma.refreshToken.update({
    where: { id: record.id },
    data: { revokedAt: new Date() },
  });

  const user = await prisma.user.findUniqueOrThrow({ where: { id: record.userId } });
  const accessToken = signAccessToken(env, { sub: user.id, email: user.email });
  const refreshPlain = generateOpaqueToken();
  const refreshHash = sha256Hex(refreshPlain);
  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: refreshHash,
      expiresAt: getRefreshExpiresAt(env),
    },
  });

  return {
    user: toPublicUser(user),
    accessToken,
    refreshToken: refreshPlain,
  };
}

export async function logoutService(_env: Env, body: LogoutBody) {
  const hash = sha256Hex(body.refreshToken);
  const record = await prisma.refreshToken.findFirst({
    where: { tokenHash: hash, revokedAt: null },
  });
  if (record) {
    await prisma.refreshToken.update({
      where: { id: record.id },
      data: { revokedAt: new Date() },
    });
  }
}

export async function forgotPasswordService(env: Env, body: ForgotPasswordBody) {
  const email = body.email.toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    return { sent: false as const };
  }

  const plain = generateOpaqueToken();
  const tokenHash = sha256Hex(plain);
  const expiresAt = getPasswordResetExpiresAt(env);

  await prisma.$transaction([
    prisma.passwordResetToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    }),
    prisma.passwordResetToken.create({
      data: { userId: user.id, tokenHash, expiresAt },
    }),
  ]);

  try {
    await sendMail(env, buildPasswordResetEmail(env, user.email, plain));
  } catch {
    logger.error({ userId: user.id }, 'Failed to send password reset email');
  }

  return { sent: true as const };
}

export async function resetPasswordService(_env: Env, body: ResetPasswordBody) {
  const hash = sha256Hex(body.token);
  const record = await prisma.passwordResetToken.findFirst({
    where: {
      tokenHash: hash,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
  });

  if (!record) {
    throw new AppError(400, ErrorCode.PASSWORD_RESET_TOKEN_INVALID);
  }

  const passwordHash = await argon2.hash(body.password);

  await prisma.$transaction([
    prisma.passwordResetToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
    prisma.user.update({
      where: { id: record.userId },
      data: { passwordHash },
    }),
    prisma.refreshToken.updateMany({
      where: { userId: record.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    }),
  ]);

  return { ok: true as const };
}

export async function verifyEmailService(_env: Env, body: VerifyEmailBody) {
  const hash = sha256Hex(body.token);
  const record = await prisma.emailVerificationToken.findFirst({
    where: {
      tokenHash: hash,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
  });

  if (!record) {
    throw new AppError(400, ErrorCode.EMAIL_VERIFICATION_TOKEN_INVALID);
  }

  const user = await prisma.user.findUniqueOrThrow({ where: { id: record.userId } });
  if (user.emailVerifiedAt) {
    throw new AppError(400, ErrorCode.EMAIL_ALREADY_VERIFIED);
  }

  await prisma.$transaction([
    prisma.emailVerificationToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
    prisma.user.update({
      where: { id: user.id },
      data: { emailVerifiedAt: new Date() },
    }),
  ]);

  return { ok: true as const };
}

export async function getProfileService(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new AppError(404, ErrorCode.USER_NOT_FOUND);
  }
  return toPublicUser(user);
}
