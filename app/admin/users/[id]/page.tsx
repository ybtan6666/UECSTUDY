"use client"

import { useSession } from "next-auth/react"
import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"

type UserDetails = {
  id: string
  uniqueId: string
  email: string
  name: string
  role: string
  avatar?: string
  banned: boolean
  createdAt: string
  updatedAt: string
  bookingsAsStudent: any[]
  bookingsAsTeacher: any[]
  questionsAsStudent: any[]
  questionsAsTeacher: any[]
  _count: {
    bookingsAsStudent: number
    bookingsAsTeacher: number
    questionsAsStudent: number
    questionsAsTeacher: number
  }
}

export default function UserDetailPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const userId = params.id as string

  const [user, setUser] = useState<UserDetails | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === "loading") return
    if (status === "unauthenticated" || session?.user.role !== "ADMIN") {
      router.push("/auth/signin")
      return
    }
    fetchUser()
  }, [session, status, router, userId])

  const fetchUser = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/users/${userId}`)
      if (res.ok) {
        const data = await res.json()
        setUser(data.user)
      } else {
        alert("Failed to fetch user details")
        router.push("/admin")
      }
    } catch (error) {
      console.error("Error fetching user:", error)
      alert("An error occurred")
    } finally {
      setLoading(false)
    }
  }

  const handleBan = async (banned: boolean) => {
    const action = banned ? "ban" : "unban"
    if (!confirm(`Are you sure you want to ${action} this user?`)) return

    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ banned, reason: "Admin action" }),
      })

      if (res.ok) {
        alert(`User ${banned ? "banned" : "unbanned"} successfully`)
        fetchUser()
      } else {
        const error = await res.json()
        alert(error.error || "Failed to update user")
      }
    } catch (error) {
      alert("An error occurred")
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (status === "loading" || loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center">User not found</div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link
          href="/admin"
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          ← Back to Admin Panel
        </Link>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        {/* User Header */}
        <div className="px-6 py-8 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="h-20 w-20 rounded-full bg-gray-200 flex items-center justify-center">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="h-20 w-20 rounded-full"
                  />
                ) : (
                  <span className="text-gray-600 text-2xl font-medium">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
                <p className="text-gray-600">{user.email}</p>
                <p className="text-sm text-gray-500">ID: {user.uniqueId}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="mb-2">
                <span
                  className={`px-3 py-1 text-sm font-semibold rounded-full ${
                    user.role === "ADMIN"
                      ? "bg-red-100 text-red-800"
                      : user.role === "TEACHER"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-green-100 text-green-800"
                  }`}
                >
                  {user.role}
                </span>
              </div>
              <div className="mb-2">
                {user.banned ? (
                  <span className="px-3 py-1 text-sm font-semibold rounded-full bg-red-100 text-red-800">
                    Banned
                  </span>
                ) : (
                  <span className="px-3 py-1 text-sm font-semibold rounded-full bg-green-100 text-green-800">
                    Active
                  </span>
                )}
              </div>
              <button
                onClick={() => handleBan(!user.banned)}
                className={`px-4 py-2 rounded text-sm font-medium ${
                  user.banned
                    ? "bg-green-600 text-white hover:bg-green-700"
                    : "bg-red-600 text-white hover:bg-red-700"
                }`}
              >
                {user.banned ? "Unban User" : "Ban User"}
              </button>
            </div>
          </div>
        </div>

        {/* User Stats */}
        <div className="px-6 py-6 border-b border-gray-200">
          <div className="grid grid-cols-4 gap-4">
            <div>
              <div className="text-sm text-gray-500">Total Bookings</div>
              <div className="text-2xl font-bold text-gray-900">
                {user._count.bookingsAsStudent + user._count.bookingsAsTeacher}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Total Questions</div>
              <div className="text-2xl font-bold text-gray-900">
                {user._count.questionsAsStudent + user._count.questionsAsTeacher}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Member Since</div>
              <div className="text-lg font-semibold text-gray-900">
                {formatDate(user.createdAt)}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Last Updated</div>
              <div className="text-lg font-semibold text-gray-900">
                {formatDate(user.updatedAt)}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="px-6 py-6">
          <h2 className="text-xl font-semibold mb-4">Recent Bookings as Student</h2>
          {user.bookingsAsStudent.length === 0 ? (
            <p className="text-gray-500">No bookings found</p>
          ) : (
            <div className="space-y-2">
              {user.bookingsAsStudent.map((booking) => (
                <div
                  key={booking.id}
                  className="border border-gray-200 rounded p-3 hover:bg-gray-50"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium">
                        Teacher: {booking.teacher?.name || "N/A"}
                      </div>
                      <div className="text-sm text-gray-500">
                        {booking.timeSlot &&
                          formatDate(booking.timeSlot.startTime)} -{" "}
                        {booking.timeSlot && formatDate(booking.timeSlot.endTime)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">MYR {booking.price.toFixed(2)}</div>
                      <div className="text-sm text-gray-500">{booking.status}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <h2 className="text-xl font-semibold mb-4 mt-8">Recent Bookings as Teacher</h2>
          {user.bookingsAsTeacher.length === 0 ? (
            <p className="text-gray-500">No bookings found</p>
          ) : (
            <div className="space-y-2">
              {user.bookingsAsTeacher.map((booking) => (
                <div
                  key={booking.id}
                  className="border border-gray-200 rounded p-3 hover:bg-gray-50"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium">
                        Student: {booking.student?.name || "N/A"}
                      </div>
                      <div className="text-sm text-gray-500">
                        {booking.timeSlot &&
                          formatDate(booking.timeSlot.startTime)} -{" "}
                        {booking.timeSlot && formatDate(booking.timeSlot.endTime)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">MYR {booking.price.toFixed(2)}</div>
                      <div className="text-sm text-gray-500">{booking.status}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <h2 className="text-xl font-semibold mb-4 mt-8">Recent Questions</h2>
          {user.questionsAsStudent.length === 0 ? (
            <p className="text-gray-500">No questions found</p>
          ) : (
            <div className="space-y-2">
              {user.questionsAsStudent.map((question) => (
                <div
                  key={question.id}
                  className="border border-gray-200 rounded p-3 hover:bg-gray-50"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium">
                        Teacher: {question.teacher?.name || "Unassigned"}
                      </div>
                      <div className="text-sm text-gray-500 truncate max-w-md">
                        {question.questionText || "Image/Media question"}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">MYR {question.price.toFixed(2)}</div>
                      <div className="text-sm text-gray-500">{question.status}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


