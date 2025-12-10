import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { z } from 'zod'

// PUT /api/categories/[id] - Update category (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin(request)

    const body = await request.json()
    const schema = z.object({
      name: z.string().min(1).optional(),
      description: z.string().optional(),
      imageUrl: z
        .string()
        .refine(
          (val) => {
            if (!val || val === '') return true
            return val.startsWith('/uploads/') || val.startsWith('http://') || val.startsWith('https://')
          },
          { message: 'Image URL must be a valid URL or a path starting with /uploads/' }
        )
        .optional()
        .nullable(),
      archived: z.boolean().optional(),
    })

    const data = schema.parse(body)

    const category = await prisma.category.update({
      where: { id: params.id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.description !== undefined && { description: data.description || null }),
        ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl || null }),
        ...(data.archived !== undefined && { archived: data.archived }),
      },
    })

    return NextResponse.json(category)
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden: Admin access required') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      )
    }
    console.error('Error updating category:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/categories/[id] - Delete category (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin(request)

    const { searchParams } = new URL(request.url)
    const force = searchParams.get('force') === 'true'

    // Prevent deleting categories that have items involved in orders unless force=true
    const orderItemsCount = await prisma.orderItem.count({
      where: {
        item: {
          categoryId: params.id,
        },
      },
    })

    if (orderItemsCount > 0 && !force) {
      // Archive instead of delete
      await prisma.category.update({
        where: { id: params.id },
        data: { archived: true },
      })
      return NextResponse.json(
        {
          message:
            'Category archived because items have existing orders. To delete everything, call with ?force=true to remove related orders/items.',
        },
        { status: 200 }
      )
    }

    if (orderItemsCount > 0 && force) {
      // Force delete: delete orderItems -> orders without orderItems -> items -> category
      await prisma.$transaction(async (tx) => {
        // Delete order_items for items in category
        await tx.orderItem.deleteMany({
          where: {
            item: { categoryId: params.id },
          },
        })

        // Delete orders that now have no order_items
        await tx.order.deleteMany({
          where: {
            orderItems: { none: {} },
          },
        })

        // Delete items in category
        await tx.item.deleteMany({
          where: { categoryId: params.id },
        })

        // Delete category
        await tx.category.delete({
          where: { id: params.id },
        })
      })

      return NextResponse.json({ message: 'Category and related data deleted (force)' })
    }

    // No order history -> safe to delete
    await prisma.category.delete({ where: { id: params.id } })

    return NextResponse.json({ message: 'Category deleted' })
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden: Admin access required') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      )
    }
    console.error('Error deleting category:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


