import { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

export interface JWTPayload {
  userId: string
  role: 'employee' | 'admin'
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
): Promise<{ userId: string; role: 'employee' | 'admin' } | null> {
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

  return payload
}

/**
 * Middleware helper to check if user is authenticated
 */
export async function requireAuth(
  request: NextRequest
): Promise<{ userId: string; role: 'employee' | 'admin' }> {
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
): Promise<{ userId: string; role: 'admin' }> {
  const user = await requireAuth(request)
  if (user.role !== 'admin') {
    throw new Error('Forbidden: Admin access required')
  }
  return user as { userId: string; role: 'admin' }
}




