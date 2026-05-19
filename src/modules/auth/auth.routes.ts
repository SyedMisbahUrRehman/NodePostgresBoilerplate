import { Router } from 'express';
import { validateBody, requireAuth } from '../../middleware/auth.middleware.js';
import {
  forgotPasswordBodySchema,
  loginBodySchema,
  logoutBodySchema,
  refreshTokenBodySchema,
  resetPasswordBodySchema,
  signupBodySchema,
  verifyEmailBodySchema,
} from './auth.validation.js';
import * as authController from './auth.controller.js';

export function createAuthRouter(): Router {
  const router = Router();

  router.post('/signup', validateBody(signupBodySchema), authController.signup);
  router.post('/login', validateBody(loginBodySchema), authController.login);
  router.post('/refresh-token', validateBody(refreshTokenBodySchema), authController.refreshToken);
  router.post('/logout', validateBody(logoutBodySchema), authController.logout);
  router.post(
    '/forgot-password',
    validateBody(forgotPasswordBodySchema),
    authController.forgotPassword,
  );
  router.post(
    '/reset-password',
    validateBody(resetPasswordBodySchema),
    authController.resetPassword,
  );
  router.post('/verify-email', validateBody(verifyEmailBodySchema), authController.verifyEmail);
  router.get('/me', requireAuth, authController.me);

  return router;
}
