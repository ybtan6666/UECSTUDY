"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === "loading") return

    if (status === "unauthenticated") {
      router.push("/auth/signin")
      return
    }

    if (session) {
      fetchStats()
    }
  }, [session, status, router])

  const fetchStats = async () => {
    try {
      if (session?.user.role === "STUDENT") {
        const [questionsRes, bookingsRes] = await Promise.all([
          fetch("/api/questions?filter=my-questions"),
          fetch("/api/bookings?filter=my-bookings"),
        ])

        const questions = questionsRes.ok ? await questionsRes.json() : []
        const bookings = bookingsRes.ok ? await bookingsRes.json() : []

        setStats({
          pendingQuestions: questions.filter((q: any) => q.status === "PENDING").length,
          answeredQuestions: questions.filter((q: any) => q.status === "ANSWERED").length,
          completedQuestions: questions.filter((q: any) => q.status === "COMPLETED").length,
          upcomingBookings: bookings.filter((b: any) => b.status === "CONFIRMED").length,
        })
      } else if (session?.user.role === "TEACHER") {
        const [questionsRes, bookingsRes, slotsRes] = await Promise.all([
          fetch("/api/questions?filter=my-accepted"),
          fetch("/api/bookings?filter=my-slots"),
          fetch("/api/slots?filter=my-slots"),
        ])

        const questions = questionsRes.ok ? await questionsRes.json() : []
        const bookings = bookingsRes.ok ? await bookingsRes.json() : []
        const slots = slotsRes.ok ? await slotsRes.json() : []

        setStats({
          pendingAnswers: questions.filter((q: any) => q.status === "ACCEPTED").length,
          openQuestions: questions.filter((q: any) => q.status === "PENDING").length,
          upcomingBookings: bookings.filter((b: any) => b.status === "CONFIRMED").length,
          availableSlots: slots.filter((s: any) => s.status === "AVAILABLE").length,
        })
      }
      setLoading(false)
    } catch (error) {
      console.error("Error fetching stats:", error)
      setLoading(false)
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>

      {session.user.role === "STUDENT" && (
        <div className="space-y-8">
          <div className="grid md:grid-cols-4 gap-6">
            <div className="border border-gray-200 rounded-lg p-6">
              <div className="text-2xl font-bold text-blue-600">
                {stats?.pendingQuestions || 0}
              </div>
              <div className="text-sm text-gray-600 mt-1">Pending Questions</div>
            </div>
            <div className="border border-gray-200 rounded-lg p-6">
              <div className="text-2xl font-bold text-yellow-600">
                {stats?.answeredQuestions || 0}
              </div>
              <div className="text-sm text-gray-600 mt-1">Answered</div>
            </div>
            <div className="border border-gray-200 rounded-lg p-6">
              <div className="text-2xl font-bold text-green-600">
                {stats?.completedQuestions || 0}
              </div>
              <div className="text-sm text-gray-600 mt-1">Completed</div>
            </div>
            <div className="border border-gray-200 rounded-lg p-6">
              <div className="text-2xl font-bold text-purple-600">
                {stats?.upcomingBookings || 0}
              </div>
              <div className="text-sm text-gray-600 mt-1">Upcoming Bookings</div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Link
              href="/questions/ask"
              className="border border-blue-200 rounded-lg p-6 hover:bg-blue-50 transition-colors"
            >
              <h2 className="text-xl font-semibold text-blue-600 mb-2">
                Ask a Question
              </h2>
              <p className="text-gray-600">
                Submit a math question via text, image, audio, or video
              </p>
            </Link>

            <Link
              href="/teachers"
              className="border border-green-200 rounded-lg p-6 hover:bg-green-50 transition-colors"
            >
              <h2 className="text-xl font-semibold text-green-600 mb-2">
                Browse Teachers
              </h2>
              <p className="text-gray-600">
                View all teachers, their profiles, and book time slots
              </p>
            </Link>

            <Link
              href="/questions"
              className="border border-gray-200 rounded-lg p-6 hover:bg-gray-50 transition-colors"
            >
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                My Questions
              </h2>
              <p className="text-gray-600">
                View all your submitted questions and their status
              </p>
            </Link>

            <Link
              href="/bookings"
              className="border border-gray-200 rounded-lg p-6 hover:bg-gray-50 transition-colors"
            >
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                My Bookings
              </h2>
              <p className="text-gray-600">
                View all your bookings and consultations
              </p>
            </Link>
          </div>
        </div>
      )}

      {session.user.role === "TEACHER" && (
        <div className="space-y-8">
          <div className="grid md:grid-cols-4 gap-6">
            <div className="border border-gray-200 rounded-lg p-6">
              <div className="text-2xl font-bold text-blue-600">
                {stats?.pendingAnswers || 0}
              </div>
              <div className="text-sm text-gray-600 mt-1">Pending Answers</div>
            </div>
            <div className="border border-gray-200 rounded-lg p-6">
              <div className="text-2xl font-bold text-yellow-600">
                {stats?.openQuestions || 0}
              </div>
              <div className="text-sm text-gray-600 mt-1">Open Questions</div>
            </div>
            <div className="border border-gray-200 rounded-lg p-6">
              <div className="text-2xl font-bold text-green-600">
                {stats?.upcomingBookings || 0}
              </div>
              <div className="text-sm text-gray-600 mt-1">Upcoming Bookings</div>
            </div>
            <div className="border border-gray-200 rounded-lg p-6">
              <div className="text-2xl font-bold text-purple-600">
                {stats?.availableSlots || 0}
              </div>
              <div className="text-sm text-gray-600 mt-1">Available Slots</div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Link
              href="/questions"
              className="border border-blue-200 rounded-lg p-6 hover:bg-blue-50 transition-colors"
            >
              <h2 className="text-xl font-semibold text-blue-600 mb-2">
                Answer Questions
              </h2>
              <p className="text-gray-600">
                View open questions and accept them to answer
              </p>
            </Link>

            <Link
              href="/slots"
              className="border border-green-200 rounded-lg p-6 hover:bg-green-50 transition-colors"
            >
              <h2 className="text-xl font-semibold text-green-600 mb-2">
                Manage Time Slots
              </h2>
              <p className="text-gray-600">
                Create and manage your available time slots
              </p>
            </Link>

            <Link
              href="/bookings"
              className="border border-gray-200 rounded-lg p-6 hover:bg-gray-50 transition-colors"
            >
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                My Bookings
              </h2>
              <p className="text-gray-600">
                View all bookings for your time slots
              </p>
            </Link>
          </div>
        </div>
      )}

      {session.user.role === "ADMIN" && (
        <div className="space-y-8">
          <div className="border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Admin Panel
            </h2>
            <p className="text-gray-600 mb-4">
              View all transactions, manage refunds, and ban accounts.
            </p>
            <Link
              href="/admin"
              className="inline-block px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
            >
              Go to Admin Panel
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
