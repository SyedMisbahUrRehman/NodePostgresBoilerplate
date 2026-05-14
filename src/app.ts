import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import type { LevelWithSilent } from 'pino';
import { pinoHttp } from 'pino-http';
import { getEnv } from './config/env.js';
import { createAuthRouter } from './modules/auth/auth.routes.js';
import { errorHandler } from './middleware/error.middleware.js';
import { logger } from './common/logger.js';
import { ErrorCode } from './common/codes.js';
import { sendError } from './common/apiResponse.js';

export function createApp() {
  const env = getEnv();
  const app = express();

  if (env.TRUST_PROXY !== undefined) {
    app.set('trust proxy', env.TRUST_PROXY);
  }

  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGIN === '*' ? true : env.CORS_ORIGIN.split(',').map((s) => s.trim()),
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '1mb' }));

  const limiter = rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.path === '/health',
    handler: (_req, res) => {
      sendError(res, 429, ErrorCode.RATE_LIMIT_EXCEEDED);
    },
  });
  app.use(limiter);

  if (env.ENABLE_REQUEST_LOGS) {
    app.use(
      pinoHttp({
        logger,
        autoLogging: true,
        customLogLevel: (
          _req: express.Request,
          res: express.Response,
          err?: Error,
        ): LevelWithSilent => {
          if (res.statusCode >= 500 || err) return 'error';
          if (res.statusCode >= 400) return 'warn';
          return 'info';
        },
      }),
    );
  }

  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  const apiPrefix = env.API_PREFIX.replace(/\/$/, '');
  app.use(`${apiPrefix}/auth`, createAuthRouter());

  app.use((_req, res) => {
    sendError(res, 404, ErrorCode.NOT_FOUND, {
      message: 'Route not found.',
    });
  });

  app.use(errorHandler);

  return app;
}
