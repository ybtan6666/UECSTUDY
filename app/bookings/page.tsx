"use client"

import { useSession } from "next-auth/react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function BookingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === "loading") return
    if (status === "unauthenticated") {
      router.push("/auth/signin")
      return
    }
    if (session) {
      fetchBookings()
    }
  }, [session, status, router])

  const fetchBookings = async () => {
    try {
      const res = await fetch("/api/bookings")
      if (res.ok) {
        const data = await res.json()
        setBookings(data)
      }
      setLoading(false)
    } catch (error) {
      console.error("Error fetching bookings:", error)
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    const colors: any = {
      CONFIRMED: "bg-blue-100 text-blue-800",
      COMPLETED: "bg-green-100 text-green-800",
      CANCELLED_BY_STUDENT: "bg-gray-100 text-gray-800",
      CANCELLED_BY_TEACHER: "bg-orange-100 text-orange-800",
      NO_SHOW: "bg-red-100 text-red-800",
      REFUNDED: "bg-yellow-100 text-yellow-800",
    }
    return colors[status] || "bg-gray-100 text-gray-800"
  }

  if (status === "loading" || loading) {
    return <div className="max-w-7xl mx-auto px-4 py-12">Loading...</div>
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Bookings</h1>
        {session?.user.role === "STUDENT" && (
          <Link
            href="/teachers"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Browse Teachers
          </Link>
        )}
      </div>

      {bookings.length === 0 ? (
        <div className="text-center py-12 border border-gray-200 rounded-lg">
          <p className="text-gray-600">No bookings found.</p>
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
                  {session?.user.role === "STUDENT" && booking.teacher && (
                    <div className="text-sm text-gray-600">
                      Teacher: {booking.teacher.name} ({booking.teacher.uniqueId})
                    </div>
                  )}
                  {session?.user.role === "TEACHER" && booking.student && (
                    <div className="text-sm text-gray-600">
                      Student: {booking.student.name} ({booking.student.uniqueId})
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

