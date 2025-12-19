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
      // Silently fail - user data is optional for navbar
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
    <nav className="bg-gradient-to-r from-red-600 to-red-700 shadow-lg border-b-4 border-yellow-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-xl sm:text-2xl font-bold text-white">
              独中统考
            </span>
            <span className="text-lg sm:text-xl font-bold text-yellow-300 hidden sm:inline">
              UEC
            </span>
          </Link>

          {/* Desktop Navigation */}
          {session && (
            <div className="hidden md:flex items-center space-x-4">
              <Link href="/dashboard" className="text-white hover:text-yellow-300 text-sm font-medium transition-colors">
                Dashboard
              </Link>
              <Link href="/courses" className="text-white hover:text-yellow-300 text-sm font-medium transition-colors">
                Courses
              </Link>
              <Link href="/challenges" className="text-white hover:text-yellow-300 text-sm font-medium transition-colors">
                Challenges
              </Link>
              <Link href="/qa" className="text-white hover:text-yellow-300 text-sm font-medium transition-colors">
                Q&A
              </Link>
            </div>
          )}

          {/* Right Side - User Menu */}
          <div className="flex items-center space-x-2">
            {session ? (
              <>
                {/* Desktop User Profile */}
                <Link href="/profile" className="hidden sm:flex items-center space-x-2 bg-white/10 rounded-lg px-2 py-1.5 hover:bg-white/20 transition-colors">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                      userData?.uniqueId ? getAvatarColor(userData.uniqueId) : "bg-blue-500"
                    }`}
                  >
                    {getInitials(session.user?.name || "U")}
                  </div>
                  <div className="hidden lg:block text-left">
                    <div className="text-white text-xs font-semibold">{session.user?.name}</div>
                    {userData?.uniqueId && (
                      <div className="text-yellow-200 text-xs font-mono">{userData.uniqueId}</div>
                    )}
                  </div>
                </Link>

                {/* Mobile Menu Button */}
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="md:hidden text-white p-2"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {mobileMenuOpen ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    )}
                  </svg>
                </button>

                <button
                  onClick={() => signOut()}
                  className="hidden sm:block px-3 py-1.5 text-xs text-white bg-red-800 rounded hover:bg-red-900 transition-colors"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/auth/signin"
                  className="px-3 py-1.5 text-xs sm:text-sm text-white hover:text-yellow-300 font-medium transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/signup"
                  className="px-3 py-1.5 text-xs sm:text-sm text-white bg-yellow-500 rounded hover:bg-yellow-600 transition-colors font-medium"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && session && (
          <div className="md:hidden py-4 border-t border-red-500">
            <div className="space-y-2">
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-2 text-white hover:bg-white/10 rounded"
              >
                Dashboard
              </Link>
              <Link
                href="/courses"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-2 text-white hover:bg-white/10 rounded"
              >
                Courses
              </Link>
              <Link
                href="/challenges"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-2 text-white hover:bg-white/10 rounded"
              >
                Challenges
              </Link>
              <Link
                href="/qa"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-2 text-white hover:bg-white/10 rounded"
              >
                Q&A
              </Link>
              <Link
                href="/qa/bookings"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-2 text-white hover:bg-white/10 rounded"
              >
                Bookings
              </Link>
              <Link
                href="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-2 text-white hover:bg-white/10 rounded"
              >
                Profile
              </Link>
              <button
                onClick={() => {
                  signOut()
                  setMobileMenuOpen(false)
                }}
                className="block w-full text-left px-4 py-2 text-white hover:bg-white/10 rounded"
              >
                Sign Out
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

