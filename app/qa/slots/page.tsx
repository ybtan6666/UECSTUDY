"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { format } from "date-fns"
import { BackButton } from "@/components/BackButton"

interface TimeSlot {
  id: string
  startTime: string
  endTime: string
  topic: string | null
  maxStudents: number
  zoomLink: string | null
  _count: { bookings: number }
}

export default function ManageSlotsPage() {
  const { data: session } = useSession()
  const [slots, setSlots] = useState<TimeSlot[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [startTime, setStartTime] = useState("")
  const [endTime, setEndTime] = useState("")
  const [topic, setTopic] = useState("")
  const [maxStudents, setMaxStudents] = useState("1")
  const [zoomLink, setZoomLink] = useState("")
  const router = useRouter()

  useEffect(() => {
    fetchSlots()
  }, [])

  const fetchSlots = async () => {
    const res = await fetch("/api/qa/slots")
    const data = await res.json()
    setSlots(data)
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const res = await fetch("/api/qa/slots", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
        topic: topic || null,
        maxStudents: parseInt(maxStudents),
        zoomLink: zoomLink || null,
      }),
    })

    if (res.ok) {
      setShowForm(false)
      setStartTime("")
      setEndTime("")
      setTopic("")
      setMaxStudents("1")
      setZoomLink("")
      fetchSlots()
    } else {
      alert("Failed to create slot")
    }
  }

  if ((session?.user as any)?.role !== "TEACHER") {
    return <div className="text-center py-12">Unauthorized</div>
  }

  if (loading) return <div className="text-center py-12">Loading...</div>

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-4">
        <BackButton fallbackPath="/qa" />
      </div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Manage Time Slots</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          {showForm ? "Cancel" : "Create Slot"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow mb-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Time *
            </label>
            <input
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Time *
            </label>
            <input
              type="datetime-local"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Topic (optional)
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Max Students *
            </label>
            <input
              type="number"
              value={maxStudents}
              onChange={(e) => setMaxStudents(e.target.value)}
              required
              min="1"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Zoom Link (optional)
            </label>
            <input
              type="url"
              value={zoomLink}
              onChange={(e) => setZoomLink(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <button
            type="submit"
            className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Create Slot
          </button>
        </form>
      )}

      <div className="space-y-4">
        {slots.map((slot) => {
          const start = new Date(slot.startTime)
          const end = new Date(slot.endTime)

          return (
            <div key={slot.id} className="bg-white p-6 rounded-lg shadow">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-gray-600 mb-1">
                    {format(start, "PPP p")} - {format(end, "p")}
                  </p>
                  {slot.topic && <p className="text-sm text-gray-500">Topic: {slot.topic}</p>}
                  <p className="text-sm text-gray-500">
                    {slot._count.bookings} / {slot.maxStudents} students booked
                  </p>
                  {slot.zoomLink && (
                    <p className="text-sm text-blue-600 mt-2">
                      Zoom: <a href={slot.zoomLink} target="_blank" rel="noopener noreferrer" className="underline">{slot.zoomLink}</a>
                    </p>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {slots.length === 0 && !showForm && (
        <div className="text-center py-12 text-gray-500">
          No time slots created yet.
        </div>
      )}
    </div>
  )
}

