export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'

// GET /api/reports/top-selling - Get top selling items
export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request)

    const { searchParams } = new URL(request.url)
    const dateParam = searchParams.get('date')
    const limit = parseInt(searchParams.get('limit') || '10')

    let startDate: Date | undefined
    let endDate: Date | undefined

    if (dateParam) {
      startDate = new Date(dateParam)
      startDate.setHours(0, 0, 0, 0)
      endDate = new Date(dateParam)
      endDate.setHours(23, 59, 59, 999)
    }

    // Get all order items with date filter
    const orderItems = await prisma.orderItem.findMany({
      where: dateParam
        ? {
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
          }
        : undefined,
      include: {
        item: {
          select: {
            id: true,
            name: true,
            price: true,
            imageUrl: true,
            category: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    })

    // Aggregate by item
    const itemStats = new Map<
      string,
      {
        item: any
        totalQuantity: number
        totalRevenue: number
      }
    >()

    for (const orderItem of orderItems) {
      const itemId = orderItem.itemId
      const existing = itemStats.get(itemId)

      if (existing) {
        existing.totalQuantity += orderItem.quantity
        existing.totalRevenue += Number(orderItem.lineTotal)
      } else {
        itemStats.set(itemId, {
          item: orderItem.item,
          totalQuantity: orderItem.quantity,
          totalRevenue: Number(orderItem.lineTotal),
        })
      }
    }

    // Convert to array and sort by quantity
    const topSelling = Array.from(itemStats.values())
      .sort((a, b) => b.totalQuantity - a.totalQuantity)
      .slice(0, limit)

    return NextResponse.json(topSelling)
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden: Admin access required') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }
    console.error('Error fetching top selling items:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}




