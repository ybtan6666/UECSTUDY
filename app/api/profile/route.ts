import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const userId = (session.user as any).id
  const role = (session.user as any).role

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      name: true,
      email: true,
      role: true,
      uniqueId: true,
      avatar: true,
    },
  })

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  if (role === "STUDENT") {
    // Get student's questions
    const questions = await prisma.mathQuestion.findMany({
      where: { studentId: userId },
      orderBy: { createdAt: "desc" },
    })

    // Get student's bookings
    const bookings = await prisma.booking.findMany({
      where: { studentId: userId },
      include: {
        timeSlot: {
          select: {
            startTime: true,
            endTime: true,
          },
        },
        teacher: {
          select: {
            id: true,
            name: true,
            uniqueId: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({
      user,
      courses: [], // Course model not in current schema
      questions,
      challenges: [], // Challenge model not in current schema
      bookings,
    })
  } else if (role === "TEACHER") {
    // Get teacher's questions
    const questions = await prisma.mathQuestion.findMany({
      where: { teacherId: userId },
      orderBy: { createdAt: "desc" },
    })

    // Get teacher's time slots
    const timeSlots = await prisma.timeSlot.findMany({
      where: { teacherId: userId },
      include: {
        _count: {
          select: { bookings: true },
        },
      },
      orderBy: { startTime: "asc" },
    })

    return NextResponse.json({
      user,
      courses: [], // Course model not in current schema
      questions,
      timeSlots,
    })
  }

  return NextResponse.json({ user })
}

