export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'

// GET /api/reports/daily-items - Get daily item sold counts for a specific date
export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request)

    const { searchParams } = new URL(request.url)
    const dateParam = searchParams.get('date')

    let startDate: Date
    let endDate: Date

    if (dateParam) {
      // Parse date (YYYY-MM-DD format)
      startDate = new Date(dateParam)
      startDate.setHours(0, 0, 0, 0)
      endDate = new Date(dateParam)
      endDate.setHours(23, 59, 59, 999)
    } else {
      // Default to today
      const today = new Date()
      startDate = new Date(today)
      startDate.setHours(0, 0, 0, 0)
      endDate = new Date(today)
      endDate.setHours(23, 59, 59, 999)
    }

    // Get orders for the date
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

    // Aggregate items by itemId
    const itemCounts = new Map<
      string,
      { itemId: string; itemName: string; totalQuantity: number }
    >()

    for (const order of orders) {
      for (const orderItem of order.orderItems) {
        const itemId = orderItem.itemId
        const existing = itemCounts.get(itemId)

        if (existing) {
          existing.totalQuantity += orderItem.quantity
        } else {
          itemCounts.set(itemId, {
            itemId,
            itemName: orderItem.item.name,
            totalQuantity: orderItem.quantity,
          })
        }
      }
    }

    // Convert to array and sort by quantity descending
    const itemsList = Array.from(itemCounts.values()).sort(
      (a, b) => b.totalQuantity - a.totalQuantity
    )

    return NextResponse.json({
      date: dateParam || new Date().toISOString().split('T')[0],
      items: itemsList,
    })
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message.includes('Forbidden')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Error fetching daily item counts:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

