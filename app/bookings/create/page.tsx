"use client"

import { useSession } from "next-auth/react"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { BackButton } from "@/components/BackButton"

export default function CreateBookingPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [slot, setSlot] = useState<any>(null)
  const [formData, setFormData] = useState({
    topic: "",
    expectations: "",
    preferredFormat: "text",
    price: 0,
  })

  useEffect(() => {
    if (status === "loading") return
    if (status === "unauthenticated" || session?.user.role !== "STUDENT") {
      router.push("/auth/signin")
      return
    }
    const slotId = searchParams.get("slotId")
    if (slotId) {
      fetchSlot(slotId)
    } else {
      router.push("/teachers")
    }
  }, [session, status, router, searchParams])

  const fetchSlot = async (slotId: string) => {
    try {
      const res = await fetch(`/api/slots?teacherId=${slotId}`)
      if (res.ok) {
        const slots = await res.json()
        const found = slots.find((s: any) => s.id === slotId)
        if (found) {
          setSlot(found)
          setFormData({ ...formData, price: found.minPrice })
        }
      }
    } catch (error) {
      console.error("Error fetching slot:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          timeSlotId: slot.id,
          ...formData,
        }),
      })

      if (res.ok) {
        const booking = await res.json()
        // Redirect to payment page after booking creation
        router.push(`/bookings/${booking.id}/payment`)
      } else {
        const error = await res.json()
        alert(error.error || "Failed to create booking")
      }
    } catch (error) {
      alert("An error occurred")
    } finally {
      setLoading(false)
    }
  }

  if (status === "loading" || !slot) {
    return <div className="max-w-4xl mx-auto px-4 py-12">Loading...</div>
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="mb-4">
        <BackButton fallbackPath="/teachers" />
      </div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Book Time Slot</h1>

      <div className="border border-gray-200 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Time Slot Details</h2>
        <div className="space-y-2">
          <div>
            <span className="font-medium">Time:</span>{" "}
            {new Date(slot.startTime).toLocaleString()} -{" "}
            {new Date(slot.endTime).toLocaleString()}
          </div>
          <div>
            <span className="font-medium">Teacher:</span> {slot.teacher.name} (
            {slot.teacher.uniqueId})
          </div>
          <div>
            <span className="font-medium">Minimum Price:</span> MYR{" "}
            {slot.minPrice.toFixed(2)}
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Topic / Questions
          </label>
          <textarea
            value={formData.topic}
            onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
            rows={4}
            className="w-full border border-gray-300 rounded-lg px-4 py-2"
            placeholder="What would you like to discuss?"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Expectations
          </label>
          <select
            value={formData.expectations}
            onChange={(e) =>
              setFormData({ ...formData, expectations: e.target.value })
            }
            className="w-full border border-gray-300 rounded-lg px-4 py-2"
          >
            <option value="">Select expectation</option>
            <option value="revision">Revision</option>
            <option value="explanation">Explanation</option>
            <option value="exam prep">Exam Preparation</option>
            <option value="homework help">Homework Help</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Preferred Format
          </label>
          <select
            value={formData.preferredFormat}
            onChange={(e) =>
              setFormData({ ...formData, preferredFormat: e.target.value })
            }
            className="w-full border border-gray-300 rounded-lg px-4 py-2"
          >
            <option value="text">Text</option>
            <option value="voice">Voice</option>
            <option value="video">Video</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Price (MYR) - Minimum: {slot.minPrice.toFixed(2)}
          </label>
          <input
            type="number"
            min={slot.minPrice}
            step="0.01"
            value={formData.price}
            onChange={(e) =>
              setFormData({ ...formData, price: parseFloat(e.target.value) })
            }
            className="w-full border border-gray-300 rounded-lg px-4 py-2"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Creating Booking..." : "Book Time Slot"}
        </button>
      </form>
    </div>
  )
}

