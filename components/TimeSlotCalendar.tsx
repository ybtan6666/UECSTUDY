"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface TimeSlot {
  id: string
  startTime: string
  endTime: string
  minPrice: number
  isGroupSession: boolean
  maxStudents: number
  availableSpots?: number
  status: string
  teacher?: {
    id: string
    name: string
    uniqueId: string
  }
}

interface TimeSlotCalendarProps {
  slots: TimeSlot[]
  teacherId?: string
  onSlotClick?: (slot: TimeSlot) => void
}

export default function TimeSlotCalendar({ slots, teacherId, onSlotClick }: TimeSlotCalendarProps) {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const router = useRouter()

  // Get Monday of the current week
  const getWeekStart = (date: Date): Date => {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Adjust when day is Sunday
    return new Date(d.setDate(diff))
  }

  // Get Sunday of the current week
  const getWeekEnd = (date: Date): Date => {
    const weekStart = getWeekStart(date)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 6)
    weekEnd.setHours(23, 59, 59, 999)
    return weekEnd
  }

  const weekStart = useMemo(() => getWeekStart(selectedDate), [selectedDate])
  const weekEnd = useMemo(() => getWeekEnd(selectedDate), [selectedDate])

  // Generate days of the week (Monday to Sunday)
  const weekDays = useMemo(() => {
    const days = []
    const start = new Date(weekStart)
    for (let i = 0; i < 7; i++) {
      const day = new Date(start)
      day.setDate(start.getDate() + i)
      days.push(day)
    }
    return days
  }, [weekStart])

  // Filter slots for the current week
  const weekSlots = useMemo(() => {
    return slots.filter((slot) => {
      const slotDate = new Date(slot.startTime)
      return slotDate >= weekStart && slotDate <= weekEnd
    })
  }, [slots, weekStart, weekEnd])

  // Group slots by day and time
  const slotsByDayAndTime = useMemo(() => {
    const grouped: Record<string, Record<string, TimeSlot[]>> = {}
    
    weekDays.forEach((day) => {
      const dayKey = day.toDateString()
      grouped[dayKey] = {}
    })

    weekSlots.forEach((slot) => {
      const slotDate = new Date(slot.startTime)
      const dayKey = slotDate.toDateString()
      const slotHour = slotDate.getHours()
      const slotMinute = slotDate.getMinutes()
      
      // Round to nearest 30-minute interval for display
      const roundedMinute = slotMinute < 30 ? 0 : 30
      const timeKey = `${slotHour}:${String(roundedMinute).padStart(2, '0')}`
      
      if (!grouped[dayKey]) {
        grouped[dayKey] = {}
      }
      if (!grouped[dayKey][timeKey]) {
        grouped[dayKey][timeKey] = []
      }
      grouped[dayKey][timeKey].push(slot)
    })

    return grouped
  }, [weekSlots, weekDays])

  // Generate time slots (24 hours in 30-minute intervals)
  const timeSlots = useMemo(() => {
    const times = []
    for (let hour = 0; hour < 24; hour++) {
      times.push(`${hour}:00`)
      times.push(`${hour}:30`)
    }
    return times
  }, [])

  const navigateWeek = (direction: "prev" | "next") => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() + (direction === "next" ? 7 : -7))
    setSelectedDate(newDate)
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })
  }

  const formatTime = (timeString: string) => {
    const [hour, minute] = timeString.split(":")
    const hourNum = parseInt(hour)
    const period = hourNum >= 12 ? "PM" : "AM"
    const displayHour = hourNum > 12 ? hourNum - 12 : hourNum === 0 ? 12 : hourNum
    return `${displayHour}:${minute} ${period}`
  }

  // Format a Date object to time string (HH:MM format)
  const formatDateToTime = (date: Date) => {
    const hour = date.getHours()
    const minute = date.getMinutes()
    return `${hour}:${String(minute).padStart(2, '0')}`
  }

  const getSlotsForTime = (day: Date, timeString: string): TimeSlot[] => {
    const dayKey = day.toDateString()
    return slotsByDayAndTime[dayKey]?.[timeString] || []
  }

  // Check if a slot starts at a specific time
  const doesSlotStartAtTime = (slot: TimeSlot, day: Date, timeString: string): boolean => {
    const [hour, minute] = timeString.split(":")
    const slotStart = new Date(slot.startTime)
    const slotDay = new Date(slotStart)
    slotDay.setHours(0, 0, 0, 0)
    const checkDay = new Date(day)
    checkDay.setHours(0, 0, 0, 0)

    if (slotDay.getTime() !== checkDay.getTime()) {
      return false
    }

    const slotHour = slotStart.getHours()
    const slotMinute = slotStart.getMinutes()
    const roundedMinute = slotMinute < 30 ? 0 : 30

    return slotHour === parseInt(hour) && roundedMinute === parseInt(minute)
  }

  // Check if a slot is active (spans) at a specific time
  const isSlotActiveAtTime = (slot: TimeSlot, day: Date, timeString: string): boolean => {
    const [hour, minute] = timeString.split(":")
    const timeSlotStart = new Date(day)
    timeSlotStart.setHours(parseInt(hour), parseInt(minute), 0, 0)
    const timeSlotEnd = new Date(timeSlotStart)
    timeSlotEnd.setMinutes(timeSlotEnd.getMinutes() + 30)

    const slotStart = new Date(slot.startTime)
    const slotEnd = new Date(slot.endTime)
    const slotDay = new Date(slotStart)
    slotDay.setHours(0, 0, 0, 0)
    const checkDay = new Date(day)
    checkDay.setHours(0, 0, 0, 0)

    if (slotDay.getTime() !== checkDay.getTime()) {
      return false
    }

    return slotStart < timeSlotEnd && slotEnd > timeSlotStart
  }

  // Calculate how many rows a slot spans
  const getSlotRowSpan = (slot: TimeSlot): number => {
    const slotStart = new Date(slot.startTime)
    const slotEnd = new Date(slot.endTime)
    const durationMs = slotEnd.getTime() - slotStart.getTime()
    const durationMinutes = durationMs / (1000 * 60)
    return Math.ceil(durationMinutes / 30)
  }

  const isTimeInPast = (day: Date, timeString: string): boolean => {
    const [hour, minute] = timeString.split(":")
    const slotDateTime = new Date(day)
    slotDateTime.setHours(parseInt(hour), parseInt(minute), 0, 0)
    return slotDateTime < new Date()
  }

  const handleSlotClick = (slot: TimeSlot) => {
    if (onSlotClick) {
      onSlotClick(slot)
    } else {
      // Show confirmation modal
      setSelectedSlot(slot)
      setShowConfirmModal(true)
    }
  }

  const handleConfirm = async () => {
    if (!selectedSlot || isCreating) return

    console.log("=== BOOKING CREATION START ===")
    console.log("Slot ID:", selectedSlot.id)
    console.log("Price:", selectedSlot.minPrice)
    
    setIsCreating(true)
    
    try {
      // Create booking immediately with default values
      console.log("Sending POST request to /api/bookings...")
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          timeSlotId: selectedSlot.id,
          topic: "",
          expectations: "",
          preferredFormat: "text",
          price: selectedSlot.minPrice,
        }),
      })

      console.log("Response status:", response.status)
      console.log("Response ok:", response.ok)

      let data
      try {
        data = await response.json()
        console.log("Response data:", JSON.stringify(data, null, 2))
      } catch (e) {
        console.error("Failed to parse JSON:", e)
        const text = await response.text()
        console.error("Raw response text:", text)
        alert("Server returned invalid response. Check console for details.")
        setIsCreating(false)
        return
      }

      if (response.ok && data && data.id) {
        console.log("✅ Booking created! ID:", data.id)
        console.log("Redirecting to:", `/bookings/${data.id}/payment`)
        
        // Close modal
        setShowConfirmModal(false)
        setSelectedSlot(null)
        
        // Force redirect - try multiple methods
        try {
          window.location.href = `/bookings/${data.id}/payment`
        } catch (e) {
          console.error("window.location.href failed:", e)
          window.location.replace(`/bookings/${data.id}/payment`)
        }
      } else {
        // Show error message
        const errorMsg = data?.error || `Failed to create booking (Status: ${response.status})`
        console.error("❌ Booking creation failed:", errorMsg)
        console.error("Full response:", data)
        alert(`Error: ${errorMsg}\n\nCheck browser console for details.`)
        setIsCreating(false)
      }
    } catch (error: any) {
      console.error("❌ Exception during booking creation:", error)
      console.error("Error stack:", error.stack)
      alert(`Network error: ${error.message}\n\nCheck browser console for details.`)
      setIsCreating(false)
    }
  }

  const handleClose = () => {
    setShowConfirmModal(false)
    setSelectedSlot(null)
  }

  return (
    <div className="border border-gray-200 rounded-lg p-6 bg-white">
      {/* Header with navigation */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigateWeek("prev")}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
            aria-label="Previous week"
          >
            ← Previous
          </button>
          <h3 className="text-lg font-semibold text-gray-900 min-w-[200px] text-center">
            {formatDate(weekStart)} - {formatDate(weekEnd)}
          </h3>
          <button
            onClick={() => navigateWeek("next")}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
            aria-label="Next week"
          >
            Next →
          </button>
        </div>
        <button
          onClick={() => setSelectedDate(new Date())}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
        >
          Today
        </button>
      </div>

      {/* Timetable */}
      <div className="overflow-x-auto overflow-y-visible">
        <div className="min-w-full">
          {/* Days header */}
          <div className="grid grid-cols-8 gap-1 mb-2">
            <div className="p-2 text-sm font-semibold text-gray-700"></div>
            {weekDays.map((day, index) => {
              const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
              const isToday = day.toDateString() === new Date().toDateString()
              return (
                <div
                  key={index}
                  className={`p-2 text-center border-b-2 ${
                    isToday ? "border-blue-600" : "border-gray-200"
                  }`}
                >
                  <div className="text-xs font-semibold text-gray-600 uppercase">
                    {dayNames[index]}
                  </div>
                  <div
                    className={`text-sm font-medium ${
                      isToday ? "text-blue-600" : "text-gray-900"
                    }`}
                  >
                    {day.getDate()}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Time slots */}
          <div className="space-y-1 relative" style={{ overflow: 'visible' }} id="time-slots-container">
            {/* Render spanning slot boxes first, positioned absolutely relative to container */}
            {weekDays.map((day, dayIndex) => {
              // Get slots that start on this day OR continue from previous day
              const daySlots = weekSlots.filter(slot => {
                const slotStart = new Date(slot.startTime)
                const slotEnd = new Date(slot.endTime)
                const slotStartDay = new Date(slotStart)
                slotStartDay.setHours(0, 0, 0, 0)
                const slotEndDay = new Date(slotEnd)
                slotEndDay.setHours(0, 0, 0, 0)
                const checkDay = new Date(day)
                checkDay.setHours(0, 0, 0, 0)
                
                // Include if slot starts on this day OR ends on this day (spans from previous day)
                return slotStartDay.getTime() === checkDay.getTime() || 
                       (slotEndDay.getTime() === checkDay.getTime() && slotStartDay.getTime() < checkDay.getTime())
              })
              
              return daySlots.map(slot => {
                const slotStart = new Date(slot.startTime)
                const slotEnd = new Date(slot.endTime)
                const slotStartDay = new Date(slotStart)
                slotStartDay.setHours(0, 0, 0, 0)
                const slotEndDay = new Date(slotEnd)
                slotEndDay.setHours(0, 0, 0, 0)
                const checkDay = new Date(day)
                checkDay.setHours(0, 0, 0, 0)
                
                // Check if slot spans across midnight
                const spansMidnight = slotEndDay.getTime() > slotStartDay.getTime()
                
                let displayStart: Date
                let displayEnd: Date
                let isContinuation = false
                
                if (spansMidnight && slotEndDay.getTime() === checkDay.getTime()) {
                  // This is the continuation part (next day portion)
                  displayStart = new Date(checkDay)
                  displayStart.setHours(0, 0, 0, 0)
                  displayEnd = slotEnd
                  isContinuation = true
                } else {
                  // Normal slot or first part of midnight-spanning slot
                  displayStart = slotStart
                  if (spansMidnight) {
                    // First part ends at end of day
                    displayEnd = new Date(checkDay)
                    displayEnd.setHours(23, 59, 59, 999)
                  } else {
                    displayEnd = slotEnd
                  }
                }
                
                const displayStartHour = displayStart.getHours()
                const displayStartMinute = displayStart.getMinutes()
                const roundedMinute = displayStartMinute < 30 ? 0 : 30
                const timeKey = `${displayStartHour}:${String(roundedMinute).padStart(2, '0')}`
                const timeIndex = timeSlots.indexOf(timeKey)
                if (timeIndex === -1) return null
                
                // Calculate row span for the display portion
                const durationMs = displayEnd.getTime() - displayStart.getTime()
                const durationMinutes = durationMs / (1000 * 60)
                const rowSpan = Math.ceil(durationMinutes / 30)
                const boxHeight = rowSpan * 60 + (rowSpan - 1) * 4
                const topPosition = timeIndex * (60 + 4)
                // Calculate left position: time label (1/8) + dayIndex columns (each 1/8) + padding
                const leftPercent = (1 + dayIndex) * (100 / 8)
                const rightPercent = 100 - leftPercent - (100 / 8)
                
                return (
                  <div
                    key={`span-${slot.id}-${dayIndex}`}
                    className={`absolute text-xs p-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors cursor-pointer z-30 shadow-md ${isContinuation ? 'opacity-90' : ''}`}
                    style={{
                      top: `${topPosition}px`,
                      left: `calc(${leftPercent}% + 4px)`,
                      right: `calc(${rightPercent}% + 4px)`,
                      height: `${boxHeight}px`,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between'
                    }}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleSlotClick(slot)
                    }}
                    title={`${formatTime(formatDateToTime(slotStart))} - ${formatTime(formatDateToTime(slotEnd))} | MYR ${slot.minPrice.toFixed(2)}`}
                  >
                    <div>
                      {!isContinuation && (
                        <>
                          <div className="font-semibold">
                            {formatTime(formatDateToTime(slotStart))}
                          </div>
                          <div className="text-[10px] opacity-90">
                            MYR {slot.minPrice.toFixed(0)}
                          </div>
                          {slot.isGroupSession && (
                            <div className="text-[10px] opacity-75">
                              {slot.availableSpots !== undefined && slot.availableSpots > 0
                                ? `${slot.availableSpots} left`
                                : "Group"}
                            </div>
                          )}
                        </>
                      )}
                      {isContinuation && (
                        <div className="text-[10px] opacity-75 italic">
                          Continues from previous day
                        </div>
                      )}
                    </div>
                    {(rowSpan > 1 || isContinuation) && (
                      <div className="text-[10px] opacity-75">
                        {isContinuation 
                          ? `Until ${formatTime(formatDateToTime(slotEnd))}`
                          : `Until ${formatTime(formatDateToTime(displayEnd))}`
                        }
                      </div>
                    )}
                  </div>
                )
              })
            }).flat().filter(Boolean)}
            
            {timeSlots.map((timeString, timeIndex) => (
              <div key={timeString} className="grid grid-cols-8 gap-1 relative" style={{ overflow: 'visible' }}>
                {/* Time label */}
                <div className="p-2 text-xs text-gray-600 text-right border-r border-gray-200">
                  {formatTime(timeString)}
                </div>

                {/* Day cells */}
                {weekDays.map((day, dayIndex) => {
                  const isPast = isTimeInPast(day, timeString)
                  const slots = getSlotsForTime(day, timeString)
                  const hasSlots = slots.length > 0
                  
                  // Get all slots that are active at this time (including those that span)
                  const allSlots = weekSlots.filter(slot => {
                    const slotDate = new Date(slot.startTime)
                    const slotDay = new Date(slotDate)
                    slotDay.setHours(0, 0, 0, 0)
                    const checkDay = new Date(day)
                    checkDay.setHours(0, 0, 0, 0)
                    return slotDay.getTime() === checkDay.getTime() && isSlotActiveAtTime(slot, day, timeString)
                  })
                  
                  // Get slots that start at this time
                  const startingSlots = allSlots.filter(slot => doesSlotStartAtTime(slot, day, timeString))
                  const hasActiveSlots = allSlots.length > 0

                  return (
                    <div
                      key={dayIndex}
                      className={`p-1 min-h-[60px] border border-gray-200 rounded relative ${
                        isPast
                          ? "bg-gray-100"
                          : hasActiveSlots
                          ? "bg-blue-50 hover:bg-blue-100"
                          : "bg-white hover:bg-gray-50"
                      } transition-colors`}
                      style={{ overflow: 'visible' }}
                    >
                      {/* Slot boxes are now rendered above, positioned absolutely */}
                      {hasActiveSlots && !isPast ? (
                        <div className="h-full"></div>
                      ) : isPast ? (
                        <div className="text-xs text-gray-400 text-center pt-2">Past</div>
                      ) : (
                        <div className="text-xs text-gray-400 text-center pt-2">—</div>
                      )}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-6 flex items-center justify-center space-x-6 text-sm">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-blue-600 rounded"></div>
          <span className="text-gray-700">Available</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-gray-300 rounded"></div>
          <span className="text-gray-700">Not Available</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-gray-100 rounded"></div>
          <span className="text-gray-700">Past</span>
        </div>
      </div>

      {/* Click to book message */}
      {!onSlotClick && (
        <div className="mt-4 text-center text-sm text-gray-600">
          Click on an available time slot to book
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && selectedSlot && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl relative">
            {isCreating && (
              <div className="absolute inset-0 bg-white bg-opacity-90 rounded-lg flex items-center justify-center z-10">
                <div className="text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
                  <p className="text-sm text-gray-600">Creating booking...</p>
                </div>
              </div>
            )}
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Confirm Booking</h3>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Close"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div className="border-b border-gray-200 pb-3">
                <div className="text-sm text-gray-600 mb-1">Time Slot</div>
                <div className="font-semibold text-gray-900">
                  {new Date(selectedSlot.startTime).toLocaleString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}{" "}
                  -{" "}
                  {new Date(selectedSlot.endTime).toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </div>
              </div>

              {selectedSlot.teacher && (
                <div className="border-b border-gray-200 pb-3">
                  <div className="text-sm text-gray-600 mb-1">Teacher</div>
                  <div className="font-semibold text-gray-900">
                    {selectedSlot.teacher.name} ({selectedSlot.teacher.uniqueId})
                  </div>
                </div>
              )}

              <div className="border-b border-gray-200 pb-3">
                <div className="text-sm text-gray-600 mb-1">Price</div>
                <div className="font-semibold text-blue-600 text-lg">
                  MYR {selectedSlot.minPrice.toFixed(2)}
                </div>
              </div>

              {selectedSlot.isGroupSession && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                  <div className="text-sm font-semibold text-purple-800 mb-1">
                    Group Session
                  </div>
                  <div className="text-xs text-purple-700">
                    {selectedSlot.availableSpots !== undefined && selectedSlot.availableSpots > 0
                      ? `${selectedSlot.availableSpots} spots available`
                      : "Group session"}
                  </div>
                </div>
              )}
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handleClose}
                disabled={isCreating}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Close
              </button>
              <button
                onClick={handleConfirm}
                disabled={isCreating}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isCreating ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Creating...
                  </>
                ) : (
                  "Confirm"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

