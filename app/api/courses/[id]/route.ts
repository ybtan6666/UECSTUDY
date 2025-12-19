import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  const userId = session ? (session.user as any).id : null

  const course = await prisma.course.findUnique({
    where: { id: params.id },
    include: {
      teacher: {
        select: { name: true, id: true },
      },
    },
  })

  if (!course) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 })
  }

  let purchased = false
  if (userId) {
    const purchase = await prisma.coursePurchase.findUnique({
      where: {
        courseId_studentId: {
          courseId: params.id,
          studentId: userId,
        },
      },
    })
    purchased = !!purchase
  }

  return NextResponse.json({ ...course, purchased })
}

