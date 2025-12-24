"use client"

import { useSession } from "next-auth/react"
import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import TimeSlotCalendar from "@/components/TimeSlotCalendar"
import { BackButton } from "@/components/BackButton"

export default function TeacherProfilePage() {
  const { data: session, status } = useSession()
  const params = useParams()
  const router = useRouter()
  const [teacher, setTeacher] = useState<any>(null)
  const [slots, setSlots] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === "loading") return
    if (status === "unauthenticated") {
      router.push("/auth/signin")
      return
    }
    if (session) {
      fetchData()
    }
  }, [session, status, router, params.id])

  const fetchData = async () => {
    try {
      const [teachersRes, slotsRes] = await Promise.all([
        fetch("/api/teachers"),
        fetch(`/api/slots?teacherId=${params.id}`),
      ])

      if (teachersRes.ok) {
        const teachers = await teachersRes.json()
        const found = teachers.find((t: any) => t.id === params.id)
        setTeacher(found)
      }

      if (slotsRes.ok) {
        const data = await slotsRes.json()
        setSlots(data)
      }

      setLoading(false)
    } catch (error) {
      console.error("Error fetching data:", error)
      setLoading(false)
    }
  }

  if (status === "loading" || loading) {
    return <div className="max-w-4xl mx-auto px-4 py-12">Loading...</div>
  }

  if (!teacher) {
    return <div className="max-w-4xl mx-auto px-4 py-12">Teacher not found</div>
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="mb-4">
        <BackButton fallbackPath="/teachers" />
      </div>
      <div className="border border-gray-200 rounded-lg p-6 mb-8">
        <div className="flex items-center space-x-4 mb-4">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white text-xl font-semibold">
            {teacher.avatar || teacher.name.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{teacher.name}</h1>
            <div className="text-gray-600">{teacher.uniqueId}</div>
          </div>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <div className="text-2xl font-bold text-blue-600">{teacher.totalEndorsements}</div>
            <div className="text-sm text-gray-600">Endorsements</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">{teacher.recentCompleted}</div>
            <div className="text-sm text-gray-600">Completed (30 days)</div>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Available Time Slots</h2>
        {slots.length === 0 ? (
          <div className="border border-gray-200 rounded-lg p-6 text-center text-gray-600">
            No available time slots.
          </div>
        ) : (
          <TimeSlotCalendar slots={slots} teacherId={params.id as string} />
        )}
      </div>

      {session?.user.role === "STUDENT" && (
        <div className="border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Ask a Question to This Teacher</h2>
          <Link
            href={`/questions/ask?teacherId=${teacher.id}`}
            className="inline-block px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Ask Question
          </Link>
        </div>
      )}
    </div>
  )
}

