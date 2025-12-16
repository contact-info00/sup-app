import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Create admin user (PIN: 1234)
  const adminPinHash = await bcrypt.hash('1234', 10)
  const admin = await prisma.user.upsert({
    where: { id: 'admin-1' },
    update: {},
    create: {
      id: 'admin-1',
      name: 'Admin User',
      pinHash: adminPinHash,
      role: 'ADMIN',
    },
  })

  // Create employee user (PIN: 5678)
  const employeePinHash = await bcrypt.hash('5678', 10)
  const employee = await prisma.user.upsert({
    where: { id: 'employee-1' },
    update: {},
    create: {
      id: 'employee-1',
      name: 'Employee User',
      pinHash: employeePinHash,
      role: 'EMPLOYEE',
    },
  })

  // Create sample categories
  const electronics = await prisma.category.upsert({
    where: { id: 'cat-1' },
    update: {},
    create: {
      id: 'cat-1',
      name: 'Electronics',
      description: 'Electronic devices and accessories',
      imageUrl: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400&h=400&fit=crop',
    },
  })

  const clothing = await prisma.category.upsert({
    where: { id: 'cat-2' },
    update: {},
    create: {
      id: 'cat-2',
      name: 'Clothing',
      description: 'Apparel and fashion items',
      imageUrl: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=400&h=400&fit=crop',
    },
  })

  const food = await prisma.category.upsert({
    where: { id: 'cat-3' },
    update: {},
    create: {
      id: 'cat-3',
      name: 'Food & Beverages',
      description: 'Food items and drinks',
      imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&h=400&fit=crop',
    },
  })

  // Create sample items
  await prisma.item.upsert({
    where: { id: 'item-1' },
    update: {},
    create: {
      id: 'item-1',
      categoryId: electronics.id,
      name: 'Wireless Headphones',
      description: 'High-quality wireless headphones with noise cancellation',
      price: 99.99,
      imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop',
    },
  })

  await prisma.item.upsert({
    where: { id: 'item-2' },
    update: {},
    create: {
      id: 'item-2',
      categoryId: electronics.id,
      name: 'Smart Watch',
      description: 'Feature-rich smartwatch with fitness tracking',
      price: 249.99,
      imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop',
    },
  })

  await prisma.item.upsert({
    where: { id: 'item-3' },
    update: {},
    create: {
      id: 'item-3',
      categoryId: clothing.id,
      name: 'Cotton T-Shirt',
      description: 'Comfortable 100% cotton t-shirt',
      price: 19.99,
      imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop',
    },
  })

  await prisma.item.upsert({
    where: { id: 'item-4' },
    update: {},
    create: {
      id: 'item-4',
      categoryId: clothing.id,
      name: 'Denim Jeans',
      description: 'Classic fit denim jeans',
      price: 49.99,
      imageUrl: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&h=400&fit=crop',
    },
  })

  await prisma.item.upsert({
    where: { id: 'item-5' },
    update: {},
    create: {
      id: 'item-5',
      categoryId: food.id,
      name: 'Organic Coffee',
      description: 'Premium organic coffee beans',
      price: 12.99,
      imageUrl: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400&h=400&fit=crop',
    },
  })

  console.log('Seed data created successfully!')
  console.log('Admin PIN: 1234')
  console.log('Employee PIN: 5678')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })




