// API: Booking Payment
// POST: Process payment for a booking
// GET: Get payment status

import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// POST: Process payment
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "STUDENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { paymentMethod } = body

    // Validate payment method
    const validMethods = ["BANK_TRANSFER", "E_WALLET", "CREDIT_CARD"]
    if (!validMethods.includes(paymentMethod)) {
      return NextResponse.json(
        { error: "Invalid payment method" },
        { status: 400 }
      )
    }

    // Get booking
    const booking = await prisma.booking.findUnique({
      where: { id: params.id },
      include: {
        timeSlot: {
          include: { bookings: true },
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

    // Check if already paid
    if (booking.paymentStatus === "COMPLETED") {
      return NextResponse.json(
        { error: "Payment already completed" },
        { status: 400 }
      )
    }

    // Simulate payment processing
    // In production, this would integrate with actual payment gateway
    // For now, we'll simulate a successful payment after a delay
    
    // Update booking with payment method and process payment
    const updatedBooking = await prisma.booking.update({
      where: { id: params.id },
      data: {
        paymentMethod,
        paymentStatus: "PROCESSING",
      },
    })

    // Simulate payment gateway redirect
    // In production, this would return actual payment gateway URL
    const paymentGatewayUrl = `/bookings/${params.id}/payment/process?method=${paymentMethod}`

    // Log payment initiation
    await prisma.orderLog.create({
      data: {
        userId: session.user.id,
        bookingId: booking.id,
        fromStatus: booking.status,
        toStatus: booking.status, // Status doesn't change until payment completes
        action: "PAYMENT_INITIATED",
        metadata: JSON.stringify({ paymentMethod, status: "PROCESSING" }),
      },
    })

    return NextResponse.json({
      success: true,
      paymentGatewayUrl,
      booking: updatedBooking,
    })
  } catch (error: any) {
    console.error("Error processing payment:", error)
    return NextResponse.json(
      { error: "Failed to process payment" },
      { status: 500 }
    )
  }
}

// GET: Get payment status
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const booking = await prisma.booking.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        paymentMethod: true,
        paymentStatus: true,
        paidAt: true,
        studentId: true,
        teacherId: true,
      },
    })

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 })
    }

    // Check access
    if (
      booking.studentId !== session.user.id &&
      booking.teacherId !== session.user.id &&
      session.user.role !== "ADMIN"
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    return NextResponse.json({
      paymentMethod: booking.paymentMethod,
      paymentStatus: booking.paymentStatus,
      paidAt: booking.paidAt,
    })
  } catch (error: any) {
    console.error("Error fetching payment status:", error)
    return NextResponse.json(
      { error: "Failed to fetch payment status" },
      { status: 500 }
    )
  }
}

