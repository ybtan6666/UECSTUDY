// API: Endorsements
// POST: Endorse a teacher (only after completed transaction)
// GET: Get endorsements for a teacher

import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// POST: Create endorsement
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "STUDENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { teacherId, questionId, bookingId } = body

    // Validation: Must have completed transaction
    if (!questionId && !bookingId) {
      return NextResponse.json(
        { error: "Must provide questionId or bookingId" },
        { status: 400 }
      )
    }

    // Check if transaction is completed
    if (questionId) {
      const question = await prisma.mathQuestion.findUnique({
        where: { id: questionId },
      })
      if (!question || question.status !== "COMPLETED" || question.studentId !== session.user.id) {
        return NextResponse.json(
          { error: "Invalid or incomplete question" },
          { status: 400 }
        )
      }
    }

    if (bookingId) {
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
      })
      if (!booking || booking.status !== "COMPLETED" || booking.studentId !== session.user.id) {
        return NextResponse.json(
          { error: "Invalid or incomplete booking" },
          { status: 400 }
        )
      }
    }

    // Check if already endorsed (one endorsement per student-teacher pair, lifetime)
    const existing = await prisma.endorsement.findUnique({
      where: {
        studentId_teacherId: {
          studentId: session.user.id,
          teacherId,
        },
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: "You have already endorsed this teacher" },
        { status: 400 }
      )
    }

    // Create endorsement
    const endorsement = await prisma.endorsement.create({
      data: {
        studentId: session.user.id,
        teacherId,
        questionId: questionId || null,
        bookingId: bookingId || null,
      },
    })

    return NextResponse.json(endorsement)
  } catch (error: any) {
    console.error("Error creating endorsement:", error)
    return NextResponse.json(
      { error: "Failed to create endorsement" },
      { status: 500 }
    )
  }
}

// GET: Get endorsements for a teacher
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const teacherId = searchParams.get("teacherId")

    if (!teacherId) {
      return NextResponse.json(
        { error: "teacherId is required" },
        { status: 400 }
      )
    }

    const endorsements = await prisma.endorsement.findMany({
      where: { teacherId },
      include: {
        student: {
          select: { id: true, name: true, uniqueId: true, avatar: true },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(endorsements)
  } catch (error: any) {
    console.error("Error fetching endorsements:", error)
    return NextResponse.json(
      { error: "Failed to fetch endorsements" },
      { status: 500 }
    )
  }
}

