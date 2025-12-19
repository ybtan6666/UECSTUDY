import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const userId = (session.user as any).id

  const course = await prisma.course.findUnique({
    where: { id: params.id },
  })

  if (!course) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 })
  }

  // Check if already purchased
  const existing = await prisma.coursePurchase.findUnique({
    where: {
      courseId_studentId: {
        courseId: params.id,
        studentId: userId,
      },
    },
  })

  if (existing) {
    return NextResponse.json({ error: "Already purchased" }, { status: 400 })
  }

  // Mock payment - just create purchase
  await prisma.coursePurchase.create({
    data: {
      courseId: params.id,
      studentId: userId,
    },
  })

  return NextResponse.json({ success: true })
}

