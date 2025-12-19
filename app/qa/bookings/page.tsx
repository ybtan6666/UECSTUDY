"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { format } from "date-fns"
import Link from "next/link"

interface Booking {
  id: string
  status: string
  topic: string | null
  price: number
  timeSlot: {
    id: string
    startTime: string
    endTime: string
    zoomLink: string | null
    teacher: { name: string; uniqueId: string }
    bookings: Array<{ student: { name: string; uniqueId: string } }>
  }
  student: { name: string; uniqueId: string }
}

export default function BookingsPage() {
  const { data: session } = useSession()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "upcoming" | "completed">("all")

  useEffect(() => {
    if (session) {
      fetchBookings()
    }
  }, [session, filter])

  const fetchBookings = async () => {
    try {
      const res = await fetch("/api/qa/bookings")
      const data = await res.json()
      let filtered = data

      if (filter === "upcoming") {
        filtered = data.filter((b: Booking) => {
          const startTime = new Date(b.timeSlot.startTime)
          return startTime > new Date() && b.status === "CONFIRMED"
        })
      } else if (filter === "completed") {
        filtered = data.filter((b: Booking) => b.status === "COMPLETED")
      }

      setBookings(filtered)
    } catch (error) {
      console.error("Error fetching bookings:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (bookingId: string, status: string) => {
    const res = await fetch(`/api/qa/bookings/${bookingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })

    if (res.ok) {
      fetchBookings()
    }
  }

  if (loading) return <div className="text-center py-12">Loading...</div>

  const userRole = (session?.user as any)?.role

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">My Bookings</h1>
        <div className="flex space-x-2">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded ${
              filter === "all" ? "bg-red-600 text-white" : "bg-gray-200"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter("upcoming")}
            className={`px-4 py-2 rounded ${
              filter === "upcoming" ? "bg-red-600 text-white" : "bg-gray-200"
            }`}
          >
            Upcoming
          </button>
          <button
            onClick={() => setFilter("completed")}
            className={`px-4 py-2 rounded ${
              filter === "completed" ? "bg-red-600 text-white" : "bg-gray-200"
            }`}
          >
            Completed
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {bookings.map((booking) => {
          const startTime = new Date(booking.timeSlot.startTime)
          const endTime = new Date(booking.timeSlot.endTime)
          const isUpcoming = startTime > new Date()
          const isTeacher = userRole === "TEACHER"

          return (
            <div key={booking.id} className="uec-card p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-4 mb-2">
                    <h3 className="text-lg font-semibold">
                      {isTeacher ? booking.student.name : booking.timeSlot.teacher.name}
                    </h3>
                    <span className="text-sm text-gray-500">
                      {isTeacher ? booking.student.uniqueId : booking.timeSlot.teacher.uniqueId}
                    </span>
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        booking.status === "CONFIRMED"
                          ? "bg-green-100 text-green-800"
                          : booking.status === "COMPLETED"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {booking.status}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-2">
                    {format(startTime, "PPP p")} - {format(endTime, "p")}
                  </p>
                  {booking.topic && (
                    <p className="text-sm text-gray-500 mb-2">Topic: {booking.topic}</p>
                  )}
                  <p className="text-sm font-semibold text-red-600">RM {booking.price.toFixed(2)}</p>
                  {booking.timeSlot.zoomLink && (
                    <a
                      href={booking.timeSlot.zoomLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-sm mt-2 inline-block"
                    >
                      🔗 Join Zoom Session
                    </a>
                  )}
                  {booking.timeSlot.bookings.length > 1 && (
                    <div className="mt-2">
                      <p className="text-sm text-gray-600">
                        Group session with {booking.timeSlot.bookings.length} students:
                      </p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {booking.timeSlot.bookings.map((b, idx) => (
                          <span key={idx} className="text-xs bg-gray-100 px-2 py-1 rounded">
                            {b.student.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                {isTeacher && isUpcoming && booking.status === "CONFIRMED" && (
                  <div className="flex flex-col space-y-2">
                    <button
                      onClick={() => handleStatusUpdate(booking.id, "COMPLETED")}
                      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      Mark Completed
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(booking.id, "CANCELLED")}
                      className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {bookings.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No bookings found.
        </div>
      )}
    </div>
  )
}

