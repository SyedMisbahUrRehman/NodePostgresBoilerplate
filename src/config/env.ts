import { z } from 'zod';

const boolFromEnv = z
  .enum(['true', 'false'])
  .default('false')
  .transform((v) => v === 'true');

const trustProxySchema = z
  .string()
  .optional()
  .transform((v) => {
    if (v === undefined || v === '') return undefined;
    if (v === 'true') return true as const;
    if (v === 'false') return false as const;
    const n = Number(v);
    if (!Number.isNaN(n) && Number.isInteger(n)) return n;
    return undefined;
  });

export const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(3000),
    DB_PROVIDER: z.enum(['sqlite', 'postgresql']).default('postgresql'),
    DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
    APP_URL: z.string().url('APP_URL must be a valid URL'),
    API_PREFIX: z.string().default('/api/v1'),

    JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
    JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
    JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
    PASSWORD_RESET_EXPIRES_IN: z.string().default('1h'),
    EMAIL_VERIFICATION_EXPIRES_IN: z.string().default('24h'),

    SMTP_HOST: z.string().min(1),
    SMTP_PORT: z.coerce.number().int().positive(),
    SMTP_USER: z.string().optional(),
    SMTP_PASS: z.string().optional(),
    SMTP_FROM: z.string().min(1),
    SMTP_SECURE: boolFromEnv,

    EMAIL_VERIFICATION_ON_SIGNUP: boolFromEnv,

    LOG_LEVEL: z
      .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
      .default('info'),
    ENABLE_REQUEST_LOGS: z
      .enum(['true', 'false'])
      .default('true')
      .transform((v) => v === 'true'),
    ENABLE_DEBUG_LOGS: boolFromEnv,
    ENABLE_STACK_TRACE: boolFromEnv,
    TRUST_PROXY: trustProxySchema,

    CORS_ORIGIN: z.string().default('*'),
    /** When true, browsers may send cookies / credentialed requests cross-origin. Requires an explicit CORS_ORIGIN allowlist in production. */
    CORS_CREDENTIALS: boolFromEnv,
    RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(900_000),
    RATE_LIMIT_MAX: z.coerce.number().int().positive().default(100),
    AUTH_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(900_000),
    AUTH_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(30),
  })
  .superRefine((env, ctx) => {
    if (env.NODE_ENV === 'production' && env.DB_PROVIDER === 'sqlite') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['DB_PROVIDER'],
        message: 'SQLite is only supported for local development and tests',
      });
    }

    if (env.DB_PROVIDER === 'sqlite' && !env.DATABASE_URL.startsWith('file:')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['DATABASE_URL'],
        message: 'SQLite DATABASE_URL must start with file:',
      });
    }

    if (
      env.DB_PROVIDER === 'postgresql' &&
      !env.DATABASE_URL.startsWith('postgresql://') &&
      !env.DATABASE_URL.startsWith('postgres://')
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['DATABASE_URL'],
        message: 'PostgreSQL DATABASE_URL must start with postgresql:// or postgres://',
      });
    }

    if (env.NODE_ENV === 'production') {
      const origins = env.CORS_ORIGIN.split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      if (origins.length === 0 || origins.includes('*')) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['CORS_ORIGIN'],
          message:
            'In production, CORS_ORIGIN must be a comma-separated list of explicit origins (wildcard * is not allowed).',
        });
      }
      if (env.CORS_CREDENTIALS) {
        for (const o of origins) {
          if (o === '*' || o.startsWith('null')) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ['CORS_ORIGIN'],
              message:
                'When CORS_CREDENTIALS=true, each CORS_ORIGIN entry must be a real origin (not * or null).',
            });
          }
        }
      }
    }

    if (env.CORS_CREDENTIALS && env.CORS_ORIGIN.trim() === '*') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['CORS_CREDENTIALS'],
        message:
          'CORS_CREDENTIALS cannot be true when CORS_ORIGIN is * (browsers forbid credentialed requests with wildcard ACAO). Set CORS_CREDENTIALS=false or list explicit origins.',
      });
    }
  });

export type Env = z.infer<typeof envSchema>;

let cachedEnv: Env | null = null;

export function loadEnv(): Env {
  if (cachedEnv) return cachedEnv;
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const msg = parsed.error.flatten().fieldErrors;
    console.error('Invalid environment variables:', JSON.stringify(msg, null, 2));
    throw new Error('Invalid environment configuration');
  }
  cachedEnv = parsed.data;
  return cachedEnv;
}

export function getEnv(): Env {
  if (!cachedEnv) {
    loadEnv();
  }
  return cachedEnv as Env;
}
