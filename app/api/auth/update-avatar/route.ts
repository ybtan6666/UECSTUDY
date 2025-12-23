import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function PATCH(req: Request) {
  try {
    const { userId, avatarUrl } = await req.json()

    if (!userId || !avatarUrl) {
      return NextResponse.json({ error: "Missing data" }, { status: 400 })
    }

    // Update the user's avatar
    await prisma.user.update({
      where: { id: userId },
      data: { avatar: avatarUrl },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 })
  }
}