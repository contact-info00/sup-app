'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface Category {
  id: string
  name: string
}

export default function Navbar() {
  const [categories, setCategories] = useState<Category[]>([])
  const [user, setUser] = useState<{ name: string; role: string } | null>(null)
  const router = useRouter()

  useEffect(() => {
    fetchCategories()
    fetchUser()
  }, [])

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories', {
        credentials: 'include',
      })
      if (response.ok) {
        const data = await response.json()
        setCategories(data)
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const fetchUser = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include',
      })
      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
      }
    } catch (error) {
      console.error('Error fetching user:', error)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/login', {
        method: 'DELETE',
        credentials: 'include',
      })
      router.push('/login')
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <Link
              href="/categories"
              className="text-xl font-bold text-primary-600"
            >
              Supplier App
            </Link>
            <div className="hidden md:flex space-x-4">
              {categories.map((category) => (
                <Link
                  key={category.id}
                  href={`/categories/${category.id}`}
                  className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition"
                >
                  {category.name}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {user && (
              <>
                <span className="text-sm text-gray-600">
                  {user.name} ({user.role})
                </span>
                {user.role === 'admin' && (
                  <Link
                    href="/admin"
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                  >
                    Admin
                  </Link>
                )}
                <Link
                  href="/basket"
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  Basket
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-sm text-gray-600 hover:text-gray-800 font-medium"
                >
                  Logout
                </button>
              </>
            )}
          </div>
        </div>
      </div>
      {/* Mobile categories */}
      <div className="md:hidden border-t border-gray-200 px-4 py-2 overflow-x-auto">
        <div className="flex space-x-2">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/categories/${category.id}`}
              className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap"
            >
              {category.name}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  )
}




