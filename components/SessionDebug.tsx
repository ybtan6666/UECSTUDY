"use client"

import { useSession } from "next-auth/react"
import { useEffect } from "react"

export function SessionDebug() {
  const { data: session, status } = useSession()

  useEffect(() => {
    console.log("Session Status:", status)
    console.log("Session Data:", session)
  }, [status, session])

  // Only show in development
  if (process.env.NODE_ENV !== "development") {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white p-2 text-xs rounded z-50">
      <div>Status: {status}</div>
      <div>User: {session?.user?.name || "None"}</div>
      <div>Role: {(session?.user as any)?.role || "None"}</div>
    </div>
  )
}

