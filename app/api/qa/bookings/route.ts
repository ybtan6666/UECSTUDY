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

  let bookings

  if (role === "STUDENT") {
    bookings = await prisma.booking.findMany({
      where: { studentId: userId },
      include: {
        timeSlot: {
          include: {
            teacher: { select: { name: true, uniqueId: true } },
            bookings: {
              include: {
                student: { select: { name: true, uniqueId: true } },
              },
            },
          },
        },
        student: { select: { name: true, uniqueId: true } },
      },
      orderBy: { createdAt: "desc" },
    })
  } else if (role === "TEACHER") {
    bookings = await prisma.booking.findMany({
      where: {
        timeSlot: {
          teacherId: userId,
        },
      },
      include: {
        timeSlot: {
          include: {
            teacher: { select: { name: true, uniqueId: true } },
            bookings: {
              include: {
                student: { select: { name: true, uniqueId: true } },
              },
            },
          },
        },
        student: { select: { name: true, uniqueId: true } },
      },
      orderBy: { createdAt: "desc" },
    })
  } else {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  return NextResponse.json(bookings)
}
