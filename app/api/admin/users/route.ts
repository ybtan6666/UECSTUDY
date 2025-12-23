// API: Admin - List and Search Users
// GET: Get all users with optional search

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

    const { searchParams } = new URL(req.url)
    const search = searchParams.get("search") || ""
    const role = searchParams.get("role") || "" // Optional role filter

    // Build where clause
    const where: any = {}

    if (search) {
      // SQLite doesn't support case-insensitive mode, so we'll use contains
      // In production with PostgreSQL, you could use mode: "insensitive"
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { uniqueId: { contains: search } },
      ]
    }

    if (role) {
      where.role = role
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        uniqueId: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        banned: true,
        createdAt: true,
        _count: {
          select: {
            bookingsAsStudent: true,
            bookingsAsTeacher: true,
            questionsAsStudent: true,
            questionsAsTeacher: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ users })
  } catch (error: any) {
    console.error("Error fetching users:", error)
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    )
  }
}

