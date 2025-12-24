"use client"

import { useSession } from "next-auth/react"
import { useState, useEffect } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { BackButton } from "@/components/BackButton"

export default function PaymentProcessPage() {
  const { data: session, status } = useSession()
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [processing, setProcessing] = useState(true)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (status === "loading") return
    if (status === "unauthenticated" || session?.user.role !== "STUDENT") {
      router.push("/auth/signin")
      return
    }

    // Simulate payment processing
    const processPayment = async () => {
      try {
        const method = searchParams.get("method")
        // Simulate payment gateway processing delay
        await new Promise((resolve) => setTimeout(resolve, 2000))

        // Complete payment (simulated - always succeeds for demo)
        const res = await fetch(
          `/api/bookings/${params.id}/payment/process?method=${method}&success=true`,
          {
            method: "POST",
          }
        )

        if (res.ok) {
          const data = await res.json()
          setSuccess(true)
          // Don't auto-redirect, let user see success message and click button
        } else {
          setSuccess(false)
        }
      } catch (error) {
        console.error("Payment processing error:", error)
        setSuccess(false)
      } finally {
        setProcessing(false)
      }
    }

    processPayment()
  }, [session, status, router, params.id, searchParams])

  if (status === "loading" || processing) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="mb-4">
          <BackButton fallbackPath={`/bookings/${params.id}/payment`} />
        </div>
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Processing Payment...
          </h2>
          <p className="text-gray-600">
            Please wait while we process your payment.
          </p>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="mb-4">
          <BackButton fallbackPath={`/bookings/${params.id}`} />
        </div>
        <div className="border-2 border-green-500 rounded-lg p-8 bg-green-50 text-center shadow-lg">
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-500 rounded-full mb-4">
              <svg
                className="w-12 h-12 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          </div>
          <h2 className="text-3xl font-bold text-green-800 mb-3">
            Payment Successful!
          </h2>
          <p className="text-lg text-green-700 mb-2">
            Your payment has been processed successfully.
          </p>
          <p className="text-sm text-gray-600 mb-6">
            Your booking is now confirmed. You will be redirected to your booking details shortly.
          </p>
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => router.push(`/bookings/${params.id}`)}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
            >
              View Booking
            </button>
            <button
              onClick={() => router.push("/bookings")}
              className="px-6 py-3 border border-green-600 text-green-700 rounded-lg hover:bg-green-100 transition-colors font-semibold"
            >
              My Bookings
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="mb-4">
        <BackButton fallbackPath={`/bookings/${params.id}/payment`} />
      </div>
      <div className="border border-red-200 rounded-lg p-8 bg-red-50 text-center">
        <div className="text-6xl mb-4">✗</div>
        <h2 className="text-2xl font-semibold text-red-800 mb-2">
          Payment Failed
        </h2>
        <p className="text-red-700 mb-4">
          There was an error processing your payment.
        </p>
        <button
          onClick={() => router.push(`/bookings/${params.id}/payment`)}
          className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Try Again
        </button>
      </div>
    </div>
  )
}

