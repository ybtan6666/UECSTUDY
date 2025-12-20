// Check if a user exists and verify password
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      return NextResponse.json({ 
        exists: false,
        message: "User not found",
        email 
      })
    }

    const isValid = await bcrypt.compare(password, user.password)

    return NextResponse.json({
      exists: true,
      email: user.email,
      name: user.name,
      role: user.role,
      uniqueId: user.uniqueId,
      passwordMatch: isValid,
      passwordHash: user.password.substring(0, 20) + "...", // Show first 20 chars for debugging
    })
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    }, { status: 500 })
  }
}

