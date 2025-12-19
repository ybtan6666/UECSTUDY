import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const challenges = await prisma.courseChallenge.findMany({
    where: { courseId: params.id },
    include: {
      challenge: {
        include: {
          teacher: { select: { name: true } },
          _count: { select: { attempts: true } },
        },
      },
    },
    orderBy: { order: "asc" },
  })

  return NextResponse.json(challenges)
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)

  if (!session || (session.user as any).role !== "TEACHER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { challengeId } = await req.json()

  // Check if course belongs to teacher
  const course = await prisma.course.findUnique({
    where: { id: params.id },
  })

  if (!course || course.teacherId !== (session.user as any).id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  // Get max order
  const maxOrder = await prisma.courseChallenge.findFirst({
    where: { courseId: params.id },
    orderBy: { order: "desc" },
  })

  const courseChallenge = await prisma.courseChallenge.create({
    data: {
      courseId: params.id,
      challengeId,
      order: (maxOrder?.order || 0) + 1,
    },
  })

  return NextResponse.json(courseChallenge)
}

