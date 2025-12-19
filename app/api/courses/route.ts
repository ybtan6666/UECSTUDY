import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const courses = await prisma.course.findMany({
    include: {
      teacher: {
        select: { name: true },
      },
      _count: {
        select: { purchases: true },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(courses)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)

  if (!session || (session.user as any).role !== "TEACHER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { title, subject, description, price, videoUrl, externalUrl } =
    await req.json()

  const course = await prisma.course.create({
    data: {
      title,
      subject,
      description,
      price,
      videoUrl,
      externalUrl,
      teacherId: (session.user as any).id,
    },
  })

  return NextResponse.json(course)
}

