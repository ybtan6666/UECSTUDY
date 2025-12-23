// API: Admin - Get User Details / Ban/Unban User
// GET: Get user details
// PATCH: Ban or unban user

import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET: Get user details
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        uniqueId: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        banned: true,
        createdAt: true,
        updatedAt: true,
        bookingsAsStudent: {
          include: {
            teacher: {
              select: { id: true, name: true, uniqueId: true },
            },
            timeSlot: {
              select: { startTime: true, endTime: true },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 10, // Recent bookings
        },
        bookingsAsTeacher: {
          include: {
            student: {
              select: { id: true, name: true, uniqueId: true },
            },
            timeSlot: {
              select: { startTime: true, endTime: true },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 10, // Recent bookings
        },
        questionsAsStudent: {
          include: {
            teacher: {
              select: { id: true, name: true, uniqueId: true },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 10, // Recent questions
        },
        questionsAsTeacher: {
          include: {
            student: {
              select: { id: true, name: true, uniqueId: true },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 10, // Recent questions
        },
        _count: {
          select: {
            bookingsAsStudent: true,
            bookingsAsTeacher: true,
            questionsAsStudent: true,
            questionsAsTeacher: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({ user })
  } catch (error: any) {
    console.error("Error fetching user:", error)
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 }
    )
  }
}

// PATCH: Ban or unban user
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { banned, reason } = body

    if (typeof banned !== "boolean") {
      return NextResponse.json(
        { error: "banned field must be a boolean" },
        { status: 400 }
      )
    }

    // Prevent banning yourself
    if (params.id === session.user.id) {
      return NextResponse.json(
        { error: "Cannot ban yourself" },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: params.id },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Prevent banning admins
    if (user.role === "ADMIN" && banned) {
      return NextResponse.json(
        { error: "Cannot ban admin users" },
        { status: 400 }
      )
    }

    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: { banned },
    })

    // Log the action (could be stored in a separate admin log table)
    console.log(
      `[ADMIN] User ${params.id} ${banned ? "banned" : "unbanned"} by ${session.user.id}. Reason: ${reason || "N/A"}`
    )

    return NextResponse.json({
      success: true,
      user: updatedUser,
      message: `User ${banned ? "banned" : "unbanned"} successfully`,
    })
  } catch (error: any) {
    console.error("Error updating user ban status:", error)
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    )
  }
}


