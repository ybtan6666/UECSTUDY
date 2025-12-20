// API: Math Questions (Feature A)
// POST: Submit a new question
// GET: List open questions (for teachers) or student's questions

import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const PLATFORM_MIN_PRICE = 5.00 // Minimum price in MYR
const PLATFORM_FEE_RATE = 0.15 // 15% commission

// POST: Submit a new question
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "STUDENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const {
      questionText,
      questionImage,
      questionAudio,
      questionVideo,
      teacherId, // Optional - if null, open marketplace
      price,
      expectedResponseHours, // 6, 24, or 72
    } = body

    // Validation
    if (!questionText && !questionImage && !questionAudio && !questionVideo) {
      return NextResponse.json(
        { error: "Question content is required" },
        { status: 400 }
      )
    }

    if (!price || isNaN(price) || price < PLATFORM_MIN_PRICE) {
      return NextResponse.json(
        { error: `Minimum price is MYR ${PLATFORM_MIN_PRICE}` },
        { status: 400 }
      )
    }

    if (!expectedResponseHours || ![6, 24, 72].includes(Number(expectedResponseHours))) {
      return NextResponse.json(
        { error: "Expected response time must be 6, 24, or 72 hours" },
        { status: 400 }
      )
    }

    // Validate teacher if specified
    if (teacherId && teacherId.trim() !== "") {
      const teacher = await prisma.user.findUnique({
        where: { id: teacherId },
      })
      if (!teacher || teacher.role !== "TEACHER") {
        return NextResponse.json(
          { error: "Selected teacher not found or invalid" },
          { status: 400 }
        )
      }
    }

    // Calculate deadline
    const deadline = new Date()
    deadline.setHours(deadline.getHours() + expectedResponseHours)

    // Create question
    const question = await prisma.mathQuestion.create({
      data: {
        questionText: questionText || null,
        questionImage: questionImage || null,
        questionAudio: questionAudio || null,
        questionVideo: questionVideo || null,
        studentId: session.user.id,
        teacherId: teacherId || null,
        price,
        expectedResponseHours,
        deadline,
        status: "PENDING",
        paymentHeld: true,
      },
    })

    // Log order creation
    await prisma.orderLog.create({
      data: {
        userId: session.user.id,
        questionId: question.id,
        toStatus: "PENDING",
        action: "CREATE",
        metadata: JSON.stringify({ price, expectedResponseHours }),
      },
    })

    return NextResponse.json(question)
  } catch (error: any) {
    console.error("Error creating question:", error)
    return NextResponse.json(
      { 
        error: "Failed to create question",
        details: error.message || "Unknown error",
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

// GET: List questions
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const filter = searchParams.get("filter") // "my-questions", "open", "my-accepted"

    if (session.user.role === "STUDENT") {
      // Students see their own questions
      const questions = await prisma.mathQuestion.findMany({
        where: {
          studentId: session.user.id,
        },
        include: {
          student: {
            select: { id: true, name: true, uniqueId: true, avatar: true },
          },
          teacher: {
            select: { id: true, name: true, uniqueId: true, avatar: true },
          },
        },
        orderBy: { createdAt: "desc" },
      })
      return NextResponse.json(questions)
    }

    if (session.user.role === "TEACHER") {
      if (filter === "my-accepted") {
        // Questions teacher has accepted
        const questions = await prisma.mathQuestion.findMany({
          where: {
            teacherId: session.user.id,
            status: { in: ["ACCEPTED", "ANSWERED"] },
          },
          include: {
            student: {
              select: { id: true, name: true, uniqueId: true, avatar: true },
            },
          },
          orderBy: { createdAt: "desc" },
        })
        return NextResponse.json(questions)
      } else {
        // Open marketplace questions (no teacher assigned or not accepted yet)
        const questions = await prisma.mathQuestion.findMany({
          where: {
            status: "PENDING",
            OR: [
              { teacherId: null }, // Open marketplace
              { teacherId: session.user.id }, // Assigned to this teacher but not accepted
            ],
            deadline: { gt: new Date() }, // Not expired
          },
          include: {
            student: {
              select: { id: true, name: true, uniqueId: true, avatar: true },
            },
          },
          orderBy: { createdAt: "desc" },
        })
        return NextResponse.json(questions)
      }
    }

    return NextResponse.json({ error: "Invalid role" }, { status: 403 })
  } catch (error: any) {
    console.error("Error fetching questions:", error)
    return NextResponse.json(
      { error: "Failed to fetch questions" },
      { status: 500 }
    )
  }
}

