export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { z } from 'zod'

const balanceUpdateSchema = z.object({
  amount: z.number().int(),
  type: z.enum(['PAYMENT', 'MANUAL']),
  note: z.string().optional(),
})

// POST /api/markets/[id]/balance - Update market balance (payment or manual adjustment)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request)
    // Only ADMIN can update balances
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const data = balanceUpdateSchema.parse(body)

    const marketId = params.id

    // Get current market balance
    const market = await prisma.market.findUnique({
      where: { id: marketId },
      select: { balanceDue: true },
    })

    if (!market) {
      return NextResponse.json({ error: 'Market not found' }, { status: 404 })
    }

    // Calculate new balance
    const amountChange = data.type === 'PAYMENT' ? -data.amount : data.amount

    // Update balance and create ledger entry in transaction
    const result = await prisma.$transaction(async (tx) => {
      const updatedMarket = await tx.market.update({
        where: { id: marketId },
        data: {
          balanceDue: { increment: amountChange },
        },
        select: {
          id: true,
          name: true,
          balanceDue: true,
        },
      })

      await tx.marketLedger.create({
        data: {
          marketId: marketId,
          amount: data.amount,
          type: data.type,
          note: data.note || null,
        },
      })

      return updatedMarket
    })

    return NextResponse.json(result)
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (error.message?.includes('Forbidden')) {
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
    console.error('Error updating market balance:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

