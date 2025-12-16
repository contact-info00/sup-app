'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'

interface OrderItem {
  id: string
  itemId: string
  quantity: number
  unit_price: number
  lineTotal: number
  item: {
    id: string
    name: string
    imageUrl: string | null
  }
}

interface Order {
  id: string
  userId: string
  total_price: number
  note?: string | null
  status?: 'PENDING' | 'CONFIRMED' | 'DELIVERED' | 'CANCELLED'
  createdAt: string
  market?: {
    id: string
    name: string
  }
  user: {
    id: string
    name: string
  }
  orderItems: OrderItem[]
}

export default function AdminOrdersPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [user, setUser] = useState<{ role: string } | null>(null)
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)

  useEffect(() => {
    checkAuth()
    fetchOrders()
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

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/orders', {
        credentials: 'include',
      })
      if (response.status === 401 || response.status === 403) {
        router.push('/login')
        return
      }
      if (response.ok) {
        const data = await response.json()
        setOrders(data)
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (orderId: string, newStatus: Order['status']) => {
    setUpdatingStatus(orderId)
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.status === 401 || response.status === 403) {
        router.push('/login')
        return
      }

      if (response.status === 501) {
        const data = await response.json()
        alert(data.error || 'Status updates not available. Schema update required.')
        setUpdatingStatus(null)
        return
      }

      if (response.ok) {
        fetchOrders()
        if (selectedOrder?.id === orderId) {
          const updatedOrder = await response.json()
          setSelectedOrder(updatedOrder)
        }
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to update order status')
      }
    } catch (error) {
      console.error('Error updating order status:', error)
      alert('An error occurred. Please try again.')
    } finally {
      setUpdatingStatus(null)
    }
  }

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      case 'CONFIRMED':
        return 'bg-blue-100 text-blue-800'
      case 'DELIVERED':
        return 'bg-green-100 text-green-800'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
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
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Order Management</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Orders List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Market
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created By
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {orders.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                          No orders found
                        </td>
                      </tr>
                    ) : (
                      orders.map((order) => (
                        <tr
                          key={order.id}
                          className={`cursor-pointer hover:bg-gray-50 ${
                            selectedOrder?.id === order.id ? 'bg-primary-50' : ''
                          }`}
                          onClick={() => setSelectedOrder(order)}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {order.market?.name || 'N/A'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {order.user.name}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {Number(order.total_price).toLocaleString('en-US')} IQD
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedOrder(order)
                              }}
                              className="text-primary-600 hover:text-primary-900"
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Order Details */}
          <div className="lg:col-span-1">
            {selectedOrder ? (
              <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
                <h2 className="text-xl font-semibold mb-4">Order Details</h2>

                <div className="space-y-4 mb-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Market</label>
                    <p className="text-sm text-gray-900">{selectedOrder.market?.name || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Created By</label>
                    <p className="text-sm text-gray-900">{selectedOrder.user.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Date</label>
                    <p className="text-sm text-gray-900">
                      {new Date(selectedOrder.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Total Amount</label>
                    <p className="text-lg font-bold text-gray-900">
                      {Number(selectedOrder.total_price).toLocaleString('en-US')} IQD
                    </p>
                  </div>
                  {selectedOrder.note && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Note</label>
                      <p className="text-sm text-gray-900">{selectedOrder.note}</p>
                    </div>
                  )}
                  {selectedOrder.status && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Status</label>
                      <select
                        value={selectedOrder.status}
                        onChange={(e) =>
                          handleStatusChange(
                            selectedOrder.id,
                            e.target.value as Order['status']
                          )
                        }
                        disabled={updatingStatus === selectedOrder.id}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-black"
                      >
                        <option value="PENDING">PENDING</option>
                        <option value="CONFIRMED">CONFIRMED</option>
                        <option value="DELIVERED">DELIVERED</option>
                        <option value="CANCELLED">CANCELLED</option>
                      </select>
                    </div>
                  )}
                  {!selectedOrder.status && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Status</label>
                      <p className="text-sm text-gray-500 mt-1">
                        Status updates not available. Order status field requires schema update.
                      </p>
                    </div>
                  )}
                </div>

                <div className="border-t pt-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Order Items</h3>
                  <div className="space-y-2">
                    {selectedOrder.orderItems.map((orderItem) => (
                      <div
                        key={orderItem.id}
                        className="flex items-center space-x-3 py-2 border-b last:border-b-0"
                      >
                        {/* Item Image */}
                        <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                          {orderItem.item.imageUrl ? (
                            <img
                              src={orderItem.item.imageUrl}
                              alt={orderItem.item.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                              No Image
                            </div>
                          )}
                        </div>
                        {/* Item Details */}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">
                            {orderItem.item.name} x {orderItem.quantity}
                          </p>
                          <p className="text-gray-500 text-sm">
                            {Number(orderItem.unit_price).toLocaleString('en-US')} IQD each
                          </p>
                        </div>
                        {/* Line Total */}
                        <p className="font-medium text-gray-900 whitespace-nowrap">
                          {Number(orderItem.lineTotal).toLocaleString('en-US')} IQD
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-6">
                <p className="text-gray-500 text-center">Select an order to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

