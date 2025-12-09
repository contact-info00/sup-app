import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, requireAdmin } from '@/lib/auth'
import { z } from 'zod'

// GET /api/items - Get items, optionally filtered by category
export async function GET(request: NextRequest) {
  try {
    await requireAuth(request)

    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get('category_id')

    const items = await prisma.item.findMany({
      where: categoryId ? { categoryId } : undefined,
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(items)
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    console.error('Error fetching items:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/items - Create item (admin only)
export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request)

    const body = await request.json()
    const schema = z.object({
      categoryId: z.string().min(1),
      name: z.string().min(1),
      description: z.string().optional(),
      price: z.number().positive(),
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

    const item = await prisma.item.create({
      data: {
        categoryId: data.categoryId,
        name: data.name,
        description: data.description || null,
        price: data.price,
        imageUrl: data.imageUrl || null,
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

    return NextResponse.json(item, { status: 201 })
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    if (error.message === 'Forbidden: Admin access required') {
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
    console.error('Error creating item:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


