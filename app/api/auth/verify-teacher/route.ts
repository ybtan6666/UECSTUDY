// API: Verify Teacher Registration Code
// POST: Verify the code and complete teacher registration

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { generateUECId, generateAvatar } from "@/lib/utils"

export async function POST(req: Request) {
  try {
    const { email, verificationCode, name, password } = await req.json()

    if (!email || !verificationCode) {
      return NextResponse.json(
        { error: "Email and verification code are required" },
        { status: 400 }
      )
    }

    // Find the verification code
    const codeRecord = await prisma.verificationCode.findUnique({
      where: { code: verificationCode },
    })

    if (!codeRecord) {
      return NextResponse.json(
        { error: "Invalid verification code" },
        { status: 400 }
      )
    }

    if (codeRecord.used) {
      return NextResponse.json(
        { error: "Verification code has already been used" },
        { status: 400 }
      )
    }

    // Check if user already exists (shouldn't happen if signup didn't create user)
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists. Please sign in instead." },
        { status: 400 }
      )
    }

    // Verify that we have the signup data to create the user
    if (!name || !password) {
      return NextResponse.json(
        { error: "Missing signup data. Please complete signup first." },
        { status: 400 }
      )
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create the user AFTER verification is successful
    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role: "TEACHER",
        uniqueId: `UEC-${Math.floor(1000 + Math.random() * 9000)}`,
      },
    })

    // Mark the verification code as used
    await prisma.verificationCode.update({
      where: { id: codeRecord.id },
      data: {
        used: true,
        usedBy: user.id,
        usedAt: new Date(),
      },
    })

    // User is now created and verified - registration is complete
    // Return userId so frontend can redirect to complete-profile page
    return NextResponse.json({
      success: true,
      message: "Verification successful. Registration complete!",
      userId: user.id,
    })
  } catch (error: any) {
    console.error("Error verifying teacher code:", error)
    return NextResponse.json(
      { error: "Failed to verify code" },
      { status: 500 }
    )
  }
}

