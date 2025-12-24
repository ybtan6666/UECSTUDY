"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { BackButton } from "@/components/BackButton"

interface ProfileData {
  user: {
    name: string
    email: string
    role: string
    uniqueId: string
    avatar: string | null
  }
  courses: any[]
  questions: any[]
  challenges: any[]
  bookings: any[]
  timeSlots: any[]
}

export default function ProfilePage() {
  const { data: session } = useSession()
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (session) {
      fetchProfile()
    }
  }, [session])

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/profile")
      if (res.ok) {
        const data = await res.json()
        setProfile(data)
      } else {
        console.error("Failed to fetch profile")
      }
    } catch (error) {
      console.error("Error fetching profile:", error)
    } finally {
      setLoading(false)
    }
  }

  if (!session) {
    return <div className="text-center py-12">Please sign in</div>
  }

  if (loading) return <div className="text-center py-12">Loading...</div>
  if (!profile) return <div className="text-center py-12">Error loading profile</div>

  const isStudent = profile.user.role === "STUDENT"
  const isTeacher = profile.user.role === "TEACHER"

  const getInitials = (name: string) => {
    const names = name.split(" ")
    if (names.length >= 2) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }

  const getAvatarColor = (uniqueId: string) => {
    const colors = [
      "bg-red-500",
      "bg-blue-500",
      "bg-yellow-500",
      "bg-green-500",
      "bg-purple-500",
      "bg-pink-500",
      "bg-indigo-500",
      "bg-orange-500",
    ]
    const hash = uniqueId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
    return colors[hash % colors.length]
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-4">
        <BackButton fallbackPath="/dashboard" />
      </div>
      <div className="uec-card p-8 mb-8">
        <div className="flex items-center space-x-6 mb-6">
          {profile.user.avatar ? (
            <img
              src={profile.user.avatar}
              alt={profile.user.name}
              className="w-24 h-24 rounded-full border-4 border-red-300"
            />
          ) : (
            <div
              className={`w-24 h-24 rounded-full flex items-center justify-center text-white text-3xl font-bold ${
                profile.user.uniqueId ? getAvatarColor(profile.user.uniqueId) : "bg-blue-500"
              }`}
            >
              {getInitials(profile.user.name)}
            </div>
          )}
          <div>
            <h1 className="text-4xl font-bold mb-2 text-red-600">{profile.user.name}</h1>
            <p className="text-xl font-semibold text-yellow-600 mb-2">{profile.user.uniqueId}</p>
            <p className="text-gray-600 mb-1">{profile.user.email}</p>
            <p className="text-gray-600">Role: {profile.user.role}</p>
          </div>
        </div>
      </div>

      {isStudent && (
        <>
          <div className="uec-card p-6 mb-6">
            <h2 className="text-2xl font-semibold mb-4 text-red-600">📚 Purchased Courses</h2>
            {profile.courses.length > 0 ? (
              <div className="space-y-2">
                {profile.courses.map((c) => (
                  <Link
                    key={c.id}
                    href={`/courses/${c.course.id}`}
                    className="block p-3 border rounded hover:bg-gray-50"
                  >
                    <p className="font-semibold">{c.course.title}</p>
                    <p className="text-sm text-gray-500">
                      Purchased: {new Date(c.createdAt).toLocaleDateString()}
                    </p>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No purchased courses</p>
            )}
          </div>

          <div className="uec-card p-6 mb-6">
            <h2 className="text-2xl font-semibold mb-4 text-blue-600">💬 Asked Questions</h2>
            {profile.questions.length > 0 ? (
              <div className="space-y-2">
                {profile.questions.map((q) => (
                  <Link
                    key={q.id}
                    href={`/qa/questions/${q.id}`}
                    className="block p-3 border rounded hover:bg-gray-50"
                  >
                    <p className="font-semibold">{q.question.substring(0, 100)}...</p>
                    <p className="text-sm text-gray-500">
                      {q.answeredAt ? "Answered" : "Pending"} • RM {q.price.toFixed(2)}
                    </p>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No questions asked</p>
            )}
          </div>

          <div className="uec-card p-6 mb-6">
            <h2 className="text-2xl font-semibold mb-4 text-yellow-600">🎯 Completed Challenges</h2>
            {profile.challenges.length > 0 ? (
              <div className="space-y-2">
                {profile.challenges.map((c) => (
                  <div key={c.id} className="p-3 border rounded">
                    <p className="font-semibold">{c.challenge.title}</p>
                    <p className="text-sm text-gray-500">
                      Score: {c.score}/{c.totalQuestions} • Earned {c.coinsEarned} coins
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No challenges completed</p>
            )}
          </div>

          <div className="uec-card p-6">
            <h2 className="text-2xl font-semibold mb-4 text-green-600">📅 Booked Sessions</h2>
            {profile.bookings.length > 0 ? (
              <div className="space-y-2">
                {profile.bookings.map((b) => (
                  <div key={b.id} className="p-3 border rounded">
                    <p className="font-semibold">
                      {new Date(b.timeSlot.startTime).toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-500">
                      {b.topic && `Topic: ${b.topic} • `}RM {b.price.toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No booked sessions</p>
            )}
          </div>
        </>
      )}

      {isTeacher && (
        <>
          <div className="uec-card p-6 mb-6">
            <h2 className="text-2xl font-semibold mb-4 text-red-600">📚 My Courses</h2>
            {profile.courses.length > 0 ? (
              <div className="space-y-2">
                {profile.courses.map((c) => (
                  <Link
                    key={c.id}
                    href={`/courses/${c.id}`}
                    className="block p-3 border rounded hover:bg-gray-50"
                  >
                    <p className="font-semibold">{c.title}</p>
                    <p className="text-sm text-gray-500">RM {c.price.toFixed(2)}</p>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No courses created</p>
            )}
          </div>

          <div className="uec-card p-6 mb-6">
            <h2 className="text-2xl font-semibold mb-4 text-blue-600">💬 Questions to Answer</h2>
            {profile.questions.length > 0 ? (
              <div className="space-y-2">
                {profile.questions.map((q) => (
                  <Link
                    key={q.id}
                    href={`/qa/questions/${q.id}`}
                    className="block p-3 border rounded hover:bg-gray-50"
                  >
                    <p className="font-semibold">{q.question.substring(0, 100)}...</p>
                    <p className="text-sm text-gray-500">
                      {q.answeredAt ? "Answered" : "Pending"} • RM {q.price.toFixed(2)}
                    </p>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No questions to answer</p>
            )}
          </div>

          <div className="uec-card p-6">
            <h2 className="text-2xl font-semibold mb-4 text-green-600">📅 Time Slots</h2>
            {profile.timeSlots.length > 0 ? (
              <div className="space-y-2">
                {profile.timeSlots.map((s) => (
                  <div key={s.id} className="p-3 border rounded">
                    <p className="font-semibold">
                      {new Date(s.startTime).toLocaleString()} - {new Date(s.endTime).toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-500">
                      {s._count.bookings} / {s.maxStudents} students booked
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No time slots created</p>
            )}
          </div>
        </>
      )}
    </div>
  )
}

