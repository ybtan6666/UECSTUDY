// API: Teacher Bookings (Feature B)
// POST: Create a booking
// GET: List bookings

import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { generateOrderNumber } from "@/lib/utils"

const PLATFORM_FEE_RATE = 0.15

// POST: Create a booking
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "STUDENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const {
      timeSlotId,
      topic,
      expectations,
      preferredFormat,
      price,
    } = body

    // Get time slot
    const timeSlot = await prisma.timeSlot.findUnique({
      where: { id: timeSlotId },
      include: { bookings: true },
    })

    if (!timeSlot) {
      return NextResponse.json({ error: "Time slot not found" }, { status: 404 })
    }

    if (timeSlot.status !== "AVAILABLE") {
      return NextResponse.json(
        { error: "Time slot is not available" },
        { status: 400 }
      )
    }

    if (price < timeSlot.minPrice) {
      return NextResponse.json(
        { error: `Minimum price is MYR ${timeSlot.minPrice}` },
        { status: 400 }
      )
    }

    // Check if slot is full (count accepted and pending bookings with completed payment)
    // Also count pending bookings that haven't paid yet (they might complete payment)
    const currentBookings = timeSlot.bookings.filter(
      (b) => 
        (b.status === "ACCEPTED" || b.status === "PENDING") && 
        (b.paymentStatus === "COMPLETED" || b.paymentStatus === "PENDING")
    )
    if (currentBookings.length >= timeSlot.maxStudents) {
      return NextResponse.json(
        { error: "Time slot is full" },
        { status: 400 }
      )
    }

    // Check if student already has an active booking for this slot
    const existingActiveBooking = await prisma.booking.findFirst({
      where: {
        timeSlotId,
        studentId: session.user.id,
        status: { notIn: ["CANCELLED", "REFUNDED", "EXPIRED"] },
      },
    })

    if (existingActiveBooking) {
      return NextResponse.json(
        { error: "You have already booked this slot" },
        { status: 400 }
      )
    }

    // If there's a cancelled booking for this slot, update it instead of creating new
    // This is needed because of the unique constraint on (timeSlotId, studentId)
    const cancelledBooking = await prisma.booking.findFirst({
      where: {
        timeSlotId,
        studentId: session.user.id,
        status: { in: ["CANCELLED", "REFUNDED", "EXPIRED"] },
      },
    })

    if (cancelledBooking) {
      // Generate new order number for rebooking
      const newOrderNumber = await generateOrderNumber(prisma)
      
      // Update the cancelled booking to a new PENDING booking
      const updatedBooking = await prisma.booking.update({
        where: { id: cancelledBooking.id },
        data: {
          orderNumber: newOrderNumber, // New order number for rebooking
          topic: topic || null,
          expectations: expectations || null,
          preferredFormat: preferredFormat || null,
          price,
          status: "PENDING",
          paymentStatus: "PENDING",
          paymentHeld: false,
          paymentReleased: false,
          cancelledAt: null,
          cancelledBy: null,
          cancellationReason: null,
          refundedAt: null,
          completedAt: null,
          expiredAt: null,
          noShowAt: null,
          platformFee: null,
          paidAt: null,
        },
      })

      // Update time slot status if it becomes full
      if (currentBookings.length + 1 >= timeSlot.maxStudents) {
        await prisma.timeSlot.update({
          where: { id: timeSlotId },
          data: { status: "BOOKED" },
        })
      }

      // Log the rebooking with the new order number
      await prisma.orderLog.create({
        data: {
          userId: session.user.id,
          bookingId: updatedBooking.id,
          orderNumber: newOrderNumber, // Use the new order number
          fromStatus: cancelledBooking.status,
          toStatus: "PENDING",
          action: "REBOOK",
          metadata: JSON.stringify({ price, timeSlotId, paymentStatus: "PENDING", previousStatus: cancelledBooking.status, previousOrderNumber: cancelledBooking.orderNumber }),
        },
      })

      return NextResponse.json(updatedBooking)
    }

    // Create booking - starts as PENDING until payment is completed
    // For group sessions, if min students reached, auto-accept and generate links
    const willBeFull = currentBookings.length + 1 >= timeSlot.maxStudents
    const isGroupReady = timeSlot.isGroupSession && 
      currentBookings.length + 1 >= timeSlot.minStudents
    
    // Auto-accept if it's a regular slot (not group) or if group session reaches min students
    // But only after payment is completed
    const initialStatus = "PENDING" // Always start as PENDING, payment will update status

    // Generate unique order number
    const orderNumber = await generateOrderNumber(prisma)

    const booking = await prisma.booking.create({
      data: {
        orderNumber,
        timeSlotId,
        studentId: session.user.id,
        teacherId: timeSlot.teacherId,
        topic: topic || null,
        expectations: expectations || null,
        preferredFormat: preferredFormat || null,
        price,
        status: initialStatus,
        paymentStatus: "PENDING",
        paymentHeld: false, // Payment not held until payment is completed
        isGroupBooking: timeSlot.isGroupSession,
        groupId: timeSlot.isGroupSession ? timeSlot.id : null,
      },
    })

    // Update time slot status if full
    if (currentBookings.length + 1 >= timeSlot.maxStudents) {
      await prisma.timeSlot.update({
        where: { id: timeSlotId },
        data: { status: "BOOKED" },
      })
    }

    // Log order creation with order number
    await prisma.orderLog.create({
      data: {
        userId: session.user.id,
        bookingId: booking.id,
        orderNumber: orderNumber, // Include order number
        toStatus: "PENDING",
        action: "CREATE",
        metadata: JSON.stringify({ price, timeSlotId, paymentStatus: "PENDING" }),
      },
    })

    return NextResponse.json(booking)
  } catch (error: any) {
    console.error("Error creating booking:", error)
    console.error("Error message:", error.message)
    console.error("Error stack:", error.stack)
    
    // Return detailed error in development
    const errorMessage = process.env.NODE_ENV === "development" 
      ? error.message || "Failed to create booking"
      : "Failed to create booking"
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: process.env.NODE_ENV === "development" ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

// GET: List bookings
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const filter = searchParams.get("filter") // "my-bookings", "my-slots"

    if (session.user.role === "STUDENT") {
      const bookings = await prisma.booking.findMany({
        where: {
          studentId: session.user.id,
        },
        include: {
          timeSlot: true,
          teacher: {
            select: { id: true, name: true, uniqueId: true, avatar: true },
          },
        },
        orderBy: { createdAt: "desc" },
      })
      return NextResponse.json(bookings)
    }

    if (session.user.role === "TEACHER") {
      const bookings = await prisma.booking.findMany({
        where: {
          teacherId: session.user.id,
        },
        include: {
          timeSlot: true,
          student: {
            select: { id: true, name: true, uniqueId: true, avatar: true },
          },
        },
        orderBy: { createdAt: "desc" },
      })
      return NextResponse.json(bookings)
    }

    return NextResponse.json({ error: "Invalid role" }, { status: 403 })
  } catch (error: any) {
    console.error("Error fetching bookings:", error)
    return NextResponse.json(
      { error: "Failed to fetch bookings" },
      { status: 500 }
    )
  }
}

