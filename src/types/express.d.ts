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

export {};
