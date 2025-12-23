import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { answers } = await req.json()
  const userId = (session.user as any).id

  const challenge = await prisma.challenge.findUnique({
    where: { id: params.id },
    include: { questions: true },
  })

  if (!challenge) {
    return NextResponse.json({ error: "Challenge not found" }, { status: 404 })
  }

  let score = 0
  challenge.questions.forEach((q) => {
    if (answers[q.id] === q.correctAnswer) {
      score++
    }
  })

  // Award coins - virtualCoins field not in current schema
  // await prisma.user.update({
  //   where: { id: userId },
  //   data: {
  //     virtualCoins: {
  //       increment: challenge.coinReward,
  //     },
  //   },
  // })

  await prisma.challengeAttempt.create({
    data: {
      challengeId: params.id,
      studentId: userId,
      score,
      totalQuestions: challenge.questions.length,
      coinsEarned: challenge.coinReward,
    },
  })

  return NextResponse.json({ score, total: challenge.questions.length })
}

