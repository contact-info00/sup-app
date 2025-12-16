import bcrypt from "bcryptjs"
import { prisma } from "../lib/prisma"

async function main() {
  const userId = "admin-1" // 👈 must match Supabase user ID
  const newPin = "4321"

  const hash = await bcrypt.hash(newPin, 10)

  await prisma.user.update({
    where: { id: userId },
    data: { pinHash: hash },
  })

  console.log('PIN reset successful. New PIN: ${newPin}')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())