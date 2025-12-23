// API: Admin - Manually Trigger Refund
// POST: Refund a booking or question

import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { type, id, reason } = body // type: "BOOKING" | "QUESTION"

    if (!type || !id) {
      return NextResponse.json(
        { error: "Type and ID are required" },
        { status: 400 }
      )
    }

    if (type === "BOOKING") {
      const booking = await prisma.booking.findUnique({
        where: { id },
      })

      if (!booking) {
        return NextResponse.json(
          { error: "Booking not found" },
          { status: 404 }
        )
      }

      if (booking.status === "REFUNDED") {
        return NextResponse.json(
          { error: "Booking already refunded" },
          { status: 400 }
        )
      }

      // Update booking status
      const updatedBooking = await prisma.booking.update({
        where: { id },
        data: {
          status: "REFUNDED",
          paymentStatus: "REFUNDED",
          refundedAt: new Date(),
        },
      })

      // Log the refund with order number
      await prisma.orderLog.create({
        data: {
          userId: session.user.id,
          bookingId: id,
          orderNumber: updatedBooking.orderNumber, // Include current order number
          fromStatus: booking.status,
          toStatus: "REFUNDED",
          action: "REFUND",
          metadata: JSON.stringify({
            reason: reason || "Admin manual refund",
            refundedBy: session.user.id,
            refundedAt: new Date().toISOString(),
          }),
        },
      })

      return NextResponse.json({
        success: true,
        booking: updatedBooking,
        message: "Refund processed successfully",
      })
    } else if (type === "QUESTION") {
      const question = await prisma.mathQuestion.findUnique({
        where: { id },
      })

      if (!question) {
        return NextResponse.json(
          { error: "Question not found" },
          { status: 404 }
        )
      }

      if (question.status === "REFUNDED") {
        return NextResponse.json(
          { error: "Question already refunded" },
          { status: 400 }
        )
      }

      // Update question status
      const updatedQuestion = await prisma.mathQuestion.update({
        where: { id },
        data: {
          status: "REFUNDED",
          paymentHeld: false,
          refundedAt: new Date(),
        },
      })

      // Log the refund with order number
      await prisma.orderLog.create({
        data: {
          userId: session.user.id,
          questionId: id,
          orderNumber: updatedQuestion.orderNumber, // Include current order number
          fromStatus: question.status,
          toStatus: "REFUNDED",
          action: "REFUND",
          metadata: JSON.stringify({
            reason: reason || "Admin manual refund",
            refundedBy: session.user.id,
            refundedAt: new Date().toISOString(),
          }),
        },
      })

      return NextResponse.json({
        success: true,
        question: updatedQuestion,
        message: "Refund processed successfully",
      })
    } else {
      return NextResponse.json(
        { error: "Invalid type. Must be 'BOOKING' or 'QUESTION'" },
        { status: 400 }
      )
    }
  } catch (error: any) {
    console.error("Error processing refund:", error)
    return NextResponse.json(
      { error: "Failed to process refund" },
      { status: 500 }
    )
  }
}


