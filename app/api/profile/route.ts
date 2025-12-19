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
      virtualCoins: true,
      uniqueId: true,
      avatar: true,
    },
  })

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  if (role === "STUDENT") {
    const courses = await prisma.coursePurchase.findMany({
      where: { studentId: userId },
      include: {
        course: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    const questions = await prisma.paidQuestion.findMany({
      where: { studentId: userId },
      orderBy: { createdAt: "desc" },
    })

    const challenges = await prisma.challengeAttempt.findMany({
      where: { studentId: userId },
      include: {
        challenge: {
          select: {
            title: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    const bookings = await prisma.booking.findMany({
      where: { studentId: userId },
      include: {
        timeSlot: {
          select: {
            startTime: true,
            endTime: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({
      user,
      courses,
      questions,
      challenges,
      bookings,
    })
  } else if (role === "TEACHER") {
    const courses = await prisma.course.findMany({
      where: { teacherId: userId },
      orderBy: { createdAt: "desc" },
    })

    const questions = await prisma.paidQuestion.findMany({
      where: { teacherId: userId },
      orderBy: { createdAt: "desc" },
    })

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
      courses,
      questions,
      timeSlots,
    })
  }

  return NextResponse.json({ user })
}

