"use client"

import Link from "next/link"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function Home() {
  const { data: session } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (session) {
      router.push("/dashboard")
    }
  }, [session, router])

  if (session) {
    return <div className="text-center py-12">Redirecting to dashboard...</div>
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-16">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          UEC Math Q&A
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Paid Mathematics Q&A Marketplace for Malaysian UEC Students
        </p>
        <div className="w-24 h-1 bg-blue-600 mx-auto"></div>
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-16">
        <div className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
          <h2 className="text-2xl font-semibold mb-4 text-blue-600">
            Feature A: Paid Questions
          </h2>
          <p className="text-gray-700 mb-4">
            Submit math questions via text, image, audio, or video. Choose a specific teacher or post to the open marketplace.
          </p>
          <ul className="list-disc list-inside text-sm text-gray-600 space-y-1 mb-4">
            <li>Set your price (minimum MYR 5)</li>
            <li>Choose response time (6h, 24h, or 72h)</li>
            <li>Payment held in escrow until completion</li>
            <li>Auto-refund if not answered</li>
          </ul>
        </div>

        <div className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
          <h2 className="text-2xl font-semibold mb-4 text-green-600">
            Feature B: Book Teacher Time
          </h2>
          <p className="text-gray-700 mb-4">
            Book available time slots with teachers for live consultations. Individual or group sessions available.
          </p>
          <ul className="list-disc list-inside text-sm text-gray-600 space-y-1 mb-4">
            <li>Browse teacher availability</li>
            <li>Select time slot and pay</li>
            <li>Submit topic and expectations</li>
            <li>Full refund if teacher cancels</li>
          </ul>
        </div>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 mb-12">
        <h2 className="text-2xl font-semibold mb-4 text-center text-gray-900">
          How It Works
        </h2>
        <div className="space-y-4 text-gray-700">
          <div className="flex items-start">
            <span className="font-bold text-blue-600 mr-3">1.</span>
            <div>
              <strong>Students:</strong> Post questions or book time slots. Payment is held in escrow.
            </div>
          </div>
          <div className="flex items-start">
            <span className="font-bold text-blue-600 mr-3">2.</span>
            <div>
              <strong>Teachers:</strong> Accept questions or set available time slots. Answer and get paid.
            </div>
          </div>
          <div className="flex items-start">
            <span className="font-bold text-blue-600 mr-3">3.</span>
            <div>
              <strong>Platform:</strong> Handles matching, timing, and payment state. Takes 15% commission on completed orders only.
            </div>
          </div>
        </div>
      </div>

      <div className="text-center space-y-4">
        <div className="space-x-4">
          <Link
            href="/auth/signup?role=student"
            className="inline-block px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Sign Up as Student
          </Link>
          <Link
            href="/auth/signup?role=teacher"
            className="inline-block px-8 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
          >
            Sign Up as Teacher
          </Link>
        </div>
        <div>
          <Link
            href="/auth/signin"
            className="inline-block px-8 py-3 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition-colors"
          >
            Sign In
          </Link>
        </div>
        <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-sm font-semibold text-gray-700 mb-2">Quick Test Accounts:</p>
          <div className="text-xs text-gray-600 space-y-1">
            <div><strong>Student:</strong> student1@uec.com / student123</div>
            <div><strong>Teacher:</strong> teacher1@uec.com / teacher123</div>
            <div><strong>Admin:</strong> admin@uec.com / admin123</div>
          </div>
        </div>
      </div>
    </div>
  )
}
