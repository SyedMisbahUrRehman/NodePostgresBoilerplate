import { z } from 'zod';
import { ErrorCode } from '../../common/codes.js';

const emailSchema = z.string().trim().email({ message: ErrorCode.INVALID_EMAIL }).max(320);
const signupPasswordSchema = z
  .string()
  .min(8, { message: ErrorCode.INVALID_PASSWORD })
  .max(128, { message: ErrorCode.INVALID_PASSWORD })
  .regex(/[A-Za-z]/, { message: ErrorCode.INVALID_PASSWORD })
  .regex(/\d/, { message: ErrorCode.INVALID_PASSWORD });
const requiredStringSchema = z.string().min(1);

export const signupBodySchema = z.object({
  email: emailSchema,
  password: signupPasswordSchema,
});

export const loginBodySchema = z.object({
  email: emailSchema,
  password: requiredStringSchema,
});

export const refreshTokenBodySchema = z.object({
  refreshToken: requiredStringSchema,
});

export const logoutBodySchema = z.object({
  refreshToken: requiredStringSchema,
});

export const forgotPasswordBodySchema = z.object({
  email: emailSchema,
});

export const resetPasswordBodySchema = z.object({
  token: requiredStringSchema,
  password: signupPasswordSchema,
});

export const verifyEmailBodySchema = z.object({
  token: requiredStringSchema,
});

export type SignupBody = z.infer<typeof signupBodySchema>;
export type LoginBody = z.infer<typeof loginBodySchema>;
export type RefreshTokenBody = z.infer<typeof refreshTokenBodySchema>;
export type LogoutBody = z.infer<typeof logoutBodySchema>;
export type ForgotPasswordBody = z.infer<typeof forgotPasswordBodySchema>;
export type ResetPasswordBody = z.infer<typeof resetPasswordBodySchema>;
export type VerifyEmailBody = z.infer<typeof verifyEmailBodySchema>;
