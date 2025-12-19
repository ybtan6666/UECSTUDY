import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const questions = await prisma.paidQuestion.findMany({
    include: {
      student: { select: { name: true } },
      teacher: { select: { name: true } },
      course: { select: { title: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(questions)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)

  if (!session || (session.user as any).role !== "STUDENT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { question, teacherId, courseId, price } = await req.json()

  const deadline = new Date()
  deadline.setDate(deadline.getDate() + 7)

  // Mock payment - just create question
  const paidQuestion = await prisma.paidQuestion.create({
    data: {
      question,
      studentId: (session.user as any).id,
      teacherId,
      courseId: courseId || null,
      price,
      deadline,
    },
  })

  return NextResponse.json(paidQuestion)
}

