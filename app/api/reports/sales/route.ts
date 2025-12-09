import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'

// GET /api/reports/sales - Get sales report for a specific date
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
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Calculate totals
    const totalRevenue = orders.reduce(
      (sum, order) => sum + Number(order.totalPrice),
      0
    )

    const totalOrders = orders.length

    // Calculate items sold
    const itemsSold = orders.reduce(
      (sum, order) =>
        sum + order.orderItems.reduce((itemSum, item) => itemSum + item.quantity, 0),
      0
    )

    return NextResponse.json({
      date: dateParam || new Date().toISOString().split('T')[0],
      totalRevenue,
      totalOrders,
      itemsSold,
      orders,
    })
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden: Admin access required') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }
    console.error('Error fetching sales report:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}




