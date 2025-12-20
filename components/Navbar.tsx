"use client"

import Link from "next/link"
import { useSession, signOut } from "next-auth/react"
import { useState, useEffect } from "react"
import { getAvatarColor } from "@/lib/utils"

export function Navbar() {
  const { data: session } = useSession()
  const [userData, setUserData] = useState<any>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    if (session) {
      fetchUserData()
    }
  }, [session])

  const fetchUserData = async () => {
    try {
      const res = await fetch("/api/profile")
      if (res.ok) {
        const data = await res.json()
        if (data && data.user) {
          setUserData(data.user)
        }
      }
    } catch (error) {
      console.error("Error fetching user data:", error)
    }
  }

  const getInitials = (name: string) => {
    const names = name.split(" ")
    if (names.length >= 2) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <Link href="/" className="flex items-center">
            <span className="text-xl font-bold text-gray-900">UEC Math Q&A</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {session ? (
              <>
                <Link href="/dashboard" className="text-gray-700 hover:text-gray-900">
                  Dashboard
                </Link>
                {session.user.role === "STUDENT" && (
                  <>
                    <Link href="/questions" className="text-gray-700 hover:text-gray-900">
                      Questions
                    </Link>
                    <Link href="/bookings" className="text-gray-700 hover:text-gray-900">
                      Bookings
                    </Link>
                    <Link href="/teachers" className="text-gray-700 hover:text-gray-900">
                      Teachers
                    </Link>
                  </>
                )}
                {session.user.role === "TEACHER" && (
                  <>
                    <Link href="/questions" className="text-gray-700 hover:text-gray-900">
                      Questions
                    </Link>
                    <Link href="/slots" className="text-gray-700 hover:text-gray-900">
                      Time Slots
                    </Link>
                    <Link href="/bookings" className="text-gray-700 hover:text-gray-900">
                      Bookings
                    </Link>
                  </>
                )}
                {session.user.role === "ADMIN" && (
                  <Link href="/admin" className="text-gray-700 hover:text-gray-900">
                    Admin
                  </Link>
                )}
                <div className="flex items-center space-x-3">
                  {userData && (
                    <div className="flex items-center space-x-2">
                      <div
                        className={`w-8 h-8 rounded-full ${getAvatarColor(
                          userData.uniqueId || ""
                        )} flex items-center justify-center text-white text-xs font-semibold`}
                      >
                        {userData.avatar || getInitials(session.user.name || "")}
                      </div>
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">
                          {userData.uniqueId || session.user.name}
                        </div>
                        <div className="text-xs text-gray-500">{session.user.role}</div>
                      </div>
                    </div>
                  )}
                  <button
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link href="/auth/signin" className="text-gray-700 hover:text-gray-900">
                  Sign In
                </Link>
                <Link
                  href="/auth/signup"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-gray-700 hover:text-gray-900"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {mobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            {session ? (
              <div className="space-y-3">
                <Link
                  href="/dashboard"
                  className="block text-gray-700 hover:text-gray-900"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
                {session.user.role === "STUDENT" && (
                  <>
                    <Link
                      href="/questions"
                      className="block text-gray-700 hover:text-gray-900"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Questions
                    </Link>
                    <Link
                      href="/bookings"
                      className="block text-gray-700 hover:text-gray-900"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Bookings
                    </Link>
                    <Link
                      href="/teachers"
                      className="block text-gray-700 hover:text-gray-900"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Teachers
                    </Link>
                  </>
                )}
                {session.user.role === "TEACHER" && (
                  <>
                    <Link
                      href="/questions"
                      className="block text-gray-700 hover:text-gray-900"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Questions
                    </Link>
                    <Link
                      href="/slots"
                      className="block text-gray-700 hover:text-gray-900"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Time Slots
                    </Link>
                    <Link
                      href="/bookings"
                      className="block text-gray-700 hover:text-gray-900"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Bookings
                    </Link>
                  </>
                )}
                <button
                  onClick={() => {
                    signOut({ callbackUrl: "/" })
                    setMobileMenuOpen(false)
                  }}
                  className="block w-full text-left px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <Link
                  href="/auth/signin"
                  className="block text-gray-700 hover:text-gray-900"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/signup"
                  className="block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-center"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}
