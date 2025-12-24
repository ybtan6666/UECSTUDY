"use client"

import { useSession } from "next-auth/react"
import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { BackButton } from "@/components/BackButton"

export default function StudentProfilePage() {
  const { data: session, status } = useSession()
  const params = useParams()
  const router = useRouter()
  const [student, setStudent] = useState<any>(null)
  const [bookings, setBookings] = useState<any[]>([])
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
  }, [session, status, router, params.studentId])

  const fetchData = async () => {
    try {
      // Fetch student profile
      const studentRes = await fetch(`/api/users?id=${params.studentId}`)
      if (studentRes.ok) {
        const studentData = await studentRes.json()
        setStudent(studentData)
      }

      // Fetch bookings for current teacher, then filter by student
      if (session?.user.role === "TEACHER") {
        const bookingsRes = await fetch(`/api/bookings`)
        if (bookingsRes.ok) {
          const bookingsData = await bookingsRes.json()
          // Filter bookings for this student and current teacher
          const teacherBookings = bookingsData.filter(
            (b: any) => b.studentId === params.studentId && b.teacherId === session?.user.id
          )
          setBookings(teacherBookings)
        }
      }

      setLoading(false)
    } catch (error) {
      console.error("Error fetching data:", error)
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    const colors: any = {
      PENDING: "bg-yellow-100 text-yellow-800",
      ACCEPTED: "bg-blue-100 text-blue-800",
      COMPLETED: "bg-green-100 text-green-800",
      CANCELLED: "bg-gray-100 text-gray-800",
      EXPIRED: "bg-red-100 text-red-800",
      REFUNDED: "bg-yellow-100 text-yellow-800",
    }
    return colors[status] || "bg-gray-100 text-gray-800"
  }

  if (status === "loading" || loading) {
    return <div className="max-w-4xl mx-auto px-4 py-12">Loading...</div>
  }

  if (!student) {
    return <div className="max-w-4xl mx-auto px-4 py-12">Student not found</div>
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="mb-4">
        <BackButton fallbackPath={`/teachers/${params.id}`} />
      </div>

      <div className="border border-gray-200 rounded-lg p-6 mb-8">
        <div className="flex items-center space-x-4 mb-4">
          <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center text-white text-xl font-semibold">
            {student.avatar || student.name.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{student.name}</h1>
            <div className="text-gray-600">{student.uniqueId}</div>
            <div className="text-sm text-gray-500">{student.email}</div>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Booking History</h2>
        {bookings.length === 0 ? (
          <div className="border border-gray-200 rounded-lg p-6 text-center text-gray-600">
            No bookings with this student yet.
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <Link
                key={booking.id}
                href={`/bookings/${booking.id}`}
                className="block border border-gray-200 rounded-lg p-6 hover:bg-gray-50 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                          booking.status
                        )}`}
                      >
                        {booking.status}
                      </span>
                      <span className="text-sm text-gray-600">
                        MYR {booking.price.toFixed(2)}
                      </span>
                    </div>
                    <div className="text-gray-900 font-medium mb-2">
                      {new Date(booking.timeSlot.startTime).toLocaleString()} -{" "}
                      {new Date(booking.timeSlot.endTime).toLocaleString()}
                    </div>
                    {booking.topic && (
                      <div className="text-sm text-gray-600 mb-1">
                        Topic: {booking.topic}
                      </div>
                    )}
                    {booking.expectations && (
                      <div className="text-sm text-gray-600">
                        Expectation: {booking.expectations}
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

