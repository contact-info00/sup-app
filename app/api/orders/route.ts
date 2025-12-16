export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { z } from 'zod'

const orderSchema = z.object({
  items: z.array(
    z.object({
      itemId: z.string(),
      quantity: z.number().int().positive(),
      unitPrice: z.number().positive(),
    })
  ),
  marketId: z.string().optional(),
})

// GET /api/orders - List orders (admin sees all, market owner sees their market's orders)
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)

    // All authenticated users can view orders
    try {
      const orders = await prisma.order.findMany({
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
          market: {
            select: {
              id: true,
              name: true,
            },
          },
          orderItems: {
            include: {
              item: {
                select: {
                  id: true,
                  name: true,
                  imageUrl: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      })

      return NextResponse.json(orders)
    } catch (dbError: any) {
      // Handle case where market_id column doesn't exist yet (before migration)
      if (dbError.code === 'P2021' || dbError.message?.includes('market_id') || dbError.message?.includes('does not exist')) {
        // Fallback: fetch orders without market relation
        const orders = await prisma.order.findMany({
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
            orderItems: {
              include: {
                item: {
                  select: {
                    id: true,
                    name: true,
                    imageUrl: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        })
        
        // Add null market to each order
        const ordersWithNullMarket = orders.map(order => ({
          ...order,
          market: null,
        }))
        
        return NextResponse.json(ordersWithNullMarket)
      }
      throw dbError
    }
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    console.error('Error fetching orders:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/orders - Create order (checkout)
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)

    const body = await request.json()
    const data = orderSchema.parse(body)

    if (data.items.length === 0) {
      return NextResponse.json(
        { error: 'Order must contain at least one item' },
        { status: 400 }
      )
    }

    // Determine marketId: use from request if provided, otherwise use user's marketId
    let marketId = data.marketId || user.marketId || null

    // Create order with order items in a transaction
    const order = await prisma.$transaction(async (tx) => {
      // Calculate total price
      const totalPrice = data.items.reduce(
        (sum, item) => sum + item.unitPrice * item.quantity,
        0
      )

      const newOrder = await tx.order.create({
        data: {
          userId: user.userId,
          marketId: marketId,
          total_price: totalPrice,
        },
      })

      const orderItems = await Promise.all(
        data.items.map((item) =>
          tx.orderItem.create({
            data: {
              orderId: newOrder.id,
              itemId: item.itemId,
              quantity: item.quantity,
              unit_price: item.unitPrice,
              lineTotal: item.unitPrice * item.quantity,
            },
          })
        )
      )

      // Update market balance if marketId is provided
      if (marketId) {
        const totalPriceIQD = Math.round(totalPrice) // Convert to integer IQD
        await tx.market.update({
          where: { id: marketId },
          data: {
            balanceDue: { increment: totalPriceIQD },
          },
        })

        // Create ledger entry
        await tx.marketLedger.create({
          data: {
            marketId: marketId,
            amount: totalPriceIQD,
            type: 'CHARGE',
            note: `Order ${newOrder.id.slice(0, 8)}`,
          },
        })
      }

      return { ...newOrder, orderItems }
    })

    return NextResponse.json(order, { status: 201 })
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
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
    console.error('Error creating order:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}




