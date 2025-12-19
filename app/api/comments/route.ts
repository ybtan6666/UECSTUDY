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
  where.parentId = null // Only top-level comments

  const comments = await prisma.comment.findMany({
    where,
    include: {
      user: { select: { name: true } },
      replies: {
        include: {
          user: { select: { name: true } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(comments)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { content, courseId, challengeId, questionId, parentId } = await req.json()

  const comment = await prisma.comment.create({
    data: {
      content,
      userId: (session.user as any).id,
      courseId: courseId || null,
      challengeId: challengeId || null,
      questionId: questionId || null,
      parentId: parentId || null,
    },
    include: {
      user: { select: { name: true } },
    },
  })

  return NextResponse.json(comment)
}

