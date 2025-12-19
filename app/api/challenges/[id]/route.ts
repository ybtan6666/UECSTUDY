import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const challenge = await prisma.challenge.findUnique({
    where: { id: params.id },
    include: {
      teacher: {
        select: { name: true },
      },
      questions: {
        orderBy: { order: "asc" },
      },
    },
  })

  if (!challenge) {
    return NextResponse.json({ error: "Challenge not found" }, { status: 404 })
  }

  return NextResponse.json(challenge)
}

