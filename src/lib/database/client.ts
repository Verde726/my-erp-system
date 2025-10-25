import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Prisma Client with optimized configuration
 * - Connection pooling for better resource management
 * - Logging in development for debugging
 * - Singleton pattern to prevent multiple instances
 */
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Graceful shutdown handler for production
if (process.env.NODE_ENV === 'production') {
  process.on('beforeExit', async () => {
    console.log('Disconnecting Prisma client...');
    await prisma.$disconnect();
  });

  process.on('SIGINT', async () => {
    console.log('SIGINT received, disconnecting Prisma client...');
    await prisma.$disconnect();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('SIGTERM received, disconnecting Prisma client...');
    await prisma.$disconnect();
    process.exit(0);
  });
}
