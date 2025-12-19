import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  const { searchParams } = new URL(req.url)
  const availableOnly = searchParams.get("available") === "true"

  const where: any = {}
  if (availableOnly) {
    where.endTime = { gte: new Date() }
  }
  if (session && (session.user as any).role === "TEACHER") {
    where.teacherId = (session.user as any).id
  }

  const slots = await prisma.timeSlot.findMany({
    where,
    include: {
      teacher: { select: { name: true, id: true } },
      _count: { select: { bookings: true } },
    },
    orderBy: { startTime: "asc" },
  })

  return NextResponse.json(slots)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)

  if (!session || (session.user as any).role !== "TEACHER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { startTime, endTime, topic, maxStudents, zoomLink } = await req.json()

  const slot = await prisma.timeSlot.create({
    data: {
      teacherId: (session.user as any).id,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      topic: topic || null,
      maxStudents,
      zoomLink: zoomLink || null,
    },
  })

  return NextResponse.json(slot)
}

