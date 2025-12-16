export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const authUser = await getUserFromRequest(request)
    if (!authUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    try {
      // Handle MARKET_OWNER differently from ADMIN/EMPLOYEE
      if (authUser.role === 'MARKET_OWNER' && authUser.marketId) {
        const marketData = await prisma.market.findUnique({
          where: { id: authUser.marketId },
          select: {
            id: true,
            name: true,
            phoneNumber: true,
          },
        })

        if (!marketData) {
          return NextResponse.json(
            { error: 'Market not found' },
            { status: 404 }
          )
        }

        return NextResponse.json({
          user: {
            id: marketData.id,
            name: marketData.name,
            role: 'MARKET_OWNER',
            marketId: marketData.id,
          },
        })
      } else {
        // Handle ADMIN/EMPLOYEE users
        const userData = await prisma.user.findUnique({
          where: { id: authUser.userId },
          select: {
            id: true,
            name: true,
            role: true,
          },
        })

        if (!userData) {
          return NextResponse.json(
            { error: 'User not found' },
            { status: 404 }
          )
        }

        // Return user data with marketId from authUser if available
        return NextResponse.json({
          user: {
            id: userData.id,
            name: userData.name,
            role: userData.role,
            marketId: authUser.marketId || null,
          },
        })
      }
    } catch (dbError) {
      console.error('Database error in /api/auth/me:', dbError)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  } catch (error) {
    // getUserFromRequest already handles missing/invalid tokens by returning null
    // So this catch is for unexpected errors
    console.error('Unexpected error in /api/auth/me:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}




