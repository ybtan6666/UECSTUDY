// API: Single Math Question
// GET: Get question details
// PATCH: Accept, answer, or cancel question

import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const PLATFORM_FEE_RATE = 0.15

// GET: Get question details
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const question = await prisma.mathQuestion.findUnique({
      where: { id: params.id },
      include: {
        student: {
          select: { id: true, name: true, uniqueId: true, avatar: true },
        },
        teacher: {
          select: { id: true, name: true, uniqueId: true, avatar: true },
        },
        followUps: {
          include: {
            student: {
              select: { id: true, name: true, uniqueId: true, avatar: true },
            },
            teacher: {
              select: { id: true, name: true, uniqueId: true, avatar: true },
            },
          },
        },
      },
    })

    if (!question) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 })
    }

    // Check access
    if (
      question.studentId !== session.user.id &&
      question.teacherId !== session.user.id &&
      session.user.role !== "ADMIN"
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Get order logs filtered by current order number
    const orderLogs = await prisma.orderLog.findMany({
      where: {
        questionId: question.id,
        orderNumber: question.orderNumber, // Only show logs for current order number
      },
      include: {
        user: {
          select: { id: true, name: true, uniqueId: true },
        },
      },
      orderBy: { createdAt: "asc" },
    })

    return NextResponse.json({
      ...question,
      orderLogs,
    })
  } catch (error: any) {
    console.error("Error fetching question:", error)
    return NextResponse.json(
      { error: "Failed to fetch question" },
      { status: 500 }
    )
  }
}

// PATCH: Update question (accept, answer, cancel, etc.)
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { action, ...data } = body

    const question = await prisma.mathQuestion.findUnique({
      where: { id: params.id },
    })

    if (!question) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 })
    }

    let updatedQuestion
    let logAction = action

    switch (action) {
      case "ACCEPT":
        // Teacher accepts question
        if (session.user.role !== "TEACHER" || question.teacherId !== session.user.id) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }
        if (question.status !== "PENDING") {
          return NextResponse.json(
            { error: "Question is not pending" },
            { status: 400 }
          )
        }

        updatedQuestion = await prisma.mathQuestion.update({
          where: { id: params.id },
          data: {
            status: "ACCEPTED",
            acceptedAt: new Date(),
          },
        })

        await prisma.orderLog.create({
          data: {
            userId: session.user.id,
            questionId: question.id,
            fromStatus: "PENDING",
            toStatus: "ACCEPTED",
            action: "ACCEPT",
          },
        })
        break

      case "ANSWER":
        // Teacher submits answer
        if (session.user.role !== "TEACHER" || question.teacherId !== session.user.id) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }
        if (question.status !== "ACCEPTED") {
          return NextResponse.json(
            { error: "Question must be accepted first" },
            { status: 400 }
          )
        }

        const {
          answerText,
          answerImage,
          answerAudio,
          answerVideo,
        } = data

        if (!answerText && !answerImage && !answerAudio && !answerVideo) {
          return NextResponse.json(
            { error: "Answer content is required" },
            { status: 400 }
          )
        }

        updatedQuestion = await prisma.mathQuestion.update({
          where: { id: params.id },
          data: {
            status: "ANSWERED",
            answeredAt: new Date(),
            answerText: answerText || null,
            answerImage: answerImage || null,
            answerAudio: answerAudio || null,
            answerVideo: answerVideo || null,
          },
        })

        await prisma.orderLog.create({
          data: {
            userId: session.user.id,
            questionId: question.id,
            orderNumber: question.orderNumber, // Include current order number
            fromStatus: "ACCEPTED",
            toStatus: "ANSWERED",
            action: "ANSWER",
          },
        })
        break

      case "COMPLETE":
        // Student marks as completed (releases payment)
        if (session.user.role !== "STUDENT" || question.studentId !== session.user.id) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }
        if (question.status !== "ANSWERED") {
          return NextResponse.json(
            { error: "Question must be answered first" },
            { status: 400 }
          )
        }

        const platformFee = question.price * PLATFORM_FEE_RATE
        const teacherPayout = question.price - platformFee

        updatedQuestion = await prisma.mathQuestion.update({
          where: { id: params.id },
          data: {
            status: "COMPLETED",
            completedAt: new Date(),
            paymentReleased: true,
            platformFee,
          },
        })

        await prisma.orderLog.create({
          data: {
            userId: session.user.id,
            questionId: question.id,
            orderNumber: question.orderNumber, // Include current order number
            fromStatus: "ANSWERED",
            toStatus: "COMPLETED",
            action: "COMPLETE",
            metadata: JSON.stringify({ platformFee, teacherPayout }),
          },
        })
        break

      case "CANCEL":
        // Student cancels (only if PENDING)
        if (session.user.role !== "STUDENT" || question.studentId !== session.user.id) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }
        if (question.status !== "PENDING") {
          return NextResponse.json(
            { error: "Can only cancel pending questions" },
            { status: 400 }
          )
        }

        updatedQuestion = await prisma.mathQuestion.update({
          where: { id: params.id },
          data: {
            status: "CANCELLED",
            cancelledAt: new Date(),
            paymentHeld: false,
          },
        })

        await prisma.orderLog.create({
          data: {
            userId: session.user.id,
            questionId: question.id,
            orderNumber: question.orderNumber, // Include current order number
            fromStatus: "PENDING",
            toStatus: "CANCELLED",
            action: "CANCEL",
          },
        })
        break

      case "EXPIRE":
        // System auto-expires (cron job or background task)
        if (question.status !== "PENDING" && question.status !== "ACCEPTED") {
          return NextResponse.json(
            { error: "Cannot expire this question" },
            { status: 400 }
          )
        }

        updatedQuestion = await prisma.mathQuestion.update({
          where: { id: params.id },
          data: {
            status: "EXPIRED",
            expiredAt: new Date(),
            paymentHeld: false,
          },
        })

        await prisma.orderLog.create({
          data: {
            questionId: question.id,
            orderNumber: question.orderNumber, // Include current order number
            fromStatus: question.status,
            toStatus: "EXPIRED",
            action: "EXPIRE",
            metadata: JSON.stringify({ reason: "Auto-expired" }),
          },
        })
        break

      case "REFUND":
        // Admin manually refunds
        if (session.user.role !== "ADMIN") {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        updatedQuestion = await prisma.mathQuestion.update({
          where: { id: params.id },
          data: {
            status: "REFUNDED",
            refundedAt: new Date(),
            paymentHeld: false,
          },
        })

        await prisma.orderLog.create({
          data: {
            userId: session.user.id,
            questionId: question.id,
            orderNumber: question.orderNumber, // Include current order number
            fromStatus: question.status,
            toStatus: "REFUNDED",
            action: "REFUND",
            metadata: JSON.stringify({ reason: data.reason || "Admin refund" }),
          },
        })
        break

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    return NextResponse.json(updatedQuestion)
  } catch (error: any) {
    console.error("Error updating question:", error)
    return NextResponse.json(
      { error: "Failed to update question" },
      { status: 500 }
    )
  }
}

