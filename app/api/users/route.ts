import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const role = searchParams.get("role")

  const where: any = {}
  if (role) where.role = role

  const users = await prisma.user.findMany({
    where,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      uniqueId: true,
      avatar: true,
    },
  })

  return NextResponse.json(users)
}

