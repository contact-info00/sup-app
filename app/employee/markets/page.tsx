'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'

interface Market {
  id: string
  name: string
  phoneNumber: string
  description: string | null
}

export default function EmployeeMarketsPage() {
  const router = useRouter()
  const [markets, setMarkets] = useState<Market[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [user, setUser] = useState<{ role: string } | null>(null)

  useEffect(() => {
    checkAuth()
    fetchMarkets()
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
        if (data.user.role !== 'EMPLOYEE') {
          router.push('/categories')
        }
      }
    } catch (error) {
      console.error('Error checking auth:', error)
    }
  }

  const fetchMarkets = async () => {
    try {
      const response = await fetch('/api/markets', {
        credentials: 'include',
      })
      if (response.status === 401 || response.status === 403) {
        router.push('/login')
        return
      }
      if (response.ok) {
        const data = await response.json()
        setMarkets(data)
      }
    } catch (error) {
      console.error('Error fetching markets:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredMarkets = markets.filter((market) =>
    market.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    market.phoneNumber.includes(searchQuery)
  )

  const handleSelectMarket = (marketId: string) => {
    // Store selected market in localStorage for the ordering flow
    localStorage.setItem('selectedMarketId', marketId)
    router.push('/categories')
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Select Market</h1>

        {/* Search Bar */}
        <div className="mb-6">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by market name or phone number..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-black"
          />
        </div>

        {/* Markets List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredMarkets.length === 0 ? (
            <div className="col-span-2 text-center py-12">
              <p className="text-gray-500">
                {searchQuery ? 'No markets found matching your search' : 'No markets available'}
              </p>
            </div>
          ) : (
            filteredMarkets.map((market) => (
              <div
                key={market.id}
                onClick={() => handleSelectMarket(market.id)}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition cursor-pointer border-2 border-transparent hover:border-primary-500"
              >
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  {market.name}
                </h2>
                <p className="text-sm text-gray-600 mb-1">
                  Phone: {market.phoneNumber}
                </p>
                {market.description && (
                  <p className="text-sm text-gray-500 mt-2">
                    {market.description}
                  </p>
                )}
                <button className="mt-4 w-full bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700 transition font-medium">
                  Select Market
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  )
}

