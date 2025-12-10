export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyPin, generateToken } from '@/lib/auth'
import { z } from 'zod'

const loginSchema = z.object({
  pin: z.string().length(4, 'PIN must be exactly 4 digits'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { pin } = loginSchema.parse(body)

    // Find user by PIN (we need to check all users since PINs are unique)
    const users = await prisma.user.findMany()
    let authenticatedUser = null

    for (const user of users) {
      const isValid = await verifyPin(pin, user.pinHash)
      if (isValid) {
        authenticatedUser = user
        break
      }
    }

    if (!authenticatedUser) {
      return NextResponse.json(
        { error: 'Invalid PIN' },
        { status: 401 }
      )
    }

    // Generate JWT token
    const token = generateToken({
      userId: authenticatedUser.id,
      role: authenticatedUser.role as 'employee' | 'admin',
    })

    // Set token in HTTP-only cookie
    const response = NextResponse.json({
      user: {
        id: authenticatedUser.id,
        name: authenticatedUser.name,
        role: authenticatedUser.role,
      },
    })

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })

    return response
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  const response = NextResponse.json({ message: 'Logged out' })
  response.cookies.delete('token')
  return response
}




