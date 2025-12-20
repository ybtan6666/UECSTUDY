// API: Single Booking
// GET: Get booking details
// PATCH: Update booking (complete, cancel, etc.)

import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const PLATFORM_FEE_RATE = 0.15

// GET: Get booking details
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
      include: {
        timeSlot: true,
        student: {
          select: { id: true, name: true, uniqueId: true, avatar: true },
        },
        teacher: {
          select: { id: true, name: true, uniqueId: true, avatar: true },
        },
        orderLogs: {
          include: {
            user: {
              select: { id: true, name: true, uniqueId: true },
            },
          },
          orderBy: { createdAt: "asc" },
        },
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

    return NextResponse.json(booking)
  } catch (error: any) {
    console.error("Error fetching booking:", error)
    return NextResponse.json(
      { error: "Failed to fetch booking" },
      { status: 500 }
    )
  }
}

// PATCH: Update booking
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

    const booking = await prisma.booking.findUnique({
      where: { id: params.id },
    })

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 })
    }

    let updatedBooking
    let logAction = action

    switch (action) {
      case "COMPLETE":
        // Teacher or student marks as completed
        if (
          (session.user.role !== "TEACHER" || booking.teacherId !== session.user.id) &&
          (session.user.role !== "STUDENT" || booking.studentId !== session.user.id)
        ) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }
        if (booking.status !== "CONFIRMED") {
          return NextResponse.json(
            { error: "Booking must be confirmed" },
            { status: 400 }
          )
        }

        const platformFee = booking.price * PLATFORM_FEE_RATE
        const teacherPayout = booking.price - platformFee

        updatedBooking = await prisma.booking.update({
          where: { id: params.id },
          data: {
            status: "COMPLETED",
            completedAt: new Date(),
            paymentReleased: true,
            platformFee,
          },
        })

        // Update time slot status
        await prisma.timeSlot.update({
          where: { id: booking.timeSlotId },
          data: { status: "COMPLETED" },
        })

        await prisma.orderLog.create({
          data: {
            userId: session.user.id,
            bookingId: booking.id,
            fromStatus: "CONFIRMED",
            toStatus: "COMPLETED",
            action: "COMPLETE",
            metadata: JSON.stringify({ platformFee, teacherPayout }),
          },
        })
        break

      case "CANCEL_BY_STUDENT":
        // Student cancels
        if (session.user.role !== "STUDENT" || booking.studentId !== session.user.id) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }
        if (booking.status !== "CONFIRMED") {
          return NextResponse.json(
            { error: "Can only cancel confirmed bookings" },
            { status: 400 }
          )
        }

        updatedBooking = await prisma.booking.update({
          where: { id: params.id },
          data: {
            status: "CANCELLED_BY_STUDENT",
            cancelledAt: new Date(),
            cancelledBy: "STUDENT",
            cancellationReason: data.reason || null,
            paymentHeld: false,
          },
        })

        // Free up time slot
        await prisma.timeSlot.update({
          where: { id: booking.timeSlotId },
          data: { status: "AVAILABLE" },
        })

        await prisma.orderLog.create({
          data: {
            userId: session.user.id,
            bookingId: booking.id,
            fromStatus: "CONFIRMED",
            toStatus: "CANCELLED_BY_STUDENT",
            action: "CANCEL",
            metadata: JSON.stringify({ reason: data.reason }),
          },
        })
        break

      case "CANCEL_BY_TEACHER":
        // Teacher cancels (full refund)
        if (session.user.role !== "TEACHER" || booking.teacherId !== session.user.id) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }
        if (booking.status !== "CONFIRMED") {
          return NextResponse.json(
            { error: "Can only cancel confirmed bookings" },
            { status: 400 }
          )
        }

        updatedBooking = await prisma.booking.update({
          where: { id: params.id },
          data: {
            status: "CANCELLED_BY_TEACHER",
            cancelledAt: new Date(),
            cancelledBy: "TEACHER",
            cancellationReason: data.reason || null,
            paymentHeld: false,
            refundedAt: new Date(),
          },
        })

        // Free up time slot
        await prisma.timeSlot.update({
          where: { id: booking.timeSlotId },
          data: { status: "AVAILABLE" },
        })

        await prisma.orderLog.create({
          data: {
            userId: session.user.id,
            bookingId: booking.id,
            fromStatus: "CONFIRMED",
            toStatus: "CANCELLED_BY_TEACHER",
            action: "CANCEL",
            metadata: JSON.stringify({ reason: data.reason, refunded: true }),
          },
        })
        break

      case "NO_SHOW":
        // Teacher marks student as no-show (no refund)
        if (session.user.role !== "TEACHER" || booking.teacherId !== session.user.id) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }
        if (booking.status !== "CONFIRMED") {
          return NextResponse.json(
            { error: "Booking must be confirmed" },
            { status: 400 }
          )
        }

        const noShowPlatformFee = booking.price * PLATFORM_FEE_RATE
        const noShowTeacherPayout = booking.price - noShowPlatformFee

        updatedBooking = await prisma.booking.update({
          where: { id: params.id },
          data: {
            status: "NO_SHOW",
            noShowAt: new Date(),
            paymentReleased: true,
            platformFee: noShowPlatformFee,
          },
        })

        await prisma.orderLog.create({
          data: {
            userId: session.user.id,
            bookingId: booking.id,
            fromStatus: "CONFIRMED",
            toStatus: "NO_SHOW",
            action: "NO_SHOW",
            metadata: JSON.stringify({ platformFee: noShowPlatformFee, teacherPayout: noShowTeacherPayout }),
          },
        })
        break

      case "REFUND":
        // Admin manually refunds
        if (session.user.role !== "ADMIN") {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        updatedBooking = await prisma.booking.update({
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
            bookingId: booking.id,
            fromStatus: booking.status,
            toStatus: "REFUNDED",
            action: "REFUND",
            metadata: JSON.stringify({ reason: data.reason || "Admin refund" }),
          },
        })
        break

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    return NextResponse.json(updatedBooking)
  } catch (error: any) {
    console.error("Error updating booking:", error)
    return NextResponse.json(
      { error: "Failed to update booking" },
      { status: 500 }
    )
  }
}

