"use client"

import { useSession } from "next-auth/react"
import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"

export default function BookingDetailPage() {
  const { data: session, status } = useSession()
  const params = useParams()
  const router = useRouter()
  const [booking, setBooking] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    if (status === "loading") return
    if (status === "unauthenticated") {
      router.push("/auth/signin")
      return
    }
    if (session) {
      fetchBooking()
    }
  }, [session, status, router, params.id])

  const fetchBooking = async () => {
    try {
      const res = await fetch(`/api/bookings/${params.id}`)
      if (res.ok) {
        const data = await res.json()
        setBooking(data)
      }
      setLoading(false)
    } catch (error) {
      console.error("Error fetching booking:", error)
      setLoading(false)
    }
  }

  const handleAction = async (action: string, data?: any) => {
    setActionLoading(true)
    try {
      const res = await fetch(`/api/bookings/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...data }),
      })

      if (res.ok) {
        fetchBooking()
      } else {
        const error = await res.json()
        alert(error.error || "Action failed")
      }
    } catch (error) {
      alert("An error occurred")
    } finally {
      setActionLoading(false)
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
    return <div className="max-w-4xl mx-auto px-4 py-12">Loading...</div>
  }

  if (!booking) {
    return <div className="max-w-4xl mx-auto px-4 py-12">Booking not found</div>
  }

  const isStudent = session?.user.role === "STUDENT" && booking.studentId === session.user.id
  const isTeacher = session?.user.role === "TEACHER" && booking.teacherId === session.user.id

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="mb-6">
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
            booking.status
          )}`}
        >
          {booking.status}
        </span>
        <span className="ml-4 text-gray-600">MYR {booking.price.toFixed(2)}</span>
      </div>

      <div className="border border-gray-200 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Booking Details</h2>
        <div className="space-y-2">
          <div>
            <span className="font-medium">Time:</span>{" "}
            {new Date(booking.timeSlot.startTime).toLocaleString()} -{" "}
            {new Date(booking.timeSlot.endTime).toLocaleString()}
          </div>
          {booking.topic && (
            <div>
              <span className="font-medium">Topic:</span> {booking.topic}
            </div>
          )}
          {booking.expectations && (
            <div>
              <span className="font-medium">Expectations:</span> {booking.expectations}
            </div>
          )}
          {booking.preferredFormat && (
            <div>
              <span className="font-medium">Preferred Format:</span> {booking.preferredFormat}
            </div>
          )}
          {isStudent && (
            <div>
              <span className="font-medium">Teacher:</span> {booking.teacher.name} (
              {booking.teacher.uniqueId})
            </div>
          )}
          {isTeacher && (
            <div>
              <span className="font-medium">Student:</span> {booking.student.name} (
              {booking.student.uniqueId})
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      {(isStudent || isTeacher) && booking.status === "CONFIRMED" && (
        <div className="border border-gray-200 rounded-lg p-6 mb-6">
          <button
            onClick={() => {
              if (confirm("Mark this booking as completed?")) {
                handleAction("COMPLETE")
              }
            }}
            disabled={actionLoading}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            Mark as Completed
          </button>
        </div>
      )}

      {isStudent && booking.status === "CONFIRMED" && (
        <div className="border border-gray-200 rounded-lg p-6 mb-6">
          <button
            onClick={() => {
              if (confirm("Cancel this booking? (No refund)")) {
                handleAction("CANCEL_BY_STUDENT", { reason: "Student cancellation" })
              }
            }}
            disabled={actionLoading}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            Cancel Booking
          </button>
        </div>
      )}

      {isTeacher && booking.status === "CONFIRMED" && (
        <div className="border border-gray-200 rounded-lg p-6 mb-6">
          <div className="space-y-3">
            <button
              onClick={() => {
                if (confirm("Cancel this booking? (Full refund to student)")) {
                  handleAction("CANCEL_BY_TEACHER", { reason: "Teacher cancellation" })
                }
              }}
              disabled={actionLoading}
              className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
            >
              Cancel Booking (Refund)
            </button>
            <button
              onClick={() => {
                if (confirm("Mark student as no-show? (No refund)")) {
                  handleAction("NO_SHOW")
                }
              }}
              disabled={actionLoading}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              Mark as No-Show
            </button>
          </div>
        </div>
      )}

      {/* Order Logs */}
      {booking.orderLogs && booking.orderLogs.length > 0 && (
        <div className="border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Order History</h3>
          <div className="space-y-2">
            {booking.orderLogs.map((log: any) => (
              <div key={log.id} className="text-sm text-gray-600">
                <span className="font-medium">{log.action}</span> -{" "}
                {log.fromStatus && `${log.fromStatus} → `}
                {log.toStatus} - {new Date(log.createdAt).toLocaleString()}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

