import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const booking = await prisma.booking.findUnique({
    where: { id: params.id },
    include: {
      student: { select: { name: true, uniqueId: true, email: true } },
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
    },
  })

  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 })
  }

  return NextResponse.json(booking)
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { status, feedback } = await req.json()

  const booking = await prisma.booking.findUnique({
    where: { id: params.id },
    include: { timeSlot: true },
  })

  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 })
  }

  const userId = (session.user as any).id
  const isTeacher = booking.timeSlot.teacherId === userId
  const isStudent = booking.studentId === userId

  if (!isTeacher && !isStudent) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  const updated = await prisma.booking.update({
    where: { id: params.id },
    data: {
      status: status || booking.status,
      feedback: feedback !== undefined ? feedback : booking.feedback,
    },
  })

  return NextResponse.json(updated)
}

