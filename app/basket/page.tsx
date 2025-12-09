'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'

interface Item {
  id: string
  name: string
  description: string | null
  price: number
  imageUrl: string | null
}

interface BasketItem {
  item: Item
  quantity: number
}

export default function BasketPage() {
  const router = useRouter()
  const [basketItems, setBasketItems] = useState<BasketItem[]>([])
  const [loading, setLoading] = useState(true)
  const [checkingOut, setCheckingOut] = useState(false)

  useEffect(() => {
    loadBasket()
  }, [])

  const loadBasket = async () => {
    try {
      const saved = localStorage.getItem('basket')
      if (!saved) {
        setLoading(false)
        return
      }

      const basketMap = new Map<string, number>(JSON.parse(saved))
      const itemIds = Array.from(basketMap.keys())

      if (itemIds.length === 0) {
        setLoading(false)
        return
      }

      // Fetch all items
      const response = await fetch('/api/items', {
        credentials: 'include',
      })

      if (response.status === 401) {
        router.push('/login')
        return
      }

      if (response.ok) {
        const allItems: Item[] = await response.json()
        const items: BasketItem[] = []

        for (const [itemId, quantity] of basketMap.entries()) {
          const item = allItems.find((i) => i.id === itemId)
          if (item) {
            items.push({ item, quantity })
          }
        }

        setBasketItems(items)
      }
    } catch (error) {
      console.error('Error loading basket:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateQuantity = (itemId: string, quantity: number) => {
    const saved = localStorage.getItem('basket')
    if (!saved) return

    const basketMap = new Map<string, number>(JSON.parse(saved))
    if (quantity <= 0) {
      basketMap.delete(itemId)
    } else {
      basketMap.set(itemId, quantity)
    }

    localStorage.setItem('basket', JSON.stringify(Array.from(basketMap.entries())))
    loadBasket()
  }

  const removeItem = (itemId: string) => {
    updateQuantity(itemId, 0)
  }

  const totalPrice = basketItems.reduce(
    (sum, basketItem) =>
      sum + Number(basketItem.item.price) * basketItem.quantity,
    0
  )

  const handleCheckout = async () => {
    if (basketItems.length === 0) return

    setCheckingOut(true)
    try {
      const orderItems = basketItems.map((basketItem) => ({
        itemId: basketItem.item.id,
        quantity: basketItem.quantity,
        unitPrice: Number(basketItem.item.price),
      }))

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ items: orderItems }),
      })

      if (response.status === 401) {
        router.push('/login')
        return
      }

      if (response.ok) {
        // Clear basket
        localStorage.removeItem('basket')
        alert('Order placed successfully!')
        router.push('/categories')
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to place order')
      }
    } catch (error) {
      console.error('Error checking out:', error)
      alert('An error occurred. Please try again.')
    } finally {
      setCheckingOut(false)
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Shopping Basket</h1>

        {basketItems.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-500 text-lg mb-4">Your basket is empty</p>
            <button
              onClick={() => router.push('/categories')}
              className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition font-medium"
            >
              Browse Categories
            </button>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
              {basketItems.map((basketItem) => (
                <div
                  key={basketItem.item.id}
                  className="border-b border-gray-200 last:border-b-0 p-4 flex flex-col sm:flex-row gap-4"
                >
                  <div className="w-full sm:w-24 h-24 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                    {basketItem.item.imageUrl ? (
                      <img
                        src={basketItem.item.imageUrl}
                        alt={basketItem.item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                        No Image
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">
                      {basketItem.item.name}
                    </h3>
                    {basketItem.item.description && (
                      <p className="text-sm text-gray-600 mb-2">
                        {basketItem.item.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() =>
                            updateQuantity(
                              basketItem.item.id,
                              basketItem.quantity - 1
                            )
                          }
                          className="w-8 h-8 rounded border border-gray-300 hover:bg-gray-100 flex items-center justify-center"
                        >
                          −
                        </button>
                        <span className="w-12 text-center font-medium">
                          {basketItem.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateQuantity(
                              basketItem.item.id,
                              basketItem.quantity + 1
                            )
                          }
                          className="w-8 h-8 rounded border border-gray-300 hover:bg-gray-100 flex items-center justify-center"
                        >
                          +
                        </button>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className="text-lg font-semibold text-gray-900">
                          {(
                            Number(basketItem.item.price) * basketItem.quantity
                          ).toLocaleString('en-US')} IQD
                        </span>
                        <button
                          onClick={() => removeItem(basketItem.item.id)}
                          className="text-red-600 hover:text-red-700 text-sm font-medium"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-6">
                <span className="text-2xl font-bold text-gray-900">Total:</span>
                <span className="text-3xl font-bold text-primary-600">
                  {totalPrice.toLocaleString('en-US')} IQD
                </span>
              </div>
              <button
                onClick={handleCheckout}
                disabled={checkingOut}
                className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {checkingOut ? 'Processing...' : 'Checkout'}
              </button>
            </div>
          </>
        )}
      </div>
    </>
  )
}


