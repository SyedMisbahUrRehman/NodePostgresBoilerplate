import { z } from 'zod';

export const signupBodySchema = z.object({
  email: z.string().trim().email({ message: 'INVALID_EMAIL' }).max(320),
  password: z
    .string()
    .min(8, { message: 'INVALID_PASSWORD' })
    .max(128, { message: 'INVALID_PASSWORD' }),
});

export const loginBodySchema = z.object({
  email: z.string().trim().email({ message: 'INVALID_EMAIL' }).max(320),
  password: z.string().min(1),
});

export const refreshTokenBodySchema = z.object({
  refreshToken: z.string().min(1),
});

export const logoutBodySchema = z.object({
  refreshToken: z.string().min(1),
});

export const forgotPasswordBodySchema = z.object({
  email: z.string().trim().email({ message: 'INVALID_EMAIL' }).max(320),
});

export const resetPasswordBodySchema = z.object({
  token: z.string().min(1),
  password: z
    .string()
    .min(8, { message: 'INVALID_PASSWORD' })
    .max(128, { message: 'INVALID_PASSWORD' }),
});

export const verifyEmailBodySchema = z.object({
  token: z.string().min(1),
});

export type SignupBody = z.infer<typeof signupBodySchema>;
export type LoginBody = z.infer<typeof loginBodySchema>;
export type RefreshTokenBody = z.infer<typeof refreshTokenBodySchema>;
export type LogoutBody = z.infer<typeof logoutBodySchema>;
export type ForgotPasswordBody = z.infer<typeof forgotPasswordBodySchema>;
export type ResetPasswordBody = z.infer<typeof resetPasswordBodySchema>;
export type VerifyEmailBody = z.infer<typeof verifyEmailBodySchema>;
