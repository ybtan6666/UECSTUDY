import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  const { searchParams } = new URL(req.url)
  const availableOnly = searchParams.get("available") === "true"

  const where: any = {}
  if (availableOnly) {
    where.endTime = { gte: new Date() }
  }
  if (session && (session.user as any).role === "TEACHER") {
    where.teacherId = (session.user as any).id
  }

  const slots = await prisma.timeSlot.findMany({
    where,
    include: {
      teacher: { select: { name: true, id: true } },
      _count: { select: { bookings: true } },
    },
    orderBy: { startTime: "asc" },
  })

  return NextResponse.json(slots)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)

  if (!session || (session.user as any).role !== "TEACHER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { startTime, endTime, topic, maxStudents, zoomLink } = await req.json()

  // Validation
  const newStart = new Date(startTime)
  const newEnd = new Date(endTime)

  if (newStart >= newEnd) {
    return NextResponse.json(
      { error: "End time must be after start time" },
      { status: 400 }
    )
  }

  if (newStart < new Date()) {
    return NextResponse.json(
      { error: "Start time must be in the future" },
      { status: 400 }
    )
  }

  // Check for overlapping time slots
  const existingSlots = await prisma.timeSlot.findMany({
    where: {
      teacherId: (session.user as any).id,
      status: {
        notIn: ["CANCELLED", "COMPLETED"],
      },
    },
  })

  // Check if the new slot overlaps with any existing slot
  const hasOverlap = existingSlots.some((slot) => {
    const slotStart = new Date(slot.startTime)
    const slotEnd = new Date(slot.endTime)
    // Two slots overlap if: (newStart < slotEnd) && (newEnd > slotStart)
    return newStart < slotEnd && newEnd > slotStart
  })

  if (hasOverlap) {
    return NextResponse.json(
      { error: "This time slot overlaps with an existing time slot. Please choose a different time." },
      { status: 400 }
    )
  }

  const slot = await prisma.timeSlot.create({
    data: {
      teacherId: (session.user as any).id,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      topic: topic || null,
      maxStudents,
      zoomLink: zoomLink || null,
    },
  })

  return NextResponse.json(slot)
}

