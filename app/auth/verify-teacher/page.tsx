"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { BackButton } from "@/components/BackButton"

export default function VerifyTeacherPage() {
  const [verificationCode, setVerificationCode] = useState("")
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Get email from query params or localStorage
    const emailParam = searchParams.get("email")
    const storedSignupData = localStorage.getItem("teacherSignupData")
    
    if (emailParam) {
      setEmail(emailParam)
    } else if (storedSignupData) {
      try {
        const signupData = JSON.parse(storedSignupData)
        setEmail(signupData.email)
      } catch (e) {
        // Invalid data, redirect to signup
        router.push("/auth/signup?role=teacher")
      }
    } else {
      // No signup data found, redirect to signup
      router.push("/auth/signup?role=teacher")
    }
  }, [searchParams, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    if (verificationCode.length !== 6) {
      setError("Verification code must be 6 digits")
      setLoading(false)
      return
    }

    try {
      // Get stored signup data
      const storedSignupData = localStorage.getItem("teacherSignupData")
      if (!storedSignupData) {
        setError("Signup data not found. Please complete signup first.")
        setLoading(false)
        router.push("/auth/signup?role=teacher")
        return
      }

      const signupData = JSON.parse(storedSignupData)

      // Verify that email matches
      if (signupData.email !== email) {
        setError("Email mismatch. Please complete signup again.")
        setLoading(false)
        localStorage.removeItem("teacherSignupData")
        router.push("/auth/signup?role=teacher")
        return
      }

      const res = await fetch("/api/auth/verify-teacher", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          verificationCode,
          name: signupData.name,
          password: signupData.password,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        // Clear stored signup data
        localStorage.removeItem("teacherSignupData")
        // Redirect to complete profile page to upload picture
        if (data.userId) {
          router.push(`/auth/complete-profile?userId=${data.userId}`)
        } else {
          // Fallback: if userId not returned, go to sign in
          router.push("/auth/signin?verified=true")
        }
      } else {
        setError(data.error || "Verification failed")
      }
    } catch (error) {
      setError("An error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numbers and limit to 6 digits
    const value = e.target.value.replace(/\D/g, "").slice(0, 6)
    setVerificationCode(value)
  }

  return (
    <div className="max-w-md mx-auto mt-12 px-4">
      <div className="mb-4">
        <BackButton fallbackPath="/auth/signup?role=teacher" />
      </div>
      <div className="uec-card p-8">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold mb-2 text-red-600">验证码</h1>
          <h2 className="text-2xl font-bold mb-2 text-gray-900">Verification Code</h2>
          <p className="text-sm text-gray-600">
            Please enter the 6-digit verification code to complete your teacher registration
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Verification Code (6 digits)
            </label>
            <input
              type="text"
              value={verificationCode}
              onChange={handleCodeChange}
              placeholder="000000"
              required
              maxLength={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 text-center text-2xl font-mono tracking-widest"
              style={{ letterSpacing: "0.5em" }}
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter the 6-digit code provided to you
            </p>
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading || verificationCode.length !== 6}
            className="w-full px-4 py-2 uec-primary rounded-lg font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Verifying..." : "Verify & Complete Registration"}
          </button>
        </form>

        <p className="mt-4 text-sm text-center text-gray-600">
          Don't have a verification code?{" "}
          <Link href="/auth/signin" className="text-blue-600 hover:underline">
            Contact admin
          </Link>
        </p>
      </div>
    </div>
  )
}

