'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'

interface Category {
  id: string
  name: string
  description: string | null
  imageUrl: string | null
  archived?: boolean
}

export default function AdminCategoriesPage() {
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    imageUrl: '',
  })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories', {
        credentials: 'include',
      })
      if (response.status === 401 || response.status === 403) {
        router.push('/login')
        return
      }
      if (response.ok) {
        const data = await response.json()
        setCategories(data)
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setUploading(true)
    try {
      let imageUrl = formData.imageUrl

      // Upload image if a new file is selected
      if (imageFile) {
        const uploadFormData = new FormData()
        uploadFormData.append('file', imageFile)

        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          credentials: 'include',
          body: uploadFormData,
        })

        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json()
          alert(errorData.error || 'Failed to upload image')
          setUploading(false)
          return
        }

        const uploadData = await uploadResponse.json()
        imageUrl = uploadData.imageUrl
      }

      const url = editing
        ? `/api/categories/${editing.id}`
        : '/api/categories'
      const method = editing ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || null,
          imageUrl: imageUrl || null,
        }),
      })

      if (response.ok) {
        setShowForm(false)
        setEditing(null)
        setImageFile(null)
        setImagePreview(null)
        setFormData({ name: '', description: '', imageUrl: '' })
        fetchCategories()
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to save category')
      }
    } catch (error) {
      console.error('Error saving category:', error)
      alert('An error occurred')
    } finally {
      setUploading(false)
    }
  }

  const handleEdit = (category: Category) => {
    setEditing(category)
    setFormData({
      name: category.name,
      description: category.description || '',
      imageUrl: category.imageUrl || '',
    })
    setImageFile(null)
    setImagePreview(category.imageUrl || null)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return

    try {
      const response = await fetch(`/api/categories/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (response.ok) {
        fetchCategories()
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to delete category')
      }
    } catch (error) {
      console.error('Error deleting category:', error)
      alert('An error occurred')
    }
  }

  const handleArchiveToggle = async (category: Category, archived: boolean) => {
    try {
      const response = await fetch(`/api/categories/${category.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ archived }),
      })

      if (response.ok) {
        fetchCategories()
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to update category')
      }
    } catch (error) {
      console.error('Error updating category:', error)
      alert('An error occurred')
    }
  }

  const handleForceDelete = async (id: string) => {
    if (
      !confirm(
        'Force delete will remove related orders/items for this category. This cannot be undone. Continue?'
      )
    )
      return

    try {
      const response = await fetch(`/api/categories/${id}?force=true`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (response.ok) {
        fetchCategories()
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to delete category')
      }
    } catch (error) {
      console.error('Error deleting category:', error)
      alert('An error occurred')
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
          <h1 className="text-3xl font-bold text-gray-900">Category Management</h1>
          <button
            onClick={() => {
              setShowForm(true)
              setEditing(null)
              setImageFile(null)
              setImagePreview(null)
              setFormData({ name: '', description: '', imageUrl: '' })
            }}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition"
          >
            Add Category
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">
              {editing ? 'Edit Category' : 'Add Category'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Image
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                {imagePreview && (
                  <div className="mt-2">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-32 h-32 object-cover rounded-lg border border-gray-300"
                    />
                  </div>
                )}
                {!imageFile && editing && formData.imageUrl && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-500 mb-1">Current image:</p>
                    <img
                      src={formData.imageUrl}
                      alt="Current"
                      className="w-32 h-32 object-cover rounded-lg border border-gray-300"
                    />
                  </div>
                )}
              </div>
              <div className="flex space-x-4">
                <button
                  type="submit"
                  disabled={uploading}
                  className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? 'Uploading...' : editing ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false)
                    setEditing(null)
                    setImageFile(null)
                    setImagePreview(null)
                    setFormData({ name: '', description: '', imageUrl: '' })
                  }}
                  className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <div
              key={category.id}
              className="bg-white rounded-lg shadow-md overflow-hidden"
            >
              <div className="aspect-square w-full bg-gray-200 relative overflow-hidden">
                {category.imageUrl ? (
                  <img
                    src={category.imageUrl}
                    alt={category.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    No Image
                  </div>
                )}
              </div>
              <div className="p-4">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  {category.name}
                </h2>
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      category.archived
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {category.archived ? 'Archived' : 'Active'}
                  </span>
                </div>
                {category.description && (
                  <p className="text-gray-600 text-sm mb-4">
                    {category.description}
                  </p>
                )}
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(category)}
                    className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleArchiveToggle(category, !category.archived)}
                    className="flex-1 bg-gray-100 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-200 transition text-sm"
                  >
                    {category.archived ? 'Unarchive' : 'Archive'}
                  </button>
                  <button
                    onClick={() => handleDelete(category.id)}
                    className="flex-1 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition text-sm"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => handleForceDelete(category.id)}
                    className="flex-1 bg-red-700 text-white px-4 py-2 rounded-lg hover:bg-red-800 transition text-sm"
                  >
                    Force Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}


