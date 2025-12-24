"use client"

import { useSession } from "next-auth/react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { BackButton } from "@/components/BackButton"

export default function SlotsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [slots, setSlots] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    startTime: "",
    endTime: "",
    minPrice: 0,
    maxStudents: 1,
    minStudents: 1,
    isGroupSession: false,
  })

  useEffect(() => {
    if (status === "loading") return
    if (status === "unauthenticated" || session?.user.role !== "TEACHER") {
      router.push("/auth/signin")
      return
    }
    if (session) {
      fetchSlots()
    }
  }, [session, status, router])

  const fetchSlots = async () => {
    try {
      const res = await fetch("/api/slots?filter=my-slots")
      if (res.ok) {
        const data = await res.json()
        setSlots(data)
      }
      setLoading(false)
    } catch (error) {
      console.error("Error fetching slots:", error)
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch("/api/slots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        setShowForm(false)
        setFormData({
          startTime: "",
          endTime: "",
          minPrice: 0,
          maxStudents: 1,
          minStudents: 1,
          isGroupSession: false,
        })
        fetchSlots()
      } else {
        const error = await res.json()
        alert(error.error || "Failed to create time slot")
      }
    } catch (error) {
      alert("An error occurred")
    }
  }

  const getStatusColor = (status: string) => {
    const colors: any = {
      AVAILABLE: "bg-green-100 text-green-800",
      BOOKED: "bg-blue-100 text-blue-800",
      CANCELLED: "bg-gray-100 text-gray-800",
      COMPLETED: "bg-purple-100 text-purple-800",
    }
    return colors[status] || "bg-gray-100 text-gray-800"
  }

  if (status === "loading" || loading) {
    return <div className="max-w-7xl mx-auto px-4 py-12">Loading...</div>
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="mb-4">
        <BackButton fallbackPath="/dashboard" />
      </div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Time Slots</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          {showForm ? "Cancel" : "Create Time Slot"}
        </button>
      </div>

      {showForm && (
        <div className="border border-gray-200 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Create New Time Slot</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Time
                </label>
                <input
                  type="datetime-local"
                  value={formData.startTime}
                  onChange={(e) =>
                    setFormData({ ...formData, startTime: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Time
                </label>
                <input
                  type="datetime-local"
                  value={formData.endTime}
                  onChange={(e) =>
                    setFormData({ ...formData, endTime: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  required
                />
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Price (MYR)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.minPrice}
                  onChange={(e) =>
                    setFormData({ ...formData, minPrice: parseFloat(e.target.value) })
                  }
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <input
                    type="checkbox"
                    checked={formData.isGroupSession}
                    onChange={(e) =>
                      setFormData({ ...formData, isGroupSession: e.target.checked })
                    }
                    className="mr-2"
                  />
                  Group Session
                </label>
              </div>
            </div>
            {formData.isGroupSession && (
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Minimum Students
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.minStudents}
                    onChange={(e) =>
                      setFormData({ ...formData, minStudents: parseInt(e.target.value) })
                    }
                    className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Maximum Students
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.maxStudents}
                    onChange={(e) =>
                      setFormData({ ...formData, maxStudents: parseInt(e.target.value) })
                    }
                    className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  />
                </div>
              </div>
            )}
            <button
              type="submit"
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Create Slot
            </button>
          </form>
        </div>
      )}

      {slots.length === 0 ? (
        <div className="text-center py-12 border border-gray-200 rounded-lg">
          <p className="text-gray-600">No time slots created yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {slots.map((slot) => (
            <div
              key={slot.id}
              className="border border-gray-200 rounded-lg p-6"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center space-x-3 mb-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                        slot.status
                      )}`}
                    >
                      {slot.status}
                    </span>
                    {slot.isGroupSession && (
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">
                        Group
                      </span>
                    )}
                  </div>
                  <div className="font-semibold text-gray-900">
                    {new Date(slot.startTime).toLocaleString()} -{" "}
                    {new Date(slot.endTime).toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    Min Price: MYR {slot.minPrice.toFixed(2)}
                  </div>
                  {slot.isGroupSession && (
                    <div className="text-sm text-gray-600">
                      Students: {slot.bookings.length}/{slot.maxStudents} (min: {slot.minStudents})
                    </div>
                  )}
                </div>
              </div>
              {slot.bookings.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h4 className="font-semibold mb-2">Bookings:</h4>
                  <div className="space-y-2">
                    {slot.bookings.map((booking: any) => (
                      <Link
                        key={booking.id}
                        href={`/bookings/${booking.id}`}
                        className="block text-sm text-blue-600 hover:underline"
                      >
                        {booking.student.name} ({booking.student.uniqueId}) - {booking.status}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

