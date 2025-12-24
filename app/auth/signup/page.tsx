"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"

export default function SignUpPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState<"STUDENT" | "TEACHER">("STUDENT")
  const [error, setError] = useState("")
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Check if searchParams exists before using .get (good safety practice)
    const roleParam = searchParams?.get("role")
    if (roleParam === "teacher") {
      setRole("TEACHER")
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      })

      const data = await res.json()

      if (res.ok) {
        // For teachers: Store signup data and redirect to verification
        // User will be created AFTER verification
        if (role === "TEACHER") {
          // Store all signup data in localStorage for verification step
          const signupData = {
            name,
            email,
            password, // Note: In production, consider encrypting this
            role: "TEACHER"
          }
          localStorage.setItem("teacherSignupData", JSON.stringify(signupData))
          router.push(`/auth/verify-teacher?email=${encodeURIComponent(email)}`)
        } else {
          // For students: User is created immediately, go to complete profile
          if (data.user && data.user.id) {
            router.push(`/auth/complete-profile?userId=${data.user.id}`)
          } else {
            router.push("/auth/signin")
          }
        }
      } else {
        setError(data.error || "Sign up failed")
      }
    } catch (err) {
      setError("Something went wrong. Please try again.")
    }
  }

  return (
    <div className="max-w-md mx-auto mt-12 px-4">
      <div className="uec-card p-8">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold mb-2 text-red-600">注册</h1>
          <h2 className="text-2xl font-bold mb-6 text-gray-900">Sign Up</h2>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as "STUDENT" | "TEACHER")}
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900"
            >
              <option value="STUDENT">Student</option>
              <option value="TEACHER">Teacher</option>
            </select>
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button
            type="submit"
            className="w-full px-4 py-2 uec-primary rounded-lg font-semibold text-lg"
          >
            注册 Sign Up
          </button>
        </form>
        <p className="mt-4 text-sm text-center text-gray-600">
          Already have an account?{" "}
          <Link href="/auth/signin" className="text-blue-600 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}