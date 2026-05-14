import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

function prismaLog(): Array<'query' | 'info' | 'warn' | 'error'> {
  if (process.env.NODE_ENV === 'development' && process.env.ENABLE_DEBUG_LOGS === 'true') {
    return ['query', 'error', 'warn'];
  }
  return ['error', 'warn'];
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ log: prismaLog() });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export async function disconnectPrisma(): Promise<void> {
  await prisma.$disconnect();
}
