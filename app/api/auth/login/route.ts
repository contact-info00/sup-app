export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyPin, generateToken } from '@/lib/auth'
import { z } from 'zod'

const loginSchema = z.object({
  credential: z.string().min(1, 'Credential is required'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { credential } = loginSchema.parse(body)

    let authenticatedUser: {
      id: string
      name: string
      role: 'ADMIN' | 'EMPLOYEE' | 'MARKET_OWNER'
      marketId: string | null
    } | null = null

    // Auto-detect: 4 digits = PIN, 10 digits = phone
    if (/^\d{4}$/.test(credential)) {
      // PIN login for ADMIN or EMPLOYEE
      try {
        const users = await prisma.user.findMany({
          where: {
            role: { in: ['ADMIN', 'EMPLOYEE', 'admin', 'employee'] },
          },
          select: {
            id: true,
            name: true,
            role: true,
            pinHash: true,
          },
        })

        console.log(`Found ${users.length} users with ADMIN/EMPLOYEE role`)
        for (const user of users) {
          if (!user.pinHash) {
            console.log(`User ${user.id} (${user.name}) has no pinHash, skipping`)
            continue
          }
          try {
            const isValid = await verifyPin(credential, user.pinHash)
            if (isValid) {
              console.log(`PIN verified for user ${user.id} (${user.name}), role: ${user.role}`)
              // Normalize role to uppercase for JWT
              const normalizedRole = user.role.toUpperCase() as 'ADMIN' | 'EMPLOYEE'
              authenticatedUser = {
                id: user.id,
                name: user.name,
                role: normalizedRole,
                marketId: null,
              }
              break
            } else {
              console.log(`PIN verification failed for user ${user.id}`)
            }
          } catch (pinError) {
            console.error('Error verifying PIN:', pinError)
            continue
          }
        }
      } catch (dbError: any) {
        console.error('Database error during PIN login:', dbError)
        console.error('Database error details:', {
          message: dbError?.message,
          code: dbError?.code,
          meta: dbError?.meta,
        })
        return NextResponse.json(
          { 
            error: 'Database error during login',
            details: process.env.NODE_ENV === 'development' ? dbError?.message : undefined
          },
          { status: 500 }
        )
      }
    } else if (/^\d{10}$/.test(credential)) {
      // Phone login for MARKET
      try {
        const market = await prisma.market.findUnique({
          where: { phoneNumber: credential },
          select: {
            id: true,
            name: true,
            phoneNumber: true,
          },
        })

        if (market) {
          console.log(`Market found for phone ${credential}: ${market.name}`)
          authenticatedUser = {
            id: market.id,
            name: market.name,
            role: 'MARKET_OWNER',
            marketId: market.id,
          }
        } else {
          console.log(`No market found for phone: ${credential}`)
        }
      } catch (dbError: any) {
        console.error('Database error during market login:', dbError)
        console.error('Database error details:', {
          message: dbError?.message,
          code: dbError?.code,
          meta: dbError?.meta,
        })
        return NextResponse.json(
          { 
            error: 'Database error during login',
            details: process.env.NODE_ENV === 'development' ? dbError?.message : undefined
          },
          { status: 500 }
        )
      }
    } else {
      return NextResponse.json(
        { error: 'Invalid credential format. Use 4-digit PIN or 10-digit phone number.' },
        { status: 400 }
      )
    }

    if (!authenticatedUser) {
      console.log('No authenticated user found for credential:', credential.substring(0, 1) + '***')
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    // Generate JWT token
    let token: string
    try {
      token = generateToken({
        userId: authenticatedUser.id,
        role: authenticatedUser.role,
        marketId: authenticatedUser.marketId || undefined,
      })
    } catch (tokenError) {
      console.error('Error generating token:', tokenError)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    // Set token in HTTP-only cookie
    const response = NextResponse.json({
      user: {
        id: authenticatedUser.id,
        name: authenticatedUser.name,
        role: authenticatedUser.role,
        marketId: authenticatedUser.marketId,
      },
    })

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })

    return response
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }

    // Handle JSON parsing errors
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 })
    }

    console.error('Login error:', error)
    console.error('Error details:', {
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
    })
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error?.message : undefined
      },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const response = NextResponse.json({ message: 'Logged out' })
    response.cookies.delete('token')
    return response
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json({ message: 'Logged out' })
  }
}