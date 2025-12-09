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
    const schema = z.object({
      name: z.string().min(1),
      pin: z.string().length(4, 'PIN must be exactly 4 digits'),
      role: z.enum(['employee', 'admin']),
    })

    const data = schema.parse(body)

    // Check if PIN is already in use
    const users = await prisma.user.findMany()
    for (const user of users) {
      const isValid = await verifyPin(data.pin, user.pinHash)
      if (isValid) {
        return NextResponse.json(
          { error: 'PIN already in use' },
          { status: 400 }
        )
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
    console.error('Error creating user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

