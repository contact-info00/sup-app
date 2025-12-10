export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'

// GET /api/reports/overview - Get overview metrics for today
export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request)

    const today = new Date()
    const startDate = new Date(today)
    startDate.setHours(0, 0, 0, 0)
    const endDate = new Date(today)
    endDate.setHours(23, 59, 59, 999)

    // Get today's orders
    const orders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        orderItems: {
          include: {
            item: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    })

    // Calculate metrics
    const totalSalesToday = orders.reduce(
      (sum, order) => sum + Number(order.totalPrice),
      0
    )

    const ordersToday = orders.length

    // Find top selling item today
    const itemStats = new Map<string, { name: string; quantity: number }>()
    for (const order of orders) {
      for (const orderItem of order.orderItems) {
        const itemId = orderItem.itemId
        const existing = itemStats.get(itemId)
        if (existing) {
          existing.quantity += orderItem.quantity
        } else {
          itemStats.set(itemId, {
            name: orderItem.item.name,
            quantity: orderItem.quantity,
          })
        }
      }
    }

    const topSellingItem = Array.from(itemStats.values())
      .sort((a, b) => b.quantity - a.quantity)[0] || null

    return NextResponse.json({
      totalSalesToday,
      ordersToday,
      topSellingItem: topSellingItem
        ? {
            name: topSellingItem.name,
            quantity: topSellingItem.quantity,
          }
        : null,
    })
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden: Admin access required') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }
    console.error('Error fetching overview:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}




