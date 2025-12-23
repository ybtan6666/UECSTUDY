// API: Admin - View All Transactions
// GET: Get all transactions (bookings + questions) sorted by date

import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get all bookings
    const bookings = await prisma.booking.findMany({
      include: {
        student: {
          select: { id: true, name: true, uniqueId: true, email: true, avatar: true },
        },
        teacher: {
          select: { id: true, name: true, uniqueId: true, email: true, avatar: true },
        },
        timeSlot: {
          select: { startTime: true, endTime: true, isGroupSession: true },
        },
        orderLogs: {
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    // Get all questions
    const questions = await prisma.mathQuestion.findMany({
      include: {
        student: {
          select: { id: true, name: true, uniqueId: true, email: true, avatar: true },
        },
        teacher: {
          select: { id: true, name: true, uniqueId: true, email: true, avatar: true },
        },
        orderLogs: {
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    // Combine and sort by date
    const transactions = [
      ...bookings.map((b) => ({
        id: b.id,
        type: "BOOKING",
        student: b.student,
        teacher: b.teacher,
        amount: b.price,
        status: b.status,
        paymentStatus: b.paymentStatus,
        createdAt: b.createdAt,
        completedAt: b.completedAt,
        cancelledAt: b.cancelledAt,
        refundedAt: b.refundedAt,
        platformFee: b.platformFee,
        timeSlot: b.timeSlot,
        orderLogs: b.orderLogs,
      })),
      ...questions.map((q) => ({
        id: q.id,
        type: "QUESTION",
        student: q.student,
        teacher: q.teacher,
        amount: q.price,
        status: q.status,
        paymentStatus: q.paymentHeld ? "COMPLETED" : "PENDING",
        createdAt: q.createdAt,
        completedAt: q.completedAt,
        cancelledAt: q.cancelledAt,
        refundedAt: q.refundedAt,
        platformFee: q.platformFee,
        orderLogs: q.orderLogs,
      })),
    ].sort((a, b) => {
      // Sort by createdAt descending (newest first)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

    return NextResponse.json({ transactions })
  } catch (error: any) {
    console.error("Error fetching transactions:", error)
    return NextResponse.json(
      { error: "Failed to fetch transactions" },
      { status: 500 }
    )
  }
}


