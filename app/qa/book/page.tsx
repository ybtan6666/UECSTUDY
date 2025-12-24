"use client"

import { useEffect, useState } from "react"
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
  teacher: { name: string; id: string }
  _count: { bookings: number }
}

export default function BookTimePage() {
  const { data: session } = useSession()
  const [slots, setSlots] = useState<TimeSlot[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSlots()
  }, [])

  const fetchSlots = async () => {
    const res = await fetch("/api/qa/slots?available=true")
    const data = await res.json()
    setSlots(data)
    setLoading(false)
  }

  const handleBook = async (slotId: string) => {
    const topic = prompt("What topic would you like to discuss? (optional)")
    const price = prompt("Enter price (RM):")

    if (!price) return

    const res = await fetch("/api/qa/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        timeSlotId: slotId,
        topic: topic || null,
        price: parseFloat(price),
      }),
    })

    if (res.ok) {
      alert("Booking successful!")
      fetchSlots()
    } else {
      alert("Booking failed")
    }
  }

  if (loading) return <div className="text-center py-12">Loading...</div>

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-4">
        <BackButton fallbackPath="/qa" />
      </div>
      <h1 className="text-3xl font-bold mb-6">Book Teacher Time</h1>
      <div className="bg-green-50 p-4 rounded-lg mb-6">
        <p className="text-sm text-gray-700">
          <strong>Mode B:</strong> Book available time slots with teachers. 
          If multiple students book similar topics, teachers can host group sessions.
        </p>
      </div>

      <div className="space-y-4">
        {slots.map((slot) => {
          const isFull = slot._count.bookings >= slot.maxStudents
          const startTime = new Date(slot.startTime)
          const endTime = new Date(slot.endTime)

          return (
            <div key={slot.id} className="bg-white p-6 rounded-lg shadow">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold mb-2">{slot.teacher.name}</h3>
                  <p className="text-gray-600 mb-1">
                    {format(startTime, "PPP p")} - {format(endTime, "p")}
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
                <button
                  onClick={() => handleBook(slot.id)}
                  disabled={isFull}
                  className={`px-4 py-2 rounded ${
                    isFull
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-green-600 text-white hover:bg-green-700"
                  }`}
                >
                  {isFull ? "Full" : "Book Slot"}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {slots.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No available time slots.
        </div>
      )}
    </div>
  )
}

