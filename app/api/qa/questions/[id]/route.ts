import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { addDays, isPast } from "date-fns"

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const question = await prisma.paidQuestion.findUnique({
    where: { id: params.id },
    include: {
      student: { select: { name: true, id: true } },
      teacher: { select: { name: true, id: true } },
      course: { select: { title: true, id: true } },
    },
  })

  if (!question) {
    return NextResponse.json({ error: "Question not found" }, { status: 404 })
  }

  // Check if refundable (no answer and past deadline)
  if (!question.answeredAt && isPast(question.deadline) && !question.isRefundable) {
    await prisma.paidQuestion.update({
      where: { id: params.id },
      data: { isRefundable: true },
    })
    question.isRefundable = true
  }

  return NextResponse.json(question)
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { answer } = await req.json()
  const userId = (session.user as any).id

  const question = await prisma.paidQuestion.findUnique({
    where: { id: params.id },
  })

  if (!question) {
    return NextResponse.json({ error: "Question not found" }, { status: 404 })
  }

  // Only teacher can answer
  if (question.teacherId !== userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  const updated = await prisma.paidQuestion.update({
    where: { id: params.id },
    data: {
      answer,
      answeredAt: new Date(),
    },
  })

  return NextResponse.json(updated)
}

