import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Enhance connection string with pool parameters if not already present
function getEnhancedDatabaseUrl(): string {
  const dbUrl = process.env.DATABASE_URL || ''
  if (!dbUrl) return dbUrl

  try {
    const url = new URL(dbUrl)
    // Add connection pool parameters if not present to prevent "connection_limit: 1" errors
    // These parameters help with connection pooling for Supabase and other PostgreSQL providers
    if (!url.searchParams.has('connection_limit')) {
      url.searchParams.set('connection_limit', '10')
    }
    if (!url.searchParams.has('pool_timeout')) {
      url.searchParams.set('pool_timeout', '20')
    }
    // Ensure pgbouncer mode is set for Supabase pooler
    if (url.hostname.includes('supabase') && !url.searchParams.has('pgbouncer')) {
      url.searchParams.set('pgbouncer', 'true')
    }
    return url.toString()
  } catch {
    // If URL parsing fails, return original
    return dbUrl
  }
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: getEnhancedDatabaseUrl(),
    },
  },
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma




