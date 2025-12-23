// API: Admin - Generate Verification Codes
// POST: Generate a new 6-digit verification code

import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Generate a random 6-digit code
function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// POST: Generate a new verification code
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Generate a unique code
    let code: string
    let attempts = 0
    do {
      code = generateCode()
      const existing = await prisma.verificationCode.findUnique({
        where: { code },
      })
      if (!existing) break
      attempts++
      if (attempts > 100) {
        return NextResponse.json(
          { error: "Failed to generate unique code" },
          { status: 500 }
        )
      }
    } while (true)

    // Create verification code (no expiration by default, but can be set)
    const verificationCode = await prisma.verificationCode.create({
      data: {
        code,
        used: false,
      },
    })

    return NextResponse.json({
      success: true,
      code: verificationCode.code,
      message: "Verification code generated successfully",
    })
  } catch (error: any) {
    console.error("Error generating verification code:", error)
    return NextResponse.json(
      { error: "Failed to generate verification code" },
      { status: 500 }
    )
  }
}

// GET: List all verification codes
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const used = searchParams.get("used") // "true" or "false"

    const where: any = {}
    if (used === "true") {
      where.used = true
    } else if (used === "false") {
      where.used = false
    }

    const codes = await prisma.verificationCode.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100, // Limit to recent 100
      include: {
        // We'll get user info if usedBy exists
      },
    })

    // Get user info for used codes
    const codesWithUserInfo = await Promise.all(
      codes.map(async (code) => {
        if (code.usedBy) {
          const user = await prisma.user.findUnique({
            where: { id: code.usedBy },
            select: { id: true, name: true, email: true, uniqueId: true },
          })
          return {
            ...code,
            usedByUser: user,
          }
        }
        return code
      })
    )

    return NextResponse.json({ codes: codesWithUserInfo })
  } catch (error: any) {
    console.error("Error fetching verification codes:", error)
    return NextResponse.json(
      { error: "Failed to fetch verification codes" },
      { status: 500 }
    )
  }
}

