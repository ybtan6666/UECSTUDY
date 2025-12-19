import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const challenges = await prisma.challenge.findMany({
    include: {
      teacher: {
        select: { name: true },
      },
      _count: {
        select: { attempts: true },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(challenges)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)

  if (!session || (session.user as any).role !== "TEACHER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { title, subject, coinReward, questions } = await req.json()

  const challenge = await prisma.challenge.create({
    data: {
      title,
      subject,
      coinReward,
      teacherId: (session.user as any).id,
      questions: {
        create: questions.map((q: any, index: number) => ({
          question: q.question,
          optionA: q.optionA,
          optionB: q.optionB,
          optionC: q.optionC,
          optionD: q.optionD,
          correctAnswer: q.correctAnswer,
          order: index,
        })),
      },
    },
    include: {
      questions: true,
    },
  })

  return NextResponse.json(challenge)
}

