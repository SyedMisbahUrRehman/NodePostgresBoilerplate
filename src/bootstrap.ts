import { createApp } from './app.js';
import { getEnv } from './config/env.js';
import { disconnectPrisma } from './lib/prisma.js';
import { logger } from './common/logger.js';

export async function bootstrap(): Promise<void> {
  const env = getEnv();
  const app = createApp();
  const server = app.listen(env.PORT, () => {
    logger.info({ port: env.PORT, env: env.NODE_ENV }, 'Server listening');
  });

  const shutdown = (signal: string) => {
    logger.info({ signal }, 'Shutting down');
    server.close((closeErr) => {
      if (closeErr) {
        logger.error({ err: closeErr }, 'Error while closing HTTP server');
      }
      void disconnectPrisma()
        .catch((err) => logger.error({ err }, 'Error disconnecting Prisma'))
        .finally(() => process.exit(closeErr ? 1 : 0));
    });
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10_000).unref();
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}
