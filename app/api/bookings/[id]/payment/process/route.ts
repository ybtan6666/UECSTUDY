// API: Payment Processing (Simulated Payment Gateway)
// This simulates the payment gateway callback
// In production, this would be called by the actual payment gateway

import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const PLATFORM_FEE_RATE = 0.15

// POST: Complete payment (simulated)
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "STUDENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const method = searchParams.get("method")
    const success = searchParams.get("success") !== "false" // Default to success for simulation

    // Get booking
    const booking = await prisma.booking.findUnique({
      where: { id: params.id },
      include: {
        timeSlot: {
          include: {
            bookings: {
              where: {
                paymentStatus: "COMPLETED",
                status: { in: ["PENDING", "ACCEPTED"] },
              },
            },
          },
        },
      },
    })

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 })
    }

    // Check ownership
    if (booking.studentId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    if (success) {
      // Payment successful
      const isGroupReady =
        booking.timeSlot.isGroupSession &&
        booking.timeSlot.bookings.length + 1 >= booking.timeSlot.minStudents

      // Auto-accept if it's a regular slot or group session is ready
      const newStatus = !booking.timeSlot.isGroupSession || isGroupReady ? "ACCEPTED" : "PENDING"
      const acceptedAt = newStatus === "ACCEPTED" ? new Date() : null

      // Update booking with payment completion
      const updatedBooking = await prisma.booking.update({
        where: { id: params.id },
        data: {
          paymentStatus: "COMPLETED",
          paymentMethod: method || booking.paymentMethod,
          paymentHeld: true, // Payment is now held in escrow
          paidAt: new Date(),
          status: newStatus,
          acceptedAt,
        },
      })

      // If group session and min students reached, generate meeting/chat links
      if (isGroupReady && !booking.timeSlot.meetingLink) {
        const meetingLink = `https://meet.example.com/${booking.timeSlot.id}`
        const groupChatLink = `https://chat.example.com/${booking.timeSlot.id}`

        await prisma.timeSlot.update({
          where: { id: booking.timeSlotId },
          data: { meetingLink, groupChatLink },
        })
      }

      // Update time slot status if full
      const currentBookings = booking.timeSlot.bookings.length
      if (currentBookings + 1 >= booking.timeSlot.maxStudents) {
        await prisma.timeSlot.update({
          where: { id: booking.timeSlotId },
          data: { status: "BOOKED" },
        })
      }

      // Log payment completion
      await prisma.orderLog.create({
        data: {
          userId: session.user.id,
          bookingId: booking.id,
          fromStatus: booking.status,
          toStatus: newStatus,
          action: "PAYMENT_COMPLETED",
          metadata: JSON.stringify({
            paymentMethod: method,
            paymentStatus: "COMPLETED",
            autoAccepted: newStatus === "ACCEPTED",
          }),
        },
      })

      return NextResponse.json({
        success: true,
        booking: updatedBooking,
        redirectUrl: `/bookings/${params.id}`,
      })
    } else {
      // Payment failed
      await prisma.booking.update({
        where: { id: params.id },
        data: {
          paymentStatus: "FAILED",
        },
      })

      await prisma.orderLog.create({
        data: {
          userId: session.user.id,
          bookingId: booking.id,
          fromStatus: booking.status,
          toStatus: booking.status,
          action: "PAYMENT_FAILED",
          metadata: JSON.stringify({ paymentMethod: method }),
        },
      })

      return NextResponse.json({
        success: false,
        error: "Payment failed",
        redirectUrl: `/bookings/${params.id}/payment`,
      })
    }
  } catch (error: any) {
    console.error("Error processing payment:", error)
    return NextResponse.json(
      { error: "Failed to process payment" },
      { status: 500 }
    )
  }
}

