export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { z } from 'zod'

const marketSchema = z.object({
  name: z.string().min(1, 'Market name is required'),
  phoneNumber: z.string().regex(/^\d{10}$/, 'Phone number must be exactly 10 digits'),
  description: z.string().optional(),
})

// GET /api/markets/[id] - Get market by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // @ts-ignore - Market model may not exist in schema
    const market = await prisma.market.findUnique({
      where: { id: params.id },
    })

    if (!market) {
      return NextResponse.json(
        { error: 'Market not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(market)
  } catch (error: any) {
    // Handle case where Market model doesn't exist in schema
    if (error instanceof TypeError && error.message?.includes('Cannot read properties of undefined')) {
      return NextResponse.json(
        { error: 'Markets feature not available. Schema update required.' },
        { status: 501 }
      )
    }
    console.error('Error fetching market:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/markets/[id] - Update market (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin(request)

    const body = await request.json()
    const data = marketSchema.parse(body)

    // @ts-ignore - Market model may not exist in schema
    const market = await prisma.market.update({
      where: { id: params.id },
      data: {
        name: data.name,
        phoneNumber: data.phoneNumber,
        description: data.description || null,
      },
    })

    return NextResponse.json(market)
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
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Market not found' },
        { status: 404 }
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
    console.error('Error updating market:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/markets/[id] - Delete market (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin(request)

    // @ts-ignore - Market model may not exist in schema
    await prisma.market.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: 'Market deleted' })
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
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Market not found' },
        { status: 404 }
      )
    }
    console.error('Error deleting market:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

