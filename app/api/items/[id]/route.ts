import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { z } from 'zod'

// PUT /api/items/[id] - Update item (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin(request)

    const body = await request.json()
    const schema = z.object({
      categoryId: z.string().min(1).optional(),
      name: z.string().min(1).optional(),
      description: z.string().optional(),
      price: z.number().positive().optional(),
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
    })

    const data = schema.parse(body)

    const item = await prisma.item.update({
      where: { id: params.id },
      data: {
        ...(data.categoryId && { categoryId: data.categoryId }),
        ...(data.name && { name: data.name }),
        ...(data.description !== undefined && { description: data.description || null }),
        ...(data.price && { price: data.price }),
        ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl || null }),
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return NextResponse.json(item)
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden: Admin access required') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      )
    }
    console.error('Error updating item:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/items/[id] - Delete item (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin(request)

    // If item has order history, archive instead of hard delete
    const orderItemsCount = await prisma.orderItem.count({
      where: { itemId: params.id },
    })

    if (orderItemsCount > 0) {
      await prisma.item.update({
        where: { id: params.id },
        data: { archived: true },
      })
      return NextResponse.json({ message: 'Item archived (had existing orders)' })
    }

    // No order history -> safe to delete
    await prisma.item.delete({ where: { id: params.id } })

    return NextResponse.json({ message: 'Item deleted' })
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden: Admin access required') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      )
    }
    console.error('Error deleting item:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


