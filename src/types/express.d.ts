import type { z, ZodTypeAny } from 'zod';

declare global {
  namespace Express {
    interface Request {
      auth?: {
        userId: string;
        email: string;
      };
      validatedBody?: unknown;
    }
  }
}

export type ValidatedRequest<T extends ZodTypeAny> = Express.Request & {
  validatedBody: z.infer<T>;
};
