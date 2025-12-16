'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Link from 'next/link'

interface Overview {
  totalSalesToday: number
  ordersToday: number
  topSellingItem: {
    name: string
    quantity: number
  } | null
}

export default function AdminDashboard() {
  const router = useRouter()
  const [overview, setOverview] = useState<Overview | null>(null)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<{ role: string } | null>(null)

  useEffect(() => {
    checkAuth()
    fetchOverview()
  }, [])

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include',
      })
      if (response.status === 401) {
        router.push('/login')
        return
      }
      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
        if (data.user.role !== 'ADMIN') {
          router.push('/categories')
        }
      }
    } catch (error) {
      console.error('Error checking auth:', error)
    }
  }

  const fetchOverview = async () => {
    try {
      const response = await fetch('/api/reports/overview', {
        credentials: 'include',
      })
      if (response.status === 401 || response.status === 403) {
        router.push('/login')
        return
      }
      if (response.ok) {
        const data = await response.json()
        setOverview(data)
      }
    } catch (error) {
      console.error('Error fetching overview:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !user) {
    return (
      <>
        <Navbar />
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>

        {/* Overview Metrics */}
        {overview && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">
                Total Sales Today
              </h3>
              <p className="text-3xl font-bold text-primary-600">
              {Number(overview?.totalSalesToday ?? 0).toLocaleString('en-US')} IQD
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">
                Orders Today
              </h3>
              <p className="text-3xl font-bold text-primary-600">
                {overview.ordersToday}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">
                Top Selling Item
              </h3>
              <p className="text-2xl font-bold text-primary-600">
                {overview.topSellingItem
                  ? `${overview.topSellingItem.name} (${overview.topSellingItem.quantity})`
                  : 'N/A'}
              </p>
            </div>
          </div>
        )}

        {/* Management Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link
            href="/admin/categories"
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition cursor-pointer"
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Categories
            </h2>
            <p className="text-gray-600 text-sm">
              Manage product categories
            </p>
          </Link>

          <Link
            href="/admin/items"
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition cursor-pointer"
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Items
            </h2>
            <p className="text-gray-600 text-sm">
              Manage products and inventory
            </p>
          </Link>

          <Link
            href="/admin/markets"
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition cursor-pointer"
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Markets
            </h2>
            <p className="text-gray-600 text-sm">
              Manage markets
            </p>
          </Link>

          <Link
            href="/admin/users"
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition cursor-pointer"
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Users
            </h2>
            <p className="text-gray-600 text-sm">
              Manage user accounts and PINs
            </p>
          </Link>

          <Link
            href="/admin/orders"
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition cursor-pointer"
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Orders
            </h2>
            <p className="text-gray-600 text-sm">
              View and manage orders
            </p>
          </Link>

          <Link
            href="/admin/reports"
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition cursor-pointer"
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Reports
            </h2>
            <p className="text-gray-600 text-sm">
              View sales and analytics
            </p>
          </Link>
        </div>
      </div>
    </>
  )
}


