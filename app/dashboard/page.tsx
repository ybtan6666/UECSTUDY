"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import Link from "next/link"

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const [coins, setCoins] = useState(0)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      if (status === "loading") {
        return
      }

      if (status === "authenticated" && session) {
        setChecking(false)
        fetchCoins()
      } else if (status === "unauthenticated") {
        // Double-check session
        const { getSession } = await import("next-auth/react")
        const currentSession = await getSession()
        
        if (currentSession) {
          // Session exists but wasn't detected, reload
          window.location.reload()
        } else {
          setChecking(false)
        }
      }
    }

    checkAuth()
  }, [status, session])

  const fetchCoins = async () => {
    try {
      const res = await fetch("/api/profile")
      if (res.ok) {
        const profile = await res.json()
        setCoins(profile.user?.virtualCoins || 0)
      }
    } catch (error) {
      console.error("Error fetching coins:", error)
    }
  }

  // Wait for session check to complete
  if (status === "loading" || checking) {
    return (
      <div className="text-center py-12">
        <div className="text-lg">Loading session...</div>
        <div className="text-sm text-gray-500 mt-2">Please wait...</div>
      </div>
    )
  }

  if (status === "unauthenticated" && !checking) {
    return (
      <div className="max-w-md mx-auto px-4 py-12">
        <div className="uec-card p-8 text-center">
          <h1 className="text-3xl font-bold text-red-600 mb-4">请登入</h1>
          <h2 className="text-2xl font-bold mb-6 text-gray-700">Please Sign In</h2>
          <p className="text-gray-600 mb-6">
            Sign in to access courses, challenges, and Q&A features
          </p>
          <Link
            href="/auth/signin"
            className="inline-block px-8 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold text-lg mb-4"
          >
            登入 Sign In
          </Link>
          <p className="text-sm text-gray-500 mt-4">
            Don't have an account?{" "}
            <Link href="/auth/signup" className="text-blue-600 hover:underline">
              Sign up
            </Link>
          </p>
          <div className="mt-6 p-4 bg-gray-50 rounded text-left">
            <p className="text-sm font-semibold mb-2">Demo Accounts:</p>
            <p className="text-xs text-gray-600">Student: student1@uec.com / student123</p>
            <p className="text-xs text-gray-600">Teacher: teacher1@uec.com / teacher123</p>
          </div>
        </div>
      </div>
    )
  }

  const userRole = (session?.user as any)?.role
  const isStudent = userRole === "STUDENT"

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-red-600 mb-2">
          欢迎回来, {session?.user?.name}!
        </h1>
        <p className="text-xl text-gray-600">
          Welcome back! You have <span className="font-bold text-yellow-600">{coins} 🪙</span> virtual coins
        </p>
      </div>

      {isStudent && (
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          {/* Courses */}
          <Link href="/courses" className="uec-card p-8 text-center transform hover:scale-105 transition-transform">
            <div className="text-6xl mb-4">📚</div>
            <h2 className="text-2xl font-bold mb-2 text-red-600">课程 Courses</h2>
            <p className="text-gray-600 mb-4">
              Browse and purchase courses from teachers
            </p>
            <div className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold">
              View Courses →
            </div>
          </Link>

          {/* Challenges */}
          <Link href="/challenges" className="uec-card p-8 text-center transform hover:scale-105 transition-transform">
            <div className="text-6xl mb-4">🎯</div>
            <h2 className="text-2xl font-bold mb-2 text-yellow-600">挑战 Challenges</h2>
            <p className="text-gray-600 mb-4">
              Test your knowledge and earn virtual coins
            </p>
            <div className="px-6 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 font-semibold">
              View Challenges →
            </div>
          </Link>

          {/* Q&A */}
          <Link href="/qa" className="uec-card p-8 text-center transform hover:scale-105 transition-transform">
            <div className="text-6xl mb-4">💬</div>
            <h2 className="text-2xl font-bold mb-2 text-blue-600">问答 Q&A</h2>
            <p className="text-gray-600 mb-4">
              Ask teachers questions or book consultation time
            </p>
            <div className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold">
              Go to Q&A →
            </div>
          </Link>
        </div>
      )}

      {!isStudent && (
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          <Link href="/courses" className="uec-card p-8 text-center transform hover:scale-105 transition-transform">
            <div className="text-6xl mb-4">📚</div>
            <h2 className="text-2xl font-bold mb-2 text-red-600">我的课程 My Courses</h2>
            <p className="text-gray-600 mb-4">
              Create and manage your courses
            </p>
            <div className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold">
              Manage Courses →
            </div>
          </Link>

          <Link href="/qa" className="uec-card p-8 text-center transform hover:scale-105 transition-transform">
            <div className="text-6xl mb-4">💬</div>
            <h2 className="text-2xl font-bold mb-2 text-blue-600">回答问题 Answer Questions</h2>
            <p className="text-gray-600 mb-4">
              View and answer student questions
            </p>
            <div className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold">
              View Questions →
            </div>
          </Link>

          <Link href="/qa/slots" className="uec-card p-8 text-center transform hover:scale-105 transition-transform">
            <div className="text-6xl mb-4">📅</div>
            <h2 className="text-2xl font-bold mb-2 text-green-600">时间表 Time Slots</h2>
            <p className="text-gray-600 mb-4">
              Manage your available time slots
            </p>
            <div className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold">
              Manage Slots →
            </div>
          </Link>
        </div>
      )}

      <div className="uec-card p-6 mt-8">
        <h2 className="text-2xl font-bold mb-4 text-gray-700">账户信息 Account Info</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <p><strong>Name:</strong> {session?.user?.name}</p>
            <p><strong>Email:</strong> {session?.user?.email}</p>
            <p><strong>Role:</strong> {userRole}</p>
          </div>
          <div className="text-right">
            <Link href="/profile" className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              View Full Profile →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

