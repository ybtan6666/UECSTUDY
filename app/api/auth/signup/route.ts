import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { generateUECId, generateAvatar } from "@/lib/utils"

export async function POST(req: Request) {
  try {
    const { name, email, password, role } = await req.json()

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "Email already exists" },
        { status: 400 }
      )
    }

    // Generate unique ID - check for existing to avoid duplicates
    let uniqueId: string
    let attempts = 0
    do {
      const userCount = await prisma.user.count({
        where: { role: role || "STUDENT" },
      })
      uniqueId = generateUECId(role || "STUDENT", userCount + attempts)
      attempts++
      
      // Check if this ID already exists
      const existing = await prisma.user.findUnique({
        where: { uniqueId },
      })
      
      if (!existing) break
      if (attempts > 100) {
        // Fallback: use timestamp
        uniqueId = `UEC-${role === "STUDENT" ? "STU" : role === "TEACHER" ? "TEA" : "ADM"}-${Date.now()}`
        break
      }
    } while (true)
    const hashedPassword = await bcrypt.hash(password, 10)
    const avatar = generateAvatar(name)

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role || "STUDENT",
        uniqueId,
        avatar,
      },
    })

    // If teacher, return success but indicate verification is needed
    if (role === "TEACHER") {
      return NextResponse.json({
        success: true,
        requiresVerification: true,
        email: user.email,
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Signup error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

