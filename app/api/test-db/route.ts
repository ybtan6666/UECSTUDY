// Test database connection and data
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    // Test connection
    await prisma.$connect()
    
    // Count users
    const userCount = await prisma.user.count()
    const teachers = await prisma.user.findMany({
      where: { role: "TEACHER" },
      select: { id: true, email: true, name: true, uniqueId: true },
    })
    const students = await prisma.user.findMany({
      where: { role: "STUDENT" },
      select: { id: true, email: true, name: true, uniqueId: true },
    })

    return NextResponse.json({
      connected: true,
      userCount,
      teachers,
      students,
      message: userCount === 0 ? "Database is empty. Run: npm run db:seed" : "Database has data",
    })
  } catch (error: any) {
    return NextResponse.json({
      connected: false,
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    }, { status: 500 })
  }
}

