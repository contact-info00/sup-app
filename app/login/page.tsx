'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (pin.length !== 4) {
      setError('PIN must be exactly 4 digits')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ pin }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Invalid PIN')
        setLoading(false)
        return
      }

      // Redirect based on role
      if (data.user.role === 'admin') {
        router.push('/admin')
      } else {
        router.push('/categories')
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
      setLoading(false)
    }
  }

  const handleNumberClick = (num: string) => {
    if (pin.length < 4) {
      setPin(pin + num)
      setError('')
    }
  }

  const handleClear = () => {
    setPin('')
    setError('')
  }

  const handleBackspace = () => {
    setPin(pin.slice(0, -1))
    setError('')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 px-4">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
          Supplier App
        </h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Enter 4-Digit PIN
            </label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={pin}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '')
                if (value.length <= 4) {
                  setPin(value)
                  setError('')
                }
              }}
              className="w-full px-4 py-3 text-center text-2xl font-mono tracking-widest border-2 border-gray-300 rounded-lg focus:border-primary-500 focus:outline-none"
              placeholder="••••"
              autoFocus
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || pin.length !== 4}
            className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        {/* Numeric Keypad */}
        <div className="mt-8">
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => handleNumberClick(num.toString())}
                className="py-4 bg-gray-100 hover:bg-gray-200 rounded-lg font-semibold text-lg transition"
              >
                {num}
              </button>
            ))}
            <button
              type="button"
              onClick={handleClear}
              className="py-4 bg-gray-200 hover:bg-gray-300 rounded-lg font-semibold text-sm transition"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => handleNumberClick('0')}
              className="py-4 bg-gray-100 hover:bg-gray-200 rounded-lg font-semibold text-lg transition"
            >
              0
            </button>
            <button
              type="button"
              onClick={handleBackspace}
              className="py-4 bg-gray-200 hover:bg-gray-300 rounded-lg font-semibold text-sm transition"
            >
              ⌫
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}




