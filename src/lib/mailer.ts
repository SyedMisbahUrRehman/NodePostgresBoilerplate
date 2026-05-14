import nodemailer from 'nodemailer';
import type { Env } from '../config/env.js';
import { logger } from '../common/logger.js';

export type SendMailInput = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

export function createMailTransporter(env: Env) {
  return nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    auth:
      env.SMTP_USER && env.SMTP_PASS
        ? {
            user: env.SMTP_USER,
            pass: env.SMTP_PASS,
          }
        : undefined,
  });
}

export async function sendMail(env: Env, input: SendMailInput): Promise<void> {
  const transporter = createMailTransporter(env);
  try {
    await transporter.sendMail({
      from: env.SMTP_FROM,
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html,
    });
  } catch (err) {
    logger.error({ err }, 'Failed to send email');
    throw err;
  }
}

export function buildPasswordResetEmail(env: Env, email: string, token: string) {
  const url = `${env.APP_URL}/reset-password?token=${encodeURIComponent(token)}`;
  return {
    to: email,
    subject: 'Reset your password',
    text: `You requested a password reset. Use this link (expires soon): ${url}\n\nIf you did not request this, ignore this email.`,
    html: `<p>You requested a password reset.</p><p><a href="${url}">Reset password</a></p><p>If you did not request this, ignore this email.</p>`,
  };
}

export function buildEmailVerificationEmail(env: Env, email: string, token: string) {
  const url = `${env.APP_URL}/verify-email?token=${encodeURIComponent(token)}`;
  return {
    to: email,
    subject: 'Verify your email',
    text: `Verify your email: ${url}`,
    html: `<p>Please <a href="${url}">verify your email</a>.</p>`,
  };
}
