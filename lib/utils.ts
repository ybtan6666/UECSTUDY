// Generate UEC unique ID: UEC-STU-0001, UEC-TEA-0001, etc.
export function generateUECId(role: string, count: number): string {
  const prefix = role === "STUDENT" ? "STU" : role === "TEACHER" ? "TEA" : "ADM"
  const number = String(count + 1).padStart(4, "0")
  return `UEC-${prefix}-${number}`
}

// Generate avatar from name (initials)
export function generateAvatar(name: string): string {
  const names = name.split(" ")
  if (names.length >= 2) {
    return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase()
  }
  return name.substring(0, 2).toUpperCase()
}

// Get avatar color based on unique ID
export function getAvatarColor(uniqueId: string): string {
  const colors = [
    "bg-red-500",
    "bg-blue-500",
    "bg-yellow-500",
    "bg-green-500",
    "bg-purple-500",
    "bg-pink-500",
    "bg-indigo-500",
    "bg-orange-500",
  ]
  const hash = uniqueId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return colors[hash % colors.length]
}

// Generate unique order number: ORD-000001, ORD-000002, etc.
// This function should be called with the Prisma client to get the next sequential number
export async function generateOrderNumber(prisma: any): Promise<string> {
  // Get all order numbers from both bookings and questions (excluding nulls)
  const [bookings, questions] = await Promise.all([
    prisma.booking.findMany({
      where: { orderNumber: { not: null } },
      select: { orderNumber: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.mathQuestion.findMany({
      where: { orderNumber: { not: null } },
      select: { orderNumber: true },
      orderBy: { createdAt: "desc" },
    }),
  ])

  // Extract numbers from order numbers
  const extractNumber = (orderNumber: string | null): number => {
    if (!orderNumber) return 0
    const match = orderNumber.match(/\d+$/)
    return match ? parseInt(match[0], 10) : 0
  }

  // Find the highest order number
  let maxNum = 0
  bookings.forEach((b: any) => {
    const num = extractNumber(b.orderNumber)
    if (num > maxNum) maxNum = num
  })
  questions.forEach((q: any) => {
    const num = extractNumber(q.orderNumber)
    if (num > maxNum) maxNum = num
  })

  const nextNum = maxNum + 1
  return `ORD-${String(nextNum).padStart(6, "0")}`
}

