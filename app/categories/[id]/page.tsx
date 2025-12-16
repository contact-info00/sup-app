'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'

interface Item {
  id: string
  name: string
  description: string | null
  price: number
  imageUrl: string | null
  category: {
    id: string
    name: string
  }
}

export default function CategoryItemsPage() {
  const params = useParams()
  const router = useRouter()
  const categoryId = params.id as string
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [basket, setBasket] = useState<Map<string, number>>(new Map())
  const [user, setUser] = useState<{ role: string } | null>(null)

  useEffect(() => {
    checkAuth()
    fetchItems()
    loadBasket()
  }, [categoryId])

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
        // For employees, check if market is selected
        if (data.user.role === 'EMPLOYEE') {
          const selectedMarketId = localStorage.getItem('selectedMarketId')
          if (!selectedMarketId) {
            router.push('/employee/markets')
            return
          }
        }
      }
    } catch (error) {
      console.error('Error checking auth:', error)
    }
  }

  const loadBasket = () => {
    const saved = localStorage.getItem('basket')
    if (saved) {
      setBasket(new Map(JSON.parse(saved)))
    }
  }

  const saveBasket = (newBasket: Map<string, number>) => {
    localStorage.setItem('basket', JSON.stringify(Array.from(newBasket.entries())))
    setBasket(newBasket)
  }

  const fetchItems = async () => {
    try {
      const response = await fetch(`/api/items?category_id=${categoryId}`, {
        credentials: 'include',
      })
      if (response.status === 401) {
        router.push('/login')
        return
      }
      if (response.ok) {
        const data = await response.json()
        setItems(data)
      }
    } catch (error) {
      console.error('Error fetching items:', error)
    } finally {
      setLoading(false)
    }
  }

  const addToBasket = (itemId: string) => {
    const newBasket = new Map(basket)
    const currentQty = newBasket.get(itemId) || 0
    newBasket.set(itemId, currentQty + 1)
    saveBasket(newBasket)
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
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          {items[0]?.category.name || 'Items'}
        </h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="aspect-square w-full bg-gray-200 relative overflow-hidden">
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    No Image
                  </div>
                )}
              </div>
              <div className="p-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-1">
                  {item.name}
                </h2>
                {item.description && (
                  <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                    {item.description}
                  </p>
                )}
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xl font-bold text-primary-600">
                    {Number(item.price).toLocaleString('en-US')} IQD
                  </span>
                  <button
                    onClick={() => addToBasket(item.id)}
                    className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition text-sm font-medium flex items-center gap-2"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                    Add
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        {items.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No items in this category</p>
          </div>
        )}
      </div>
    </>
  )
}


