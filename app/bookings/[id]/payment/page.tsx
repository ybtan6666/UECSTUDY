"use client"

import { useSession } from "next-auth/react"
import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { BackButton } from "@/components/BackButton"

export default function PaymentPage() {
  const { data: session, status } = useSession()
  const params = useParams()
  const router = useRouter()
  const [booking, setBooking] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [selectedMethod, setSelectedMethod] = useState<string>("")

  useEffect(() => {
    if (status === "loading") return
    if (status === "unauthenticated" || session?.user.role !== "STUDENT") {
      router.push("/auth/signin")
      return
    }
    if (session) {
      fetchBooking()
    }
  }, [session, status, router, params.id])

  const fetchBooking = async () => {
    try {
      const res = await fetch(`/api/bookings/${params.id}`)
      if (res.ok) {
        const data = await res.json()
        setBooking(data)
        if (data.paymentStatus === "COMPLETED") {
          router.push(`/bookings/${params.id}`)
        }
      }
      setLoading(false)
    } catch (error) {
      console.error("Error fetching booking:", error)
      setLoading(false)
    }
  }

  const handlePayment = async () => {
    if (!selectedMethod) {
      alert("Please select a payment method")
      return
    }

    setProcessing(true)
    try {
      // Initiate payment
      const res = await fetch(`/api/bookings/${params.id}/payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentMethod: selectedMethod }),
      })

      if (res.ok) {
        const data = await res.json()
        // Redirect to payment gateway (simulated)
        // In production, this would redirect to actual payment gateway
        window.location.href = data.paymentGatewayUrl
      } else {
        const error = await res.json()
        alert(error.error || "Failed to initiate payment")
        setProcessing(false)
      }
    } catch (error) {
      alert("An error occurred")
      setProcessing(false)
    }
  }

  const getPaymentMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      BANK_TRANSFER: "Bank Transfer",
      E_WALLET: "E-Wallet",
      CREDIT_CARD: "Credit Card",
    }
    return labels[method] || method
  }

  if (status === "loading" || loading) {
    return <div className="max-w-4xl mx-auto px-4 py-12">Loading...</div>
  }

  if (!booking) {
    return <div className="max-w-4xl mx-auto px-4 py-12">Booking not found</div>
  }

  if (booking.paymentStatus === "COMPLETED") {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="border border-green-200 rounded-lg p-6 bg-green-50">
          <h2 className="text-xl font-semibold text-green-800 mb-2">
            Payment Completed
          </h2>
          <p className="text-green-700 mb-4">
            Your payment has been successfully processed.
          </p>
          <button
            onClick={() => router.push(`/bookings/${params.id}`)}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            View Booking
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="mb-4">
        <BackButton fallbackPath={`/bookings/${params.id}`} />
      </div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Payment</h1>

      {/* Booking Summary */}
      <div className="border border-gray-200 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Booking Summary</h2>
        <div className="space-y-2">
          <div>
            <span className="font-medium">Time:</span>{" "}
            {new Date(booking.timeSlot.startTime).toLocaleString()} -{" "}
            {new Date(booking.timeSlot.endTime).toLocaleString()}
          </div>
          <div>
            <span className="font-medium">Teacher:</span> {booking.teacher.name} (
            {booking.teacher.uniqueId})
          </div>
          {booking.topic && (
            <div>
              <span className="font-medium">Topic:</span> {booking.topic}
            </div>
          )}
          <div className="pt-4 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold">Total Amount:</span>
              <span className="text-2xl font-bold text-blue-600">
                MYR {booking.price.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Method Selection */}
      <div className="border border-gray-200 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Select Payment Method</h2>
        <div className="space-y-3">
          {["BANK_TRANSFER", "E_WALLET", "CREDIT_CARD"].map((method) => (
            <label
              key={method}
              className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                selectedMethod === method
                  ? "border-blue-600 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <input
                type="radio"
                name="paymentMethod"
                value={method}
                checked={selectedMethod === method}
                onChange={(e) => setSelectedMethod(e.target.value)}
                className="mr-3"
              />
              <div className="flex-1">
                <div className="font-semibold text-gray-900">
                  {getPaymentMethodLabel(method)}
                </div>
                {method === "BANK_TRANSFER" && (
                  <div className="text-sm text-gray-600">
                    Transfer to our bank account
                  </div>
                )}
                {method === "E_WALLET" && (
                  <div className="text-sm text-gray-600">
                    Pay via e-wallet (GrabPay, Touch 'n Go, etc.)
                  </div>
                )}
                {method === "CREDIT_CARD" && (
                  <div className="text-sm text-gray-600">
                    Pay with credit or debit card
                  </div>
                )}
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Payment Button */}
      <div className="flex justify-between items-center">
        <button
          onClick={() => router.back()}
          className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          onClick={handlePayment}
          disabled={!selectedMethod || processing}
          className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {processing ? "Processing..." : `Pay MYR ${booking.price.toFixed(2)}`}
        </button>
      </div>
    </div>
  )
}

