import type { Request, Response } from 'express';
import { SuccessCode, ErrorCode } from '../../common/codes.js';
import { sendSuccess } from '../../common/apiResponse.js';
import { asyncHandler } from '../../common/asyncHandler.js';
import { AppError } from '../../common/AppError.js';
import { getEnv } from '../../config/env.js';
import type {
  ForgotPasswordBody,
  LoginBody,
  LogoutBody,
  RefreshTokenBody,
  ResetPasswordBody,
  SignupBody,
  VerifyEmailBody,
} from './auth.validation.js';
import {
  forgotPasswordService,
  getProfileService,
  loginService,
  logoutService,
  refreshTokenService,
  resetPasswordService,
  signupService,
  verifyEmailService,
} from './auth.service.js';

export const signup = asyncHandler(async (req: Request, res: Response) => {
  const env = getEnv();
  const body = req.validatedBody as SignupBody;
  const result = await signupService(env, body);
  const code = env.EMAIL_VERIFICATION_ON_SIGNUP
    ? SuccessCode.EMAIL_VERIFICATION_SENT
    : SuccessCode.SIGNUP_SUCCESSFUL;
  sendSuccess(res, 201, code, result);
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const env = getEnv();
  const body = req.validatedBody as LoginBody;
  const result = await loginService(env, body);
  sendSuccess(res, 200, SuccessCode.LOGIN_SUCCESSFUL, result);
});

export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  const env = getEnv();
  const body = req.validatedBody as RefreshTokenBody;
  const result = await refreshTokenService(env, body);
  sendSuccess(res, 200, SuccessCode.TOKEN_REFRESHED, result);
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const env = getEnv();
  const body = req.validatedBody as LogoutBody;
  await logoutService(env, body);
  sendSuccess(res, 200, SuccessCode.LOGOUT_SUCCESSFUL, {});
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const env = getEnv();
  const body = req.validatedBody as ForgotPasswordBody;
  await forgotPasswordService(env, body);
  sendSuccess(res, 200, SuccessCode.PASSWORD_RESET_EMAIL_SENT, {});
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const env = getEnv();
  const body = req.validatedBody as ResetPasswordBody;
  await resetPasswordService(env, body);
  sendSuccess(res, 200, SuccessCode.PASSWORD_RESET_SUCCESSFUL, {});
});

export const verifyEmail = asyncHandler(async (req: Request, res: Response) => {
  const env = getEnv();
  const body = req.validatedBody as VerifyEmailBody;
  await verifyEmailService(env, body);
  sendSuccess(res, 200, SuccessCode.EMAIL_VERIFIED, {});
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.auth?.userId;
  if (!userId) {
    throw new AppError(401, ErrorCode.UNAUTHORIZED);
  }
  const profile = await getProfileService(userId);
  sendSuccess(res, 200, SuccessCode.PROFILE_RETRIEVED, { user: profile });
});
