"use client"

import { useState, useEffect } from "react"
import { signIn, getSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"

export default function SignInPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Check if user just verified
    if (searchParams.get("verified") === "true") {
      setSuccessMessage("Teacher registration verified successfully! You can now sign in.")
      // Clear the query param
      router.replace("/auth/signin", { scroll: false })
    }
  }, [searchParams, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        console.error("Sign in error:", result.error)
        
        // Check if user exists and password is correct
        try {
          const checkRes = await fetch("/api/check-user", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
          })
          const checkData = await checkRes.json()
          
          if (!checkData.exists) {
            setError(`User not found. Make sure the database is seeded (run: npm run db:seed)`)
          } else if (!checkData.passwordMatch) {
            setError(`Invalid password. Try: student123, teacher123, or admin123`)
          } else {
            setError(`Sign in failed: ${result.error}. Check server console for details.`)
          }
        } catch (checkError) {
          setError(`Sign in failed: ${result.error}. Make sure the database is seeded (run: npm run db:seed)`)
        }
        
        setLoading(false)
      } else if (result?.ok) {
        // Wait for session to be established
        let attempts = 0
        let session = null
        
        while (attempts < 10 && !session) {
          await new Promise(resolve => setTimeout(resolve, 200))
          session = await getSession()
          attempts++
        }
        
        if (session) {
          // Force a hard navigation to ensure session is loaded
          window.location.href = "/dashboard"
        } else {
          // Still redirect - session might load on the next page
          window.location.href = "/dashboard"
        }
      } else {
        setError("Sign in failed. Please try again.")
        setLoading(false)
      }
    } catch (err) {
      setError("An error occurred. Please try again.")
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto mt-12 px-4">
      <div className="uec-card p-8">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold mb-2 text-red-600">登入</h1>
          <h2 className="text-2xl font-bold mb-6 text-gray-900">Sign In</h2>
        </div>
        
        {successMessage && (
          <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900"
            />
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 uec-primary rounded-lg font-semibold text-lg disabled:opacity-50"
          >
            {loading ? "Signing in..." : "登入 Sign In"}
          </button>
        </form>
        <div className="mt-6 space-y-2">
          <p className="text-sm text-center text-gray-600">
            Don't have an account?{" "}
            <Link href="/auth/signup" className="text-blue-600 hover:underline">
              Sign up
            </Link>
          </p>
          <div className="border-t pt-4">
            <p className="text-xs text-center text-gray-500 mb-2">Demo Accounts:</p>
            <div className="text-xs text-gray-600 space-y-1">
              <div>Student: student1@uec.com / student123</div>
              <div>Teacher: teacher1@uec.com / teacher123</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

