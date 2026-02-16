import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Lazy initialization: defers PrismaClient construction from import-time
// to first use. This prevents build failures on Vercel when DATABASE_URL
// is not available during the build step.
function getClient(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient()
  }
  return globalForPrisma.prisma
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_, property) {
    return getClient()[property as keyof PrismaClient]
  },
})
