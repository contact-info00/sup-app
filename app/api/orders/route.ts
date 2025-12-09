import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { z } from 'zod'

// POST /api/orders - Create order (checkout)
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)

    const body = await request.json()
    const schema = z.object({
      items: z.array(
        z.object({
          itemId: z.string(),
          quantity: z.number().int().positive(),
          unitPrice: z.number().positive(),
        })
      ),
    })

    const { items } = schema.parse(body)

    if (items.length === 0) {
      return NextResponse.json(
        { error: 'Order must contain at least one item' },
        { status: 400 }
      )
    }

    // Calculate total price
    const totalPrice = items.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0
    )

    // Create order with order items in a transaction
    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          userId: user.userId,
          totalPrice,
        },
      })

      const orderItems = await Promise.all(
        items.map((item) =>
          tx.orderItem.create({
            data: {
              orderId: newOrder.id,
              itemId: item.itemId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              lineTotal: item.unitPrice * item.quantity,
            },
          })
        )
      )

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




