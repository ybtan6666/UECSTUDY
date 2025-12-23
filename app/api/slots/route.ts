// API: Time Slots (Feature B)
// POST: Create time slot (Teacher)
// GET: List available time slots

import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// POST: Create time slot
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "TEACHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const {
      startTime,
      endTime,
      minPrice,
      maxStudents,
      minStudents,
      isGroupSession,
    } = body

    // Validation
    if (new Date(startTime) >= new Date(endTime)) {
      return NextResponse.json(
        { error: "End time must be after start time" },
        { status: 400 }
      )
    }

    if (new Date(startTime) < new Date()) {
      return NextResponse.json(
        { error: "Start time must be in the future" },
        { status: 400 }
      )
    }

    if (isGroupSession && minStudents > maxStudents) {
      return NextResponse.json(
        { error: "Min students cannot exceed max students" },
        { status: 400 }
      )
    }

    const timeSlot = await prisma.timeSlot.create({
      data: {
        teacherId: session.user.id,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        minPrice: minPrice || 0,
        maxStudents: maxStudents || 1,
        minStudents: minStudents || 1,
        isGroupSession: isGroupSession || false,
        status: "AVAILABLE",
      },
    })

    return NextResponse.json(timeSlot)
  } catch (error: any) {
    console.error("Error creating time slot:", error)
    return NextResponse.json(
      { error: "Failed to create time slot" },
      { status: 500 }
    )
  }
}

// GET: List time slots
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const teacherId = searchParams.get("teacherId")
    const filter = searchParams.get("filter") // "available", "my-slots"

    if (session.user.role === "TEACHER" && filter === "my-slots") {
      // Teacher's own slots
      const slots = await prisma.timeSlot.findMany({
        where: {
          teacherId: session.user.id,
        },
        include: {
          bookings: {
            include: {
              student: {
                select: { id: true, name: true, uniqueId: true, avatar: true },
              },
            },
          },
        },
        orderBy: { startTime: "asc" },
      })
      return NextResponse.json(slots)
    }

    // Available slots (for students to browse)
    const where: any = {
      status: "AVAILABLE",
      startTime: { gte: new Date() },
    }

    if (teacherId) {
      where.teacherId = teacherId
    }

    const slots = await prisma.timeSlot.findMany({
      where,
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            uniqueId: true,
            avatar: true,
          },
        },
        bookings: {
          where: { status: "CONFIRMED" },
          select: { id: true },
        },
      },
      orderBy: { startTime: "asc" },
    })

    // Add availability info
    const slotsWithAvailability = slots.map((slot) => ({
      ...slot,
      availableSpots: slot.maxStudents - slot.bookings.length,
    }))

    return NextResponse.json(slotsWithAvailability)
  } catch (error: any) {
    console.error("Error fetching time slots:", error)
    return NextResponse.json(
      { error: "Failed to fetch time slots" },
      { status: 500 }
    )
  }
}

