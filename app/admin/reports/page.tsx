'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'

interface TopSellingItem {
  item: {
    id: string
    name: string
    price: number
    imageUrl: string | null
    category: {
      id: string
      name: string
    }
  }
  totalQuantity: number
  totalRevenue: number
}

interface SalesReport {
  date: string
  totalRevenue: number
  totalOrders: number
  itemsSold: number
  orders: Array<{
    id: string
    totalPrice: number
    createdAt: string
    user: {
      id: string
      name: string
    }
    orderItems: Array<{
      quantity: number
      unitPrice: number
      lineTotal: number
      item: {
        id: string
        name: string
      }
    }>
  }>
}

export default function AdminReportsPage() {
  const router = useRouter()
  const [topSelling, setTopSelling] = useState<TopSellingItem[]>([])
  const [salesReport, setSalesReport] = useState<SalesReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  )

  useEffect(() => {
    fetchReports()
  }, [selectedDate])

  const fetchReports = async () => {
    setLoading(true)
    try {
      const [topSellingRes, salesRes] = await Promise.all([
        fetch(`/api/reports/top-selling?date=${selectedDate}&limit=10`, {
          credentials: 'include',
        }),
        fetch(`/api/reports/sales?date=${selectedDate}`, {
          credentials: 'include',
        }),
      ])

      if (
        topSellingRes.status === 401 ||
        topSellingRes.status === 403 ||
        salesRes.status === 401 ||
        salesRes.status === 403
      ) {
        router.push('/login')
        return
      }

      if (topSellingRes.ok && salesRes.ok) {
        const topSellingData = await topSellingRes.json()
        const salesData = await salesRes.json()
        setTopSelling(topSellingData)
        setSalesReport(salesData)
      }
    } catch (error) {
      console.error('Error fetching reports:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
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
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Sales Summary */}
        {salesReport && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">
                Total Revenue
              </h3>
              <p className="text-3xl font-bold text-primary-600">
                {salesReport.totalRevenue.toLocaleString('en-US')} IQD
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">
                Total Orders
              </h3>
              <p className="text-3xl font-bold text-primary-600">
                {salesReport.totalOrders}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">
                Items Sold
              </h3>
              <p className="text-3xl font-bold text-primary-600">
                {salesReport.itemsSold}
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Top Selling Items */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Top Selling Items
            </h2>
            {topSelling.length === 0 ? (
              <p className="text-gray-500">No sales data for this date</p>
            ) : (
              <div className="space-y-4">
                {topSelling.map((item, index) => (
                  <div
                    key={item.item.id}
                    className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg"
                  >
                    <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                      {item.item.imageUrl ? (
                        <img
                          src={item.item.imageUrl}
                          alt={item.item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                          No Image
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">
                        #{index + 1} {item.item.name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {item.item.category.name}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        Quantity: {item.totalQuantity} | Revenue:{' '}
                        {item.totalRevenue.toLocaleString('en-US')} IQD
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Daily Sales */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Daily Sales
            </h2>
            {salesReport && salesReport.orders.length === 0 ? (
              <p className="text-gray-500">No orders for this date</p>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {salesReport?.orders.map((order) => (
                  <div
                    key={order.id}
                    className="p-4 border border-gray-200 rounded-lg"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold text-gray-900">
                          Order #{order.id.slice(0, 8)}
                        </p>
                        <p className="text-sm text-gray-500">
                          {order.user.name} •{' '}
                          {new Date(order.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                      <p className="text-lg font-bold text-primary-600">
                        {Number(order.totalPrice).toLocaleString('en-US')} IQD
                      </p>
                    </div>
                    <div className="mt-2 space-y-1">
                      {order.orderItems.map((orderItem, idx) => (
                        <p
                          key={idx}
                          className="text-sm text-gray-600"
                        >
                          {orderItem.item.name} × {orderItem.quantity} @{' '}
                          {Number(orderItem.unitPrice).toLocaleString('en-US')} IQD ={' '}
                          {Number(orderItem.lineTotal).toLocaleString('en-US')} IQD
                        </p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}


