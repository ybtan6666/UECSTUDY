import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { email, name, password, role } = body

    if (!email || !name || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 })
    }

    // For teachers: Don't create user yet, just validate and return success
    // User will be created after verification code is entered
    if (role === "TEACHER") {
      return NextResponse.json({ 
        message: "Signup data validated. Please proceed to verification.",
        requiresVerification: true
      }, { status: 200 })
    }

    // For students: Create user immediately (no verification required)
    const hashedPassword = await bcrypt.hash(password, 10)
    
    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role: role || "STUDENT",
        uniqueId: `UEC-${Math.floor(1000 + Math.random() * 9000)}`, // Simple ID generation
      },
    })

    return NextResponse.json({ 
      message: "User created successfully", 
      user: { id: user.id } 
    }, { status: 201 })

  } catch (error: any) {
    console.error("Signup error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}