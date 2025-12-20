// API: Teachers List
// GET: List all teachers with ranking (endorsements, completed answers, activity)

import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET: List teachers with ranking
export async function GET(req: Request) {
  try {
    // Allow unauthenticated access for now (students need to see teachers)
    // const session = await getServerSession(authOptions)
    // if (!session) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    // }

    // Get all teachers
    const teachers = await prisma.user.findMany({
      where: {
        role: "TEACHER",
        banned: false,
      },
      select: {
        id: true,
        name: true,
        uniqueId: true,
        avatar: true,
        createdAt: true,
      },
    })

    console.log(`Found ${teachers.length} teachers in database`)

    // If no teachers found, return empty array instead of error
    if (teachers.length === 0) {
      console.log("No teachers found - database may need seeding")
      return NextResponse.json([])
    }

    // Calculate ranking metrics for each teacher
    const teachersWithRanking = await Promise.all(
      teachers.map(async (teacher) => {
        // Total endorsements (lifetime)
        const totalEndorsements = await prisma.endorsement.count({
          where: { teacherId: teacher.id },
        })

        // Completed answers in last 30 days
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        const recentCompleted = await prisma.mathQuestion.count({
          where: {
            teacherId: teacher.id,
            status: "COMPLETED",
            completedAt: { gte: thirtyDaysAgo },
          },
        })

        // Recent activity (last answer or booking)
        const lastAnswer = await prisma.mathQuestion.findFirst({
          where: { teacherId: teacher.id },
          orderBy: { updatedAt: "desc" },
          select: { updatedAt: true },
        })

        const lastBooking = await prisma.booking.findFirst({
          where: { teacherId: teacher.id },
          orderBy: { updatedAt: "desc" },
          select: { updatedAt: true },
        })

        const lastActivity = lastAnswer?.updatedAt || lastBooking?.updatedAt || teacher.createdAt

        return {
          ...teacher,
          totalEndorsements,
          recentCompleted,
          lastActivity,
        }
      })
    )

    // Sort by ranking priority:
    // 1. Total endorsements (desc)
    // 2. Completed answers in last 30 days (desc)
    // 3. Recent activity (desc)
    teachersWithRanking.sort((a, b) => {
      if (a.totalEndorsements !== b.totalEndorsements) {
        return b.totalEndorsements - a.totalEndorsements
      }
      if (a.recentCompleted !== b.recentCompleted) {
        return b.recentCompleted - a.recentCompleted
      }
      return b.lastActivity.getTime() - a.lastActivity.getTime()
    })

    return NextResponse.json(teachersWithRanking)
  } catch (error: any) {
    console.error("Error fetching teachers:", error)
    return NextResponse.json(
      { error: "Failed to fetch teachers" },
      { status: 500 }
    )
  }
}

