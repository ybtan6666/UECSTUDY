// Direct test of authentication
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json()

    console.log("[TEST-AUTH] Testing:", email)

    // Test database connection
    await prisma.$connect()
    console.log("[TEST-AUTH] Database connected")

    // List all users
    const allUsers = await prisma.user.findMany({
      select: { email: true, role: true, uniqueId: true }
    })
    console.log("[TEST-AUTH] All users:", allUsers)

    // Find specific user
    const user = await prisma.user.findUnique({
      where: { email: email || "student1@uec.com" }
    })

    if (!user) {
      return NextResponse.json({
        success: false,
        error: "User not found",
        availableUsers: allUsers.map(u => u.email),
        databaseConnected: true
      }, { status: 404 })
    }

    console.log("[TEST-AUTH] User found:", user.email)

    // Test password
    const isValid = await bcrypt.compare(password || "student123", user.password)

    return NextResponse.json({
      success: isValid,
      user: {
        email: user.email,
        name: user.name,
        role: user.role,
        uniqueId: user.uniqueId
      },
      passwordMatch: isValid,
      availableUsers: allUsers.map(u => u.email),
      databaseConnected: true
    })
  } catch (error: any) {
    console.error("[TEST-AUTH] Error:", error)
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}

