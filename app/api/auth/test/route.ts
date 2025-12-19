import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (session) {
      return NextResponse.json({
        authenticated: true,
        user: session.user,
        role: (session.user as any)?.role,
      })
    } else {
      return NextResponse.json({
        authenticated: false,
        message: "No session found",
      })
    }
  } catch (error: any) {
    return NextResponse.json({
      authenticated: false,
      error: error.message,
    }, { status: 500 })
  }
}

