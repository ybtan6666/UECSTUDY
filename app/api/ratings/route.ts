import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const courseId = searchParams.get("courseId")
  const challengeId = searchParams.get("challengeId")
  const questionId = searchParams.get("questionId")

  const where: any = {}
  if (courseId) where.courseId = courseId
  if (challengeId) where.challengeId = challengeId
  if (questionId) where.questionId = questionId

  const ratings = await prisma.rating.findMany({
    where,
    include: {
      user: {
        select: { name: true, uniqueId: true, avatar: true },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  // Calculate average rating
  const avgRating = ratings.length > 0
    ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
    : 0

  return NextResponse.json({ ratings, averageRating: avgRating, totalRatings: ratings.length })
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { courseId, challengeId, questionId, rating, review } = await req.json()

  if (!rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 })
  }

  const userId = (session.user as any).id

  // Check if rating already exists
  const where: any = { userId }
  if (courseId) where.courseId = courseId
  if (challengeId) where.challengeId = challengeId
  if (questionId) where.questionId = questionId

  const existing = await prisma.rating.findFirst({ where })

  let result
  if (existing) {
    // Update existing rating
    result = await prisma.rating.update({
      where: { id: existing.id },
      data: { rating, review: review || null },
    })
  } else {
    // Create new rating
    result = await prisma.rating.create({
      data: {
        userId,
        courseId: courseId || null,
        challengeId: challengeId || null,
        questionId: questionId || null,
        rating,
        review: review || null,
      },
    })
  }

  return NextResponse.json(result)
}

