import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, requireAdmin } from '@/lib/auth'
import { z } from 'zod'

// GET /api/categories - Get all categories (authenticated users)
export async function GET(request: NextRequest) {
  try {
    await requireAuth(request)

    const categories = await prisma.category.findMany({
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(categories)
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    console.error('Error fetching categories:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/categories - Create category (admin only)
export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request)

    const body = await request.json()
    const schema = z.object({
      name: z.string().min(1),
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
    })

    const data = schema.parse(body)

    const category = await prisma.category.create({
      data: {
        name: data.name,
        description: data.description || null,
        imageUrl: data.imageUrl || null,
      },
    })

    return NextResponse.json(category, { status: 201 })
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
    console.error('Error creating category:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


