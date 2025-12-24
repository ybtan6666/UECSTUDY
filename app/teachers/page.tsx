"use client"

import { useSession } from "next-auth/react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { BackButton } from "@/components/BackButton"

export default function TeachersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [teachers, setTeachers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === "loading") return
    if (status === "unauthenticated") {
      router.push("/auth/signin")
      return
    }
    if (session) {
      fetchTeachers()
    }
  }, [session, status, router])

  const fetchTeachers = async () => {
    try {
      const res = await fetch("/api/teachers")
      if (res.ok) {
        const data = await res.json()
        setTeachers(Array.isArray(data) ? data : [])
      } else {
        console.error("Failed to fetch teachers:", res.status)
        const error = await res.json().catch(() => ({}))
        console.error("Error details:", error)
        if (res.status === 401) {
          // Try to fetch without auth
          const testRes = await fetch("/api/test-db")
          const testData = await testRes.json()
          if (testData.userCount === 0) {
            setTeachers([])
          }
        }
      }
      setLoading(false)
    } catch (error) {
      console.error("Error fetching teachers:", error)
      setLoading(false)
    }
  }

  if (status === "loading" || loading) {
    return <div className="max-w-7xl mx-auto px-4 py-12">Loading...</div>
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="mb-4">
        <BackButton fallbackPath="/dashboard" />
      </div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Teachers</h1>

      {teachers.length === 0 ? (
        <div className="text-center py-12 border border-gray-200 rounded-lg">
          <p className="text-gray-600 mb-4">No teachers available.</p>
          <p className="text-sm text-gray-500 mb-2">
            Please run the database seed script to create teachers:
          </p>
          <code className="bg-gray-100 px-3 py-2 rounded block max-w-md mx-auto">npm run db:seed</code>
          <p className="text-xs text-gray-400 mt-4">
            Or check database status at: <a href="/api/test-db" target="_blank" className="text-blue-600 underline">/api/test-db</a>
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teachers.map((teacher) => (
            <div
              key={teacher.id}
              className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                  {teacher.avatar || teacher.name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="font-semibold text-gray-900">{teacher.name}</div>
                  <div className="text-sm text-gray-600">{teacher.uniqueId}</div>
                </div>
              </div>
              <div className="space-y-2 mb-4">
                <div className="text-sm">
                  <span className="font-medium">Endorsements:</span> {teacher.totalEndorsements}
                </div>
                <div className="text-sm">
                  <span className="font-medium">Recent Completed:</span> {teacher.recentCompleted}
                </div>
              </div>
              <Link
                href={`/teachers/${teacher.id}`}
                className="block w-full text-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                View Profile
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

