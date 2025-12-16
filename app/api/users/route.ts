import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin, hashPin, verifyPin } from '@/lib/auth'
import { z } from 'zod'

// GET /api/users - Get all users (admin only)
export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request)

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(users)
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden: Admin access required') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/users - Create user (admin only)
export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request)

    const body = await request.json()
    
    // Conditional schema based on role
    const baseSchema = z.object({
      name: z.string().min(1),
      role: z.enum(['ADMIN', 'EMPLOYEE']), // MARKET_OWNER not supported without schema fields
    })

    const baseData = baseSchema.parse(body)

    // Only ADMIN and EMPLOYEE roles supported (MARKET_OWNER requires schema fields: phoneNumber, marketId)
    const pinSchema = baseSchema.extend({
      pin: z.string().regex(/^\d{4}$/, 'PIN must be exactly 4 digits'),
    })
    const data = pinSchema.parse(body)

    // Check if PIN is already in use
    const users = await prisma.user.findMany({
      where: {
        role: { in: ['ADMIN', 'EMPLOYEE', 'admin', 'employee'] },
      },
    })
    for (const user of users) {
      if (user.pinHash) {
        const isValid = await verifyPin(data.pin, user.pinHash)
        if (isValid) {
          return NextResponse.json(
            { error: 'PIN already in use' },
            { status: 400 }
          )
        }
      }
    }

    const pinHash = await hashPin(data.pin)

    const user = await prisma.user.create({
      data: {
        name: data.name,
        pinHash,
        role: data.role,
      },
      select: {
        id: true,
        name: true,
        role: true,
        createdAt: true,
      },
    })

    return NextResponse.json(user, { status: 201 })
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden: Admin access required') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Unique constraint violation' },
        { status: 400 }
      )
    }
    console.error('Error creating user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

