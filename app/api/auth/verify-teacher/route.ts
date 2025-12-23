// API: Verify Teacher Registration Code
// POST: Verify the code and complete teacher registration

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { generateUECId, generateAvatar } from "@/lib/utils"

export async function POST(req: Request) {
  try {
    const { email, verificationCode } = await req.json()

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

    // Check if user exists (from initial signup step)
    // We'll store the user data temporarily or check if they exist
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      return NextResponse.json(
        { error: "User not found. Please complete signup first." },
        { status: 404 }
      )
    }

    // Check if user is already a teacher (shouldn't happen, but safety check)
    if (user.role !== "TEACHER") {
      return NextResponse.json(
        { error: "User is not registering as a teacher" },
        { status: 400 }
      )
    }

    // Mark the verification code as used
    await prisma.verificationCode.update({
      where: { id: codeRecord.id },
      data: {
        used: true,
        usedBy: user.id,
        usedAt: new Date(),
      },
    })

    // User is now verified - registration is complete
    return NextResponse.json({
      success: true,
      message: "Verification successful. Registration complete!",
    })
  } catch (error: any) {
    console.error("Error verifying teacher code:", error)
    return NextResponse.json(
      { error: "Failed to verify code" },
      { status: 500 }
    )
  }
}

