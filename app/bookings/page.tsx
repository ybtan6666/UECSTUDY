"use client"

import { useSession } from "next-auth/react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, useParams } from "next/navigation"
import { BackButton } from "@/components/BackButton"

export default function BookingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

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

  // Calculate remaining hours until booking start time
  const getRemainingHours = (startTime: string) => {
    const now = new Date()
    const start = new Date(startTime)
    const diffMs = start.getTime() - now.getTime()
    const diffHours = diffMs / (1000 * 60 * 60)
    return diffHours
  }

  // Check if cancellation is allowed (must be at least 24 hours before)
  const canCancel = (startTime: string) => {
    const remainingHours = getRemainingHours(startTime)
    return remainingHours >= 24
  }

  // Format remaining time display
  const formatRemainingTime = (startTime: string) => {
    const remainingHours = getRemainingHours(startTime)
    if (remainingHours < 0) {
      return "Past"
    } else if (remainingHours < 1) {
      const minutes = Math.floor(remainingHours * 60)
      return `${minutes} minutes`
    } else if (remainingHours < 24) {
      return `${Math.floor(remainingHours)} hours`
    } else {
      const days = Math.floor(remainingHours / 24)
      const hours = Math.floor(remainingHours % 24)
      if (days > 0) {
        return `${days} day${days > 1 ? "s" : ""} ${hours > 0 ? `${hours} hour${hours > 1 ? "s" : ""}` : ""}`
      }
      return `${hours} hours`
    }
  }

  const handleCancel = async (bookingId: string, isStudent: boolean) => {
    const booking = bookings.find((b) => b.id === bookingId)
    if (!booking) return

    const startTime = booking.timeSlot.startTime
    if (!canCancel(startTime)) {
      alert("Cancellation is only allowed at least 24 hours before the booking time.")
      return
    }

    if (!confirm(`Are you sure you want to cancel this booking?${isStudent ? " (No refund)" : " (Full refund to student)"}`)) {
      return
    }

    setCancellingId(bookingId)
    try {
      const action = isStudent ? "CANCEL_BY_STUDENT" : "CANCEL_BY_TEACHER"
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          reason: isStudent ? "Student cancellation" : "Teacher cancellation",
        }),
      })

      if (res.ok) {
        setSuccessMessage("Booking cancelled successfully!")
        setTimeout(() => {
          setSuccessMessage(null)
        }, 5000)
        fetchBookings()
      } else {
        const error = await res.json()
        alert(error.error || "Failed to cancel booking")
      }
    } catch (error) {
      alert("An error occurred while cancelling the booking")
    } finally {
      setCancellingId(null)
    }
  }

  const getStatusColor = (status: string) => {
    const colors: any = {
      PENDING: "bg-yellow-100 text-yellow-800",
      ACCEPTED: "bg-blue-100 text-blue-800",
      COMPLETED: "bg-green-100 text-green-800",
      CANCELLED: "bg-gray-100 text-gray-800",
      EXPIRED: "bg-red-100 text-red-800",
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
      <div className="mb-4">
        <BackButton fallbackPath="/dashboard" />
      </div>
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

      {successMessage && (
        <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
          {successMessage}
        </div>
      )}

      {bookings.length === 0 ? (
        <div className="text-center py-12 border border-gray-200 rounded-lg">
          <p className="text-gray-600">No bookings found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => {
            const isStudent = session?.user.role === "STUDENT"
            const isTeacher = session?.user.role === "TEACHER"
            const startTime = booking.timeSlot.startTime
            const remainingHours = getRemainingHours(startTime)
            const canCancelBooking = canCancel(startTime) && booking.status === "ACCEPTED" || booking.status === "PENDING"
            const isUpcoming = remainingHours > 0

            return (
              <div
                key={booking.id}
                className="block border border-gray-200 rounded-lg p-6 hover:bg-gray-50 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    {booking.orderNumber && (
                      <span className="text-xs font-mono font-semibold text-blue-600">
                        {booking.orderNumber}
                      </span>
                    )}
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
                    {isUpcoming && (
                      <span className="text-sm font-medium text-blue-600">
                        {formatRemainingTime(startTime)} remaining
                      </span>
                    )}
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
                    {isStudent && booking.teacher && (
                      <div className="text-sm text-gray-600">
                        Teacher: {booking.teacher.name} ({booking.teacher.uniqueId})
                      </div>
                    )}
                    {isTeacher && booking.student && (
                      <div className="text-sm text-gray-600">
                        Student:{" "}
                        <Link
                          href={`/teachers/${session.user.id}/students/${booking.student.id}`}
                          className="text-blue-600 hover:underline"
                        >
                          {booking.student.name} ({booking.student.uniqueId})
                        </Link>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end space-y-2">
                    <Link
                      href={`/bookings/${booking.id}`}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      View Details
                    </Link>
                    {canCancelBooking && (
                      <button
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          handleCancel(booking.id, isStudent)
                        }}
                        disabled={cancellingId === booking.id}
                        className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {cancellingId === booking.id ? "Cancelling..." : "Cancel"}
                      </button>
                    )}
                    {!canCancelBooking && isUpcoming && booking.status !== "CANCELLED" && booking.status !== "COMPLETED" && (
                      <span className="text-xs text-gray-500 text-right max-w-[150px]">
                        Can only cancel before 24 hours
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

