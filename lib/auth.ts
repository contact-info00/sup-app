import { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

export interface JWTPayload {
  userId: string
  role: 'ADMIN' | 'EMPLOYEE' | 'MARKET_OWNER'
  marketId?: string
}

/**
 * Hash a 4-digit PIN
 */
export async function hashPin(pin: string): Promise<string> {
  return bcrypt.hash(pin, 10)
}

/**
 * Verify a 4-digit PIN against a hash
 */
export async function verifyPin(pin: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pin, hash)
}

/**
 * Generate JWT token for authenticated user
 */
export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

/**
 * Verify and decode JWT token
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload
  } catch {
    return null
  }
}

/**
 * Get user from request (via JWT token in cookie or Authorization header)
 */
export async function getUserFromRequest(
  request: NextRequest
): Promise<{ userId: string; role: 'ADMIN' | 'EMPLOYEE' | 'MARKET_OWNER'; marketId?: string } | null> {
  try {
    // Try to get token from cookie first
    const token = request.cookies.get('token')?.value || 
                  request.headers.get('authorization')?.replace('Bearer ', '')

    if (!token) {
      return null
    }

    const payload = verifyToken(token)
    if (!payload) {
      return null
    }

    // Check if it's a market (MARKET_OWNER role) or a user
    if (payload.role === 'MARKET_OWNER' && payload.marketId) {
      // For markets, verify market exists
      try {
        const market = await prisma.market.findUnique({
          where: { id: payload.marketId },
          select: {
            id: true,
          },
        })

        if (!market) {
          return null
        }

        return {
          userId: payload.userId,
          role: 'MARKET_OWNER',
          marketId: payload.marketId,
        }
      } catch (dbError) {
        console.error('Database error verifying market:', dbError)
        return null
      }
    } else {
      // For users (ADMIN/EMPLOYEE), verify user exists
      try {
        const user = await prisma.user.findUnique({
          where: { id: payload.userId },
          select: {
            id: true,
            role: true,
          },
        })

        if (!user) {
          return null
        }

        // Normalize role to uppercase
        const normalizedRole = user.role.toUpperCase() as 'ADMIN' | 'EMPLOYEE' | 'MARKET_OWNER'

        return {
          userId: user.id,
          role: normalizedRole,
          marketId: undefined,
        }
      } catch (dbError) {
        console.error('Database error in getUserFromRequest:', dbError)
        return null
      }
    }
  } catch (error) {
    // Any error means auth failed, return null (401 will be handled by caller)
    return null
  }
}

/**
 * Middleware helper to check if user is authenticated
 */
export async function requireAuth(
  request: NextRequest
): Promise<{ userId: string; role: 'ADMIN' | 'EMPLOYEE' | 'MARKET_OWNER'; marketId?: string }> {
  const user = await getUserFromRequest(request)
  if (!user) {
    throw new Error('Unauthorized')
  }
  return user
}

/**
 * Middleware helper to check if user is admin
 */
export async function requireAdmin(
  request: NextRequest
): Promise<{ userId: string; role: 'ADMIN' }> {
  const user = await requireAuth(request)
  // Check if role is ADMIN (already normalized to uppercase in getUserFromRequest)
  if (user.role !== 'ADMIN') {
    throw new Error('Forbidden: Admin access required')
  }
  return user as { userId: string; role: 'ADMIN' }
}




