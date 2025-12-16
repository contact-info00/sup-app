export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { z } from 'zod'

const marketSchema = z.object({
  name: z.string().min(1, 'Market name is required'),
  phoneNumber: z.string().regex(/^\d{10}$/, 'Phone number must be exactly 10 digits'),
  description: z.string().optional(),
})

// GET /api/markets - List all markets
export async function GET(request: NextRequest) {
  try {
    // @ts-ignore - Market model may not exist in schema
    const markets = await prisma.market.findMany({
      select: {
        id: true,
        name: true,
        phoneNumber: true,
        description: true,
        balanceDue: true,
      },
      orderBy: { name: 'asc' },
    })
    return NextResponse.json(markets)
  } catch (error: any) {
    // Handle case where Market model doesn't exist in schema
    if (error instanceof TypeError && error.message?.includes('Cannot read properties of undefined')) {
      return NextResponse.json(
        { error: 'Markets feature not available. Schema update required.' },
        { status: 501 }
      )
    }
    console.error('Error fetching markets:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/markets - Create market (admin and employee)
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    // Allow both ADMIN and EMPLOYEE to create markets
    if (user.role !== 'ADMIN' && user.role !== 'EMPLOYEE') {
      return NextResponse.json(
        { error: 'Forbidden: Admin or Employee access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const data = marketSchema.parse(body)

    // @ts-ignore - Market model may not exist in schema
    const market = await prisma.market.create({
      data: {
        name: data.name,
        phoneNumber: data.phoneNumber,
        description: data.description || null,
        balanceDue: 0,
      },
      select: {
        id: true,
        name: true,
        phoneNumber: true,
        description: true,
        balanceDue: true,
      },
    })

    return NextResponse.json(market, { status: 201 })
  } catch (error: any) {
    // Handle case where Market model doesn't exist in schema
    if (error instanceof TypeError && error.message?.includes('Cannot read properties of undefined')) {
      return NextResponse.json(
        { error: 'Markets feature not available. Schema update required.' },
        { status: 501 }
      )
    }
    if (error.message === 'Unauthorized' || error.message.includes('Forbidden')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
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
        { error: 'Phone number already exists' },
        { status: 400 }
      )
    }
    console.error('Error creating market:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

