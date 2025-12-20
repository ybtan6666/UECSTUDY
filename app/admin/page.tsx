"use client"

import { useSession } from "next-auth/react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

export default function AdminPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [questions, setQuestions] = useState<any[]>([])
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === "loading") return
    if (status === "unauthenticated" || session?.user.role !== "ADMIN") {
      router.push("/auth/signin")
      return
    }
    fetchData()
  }, [session, status, router])

  const fetchData = async () => {
    // In a real app, you'd have admin-specific endpoints
    // For now, we'll just show a placeholder
    setLoading(false)
  }

  const handleRefund = async (type: string, id: string, reason: string) => {
    if (!confirm(`Refund this ${type}?`)) return

    try {
      const endpoint = type === "question" ? `/api/questions/${id}` : `/api/bookings/${id}`
      const res = await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "REFUND", reason }),
      })

      if (res.ok) {
        fetchData()
        alert("Refund processed")
      } else {
        const error = await res.json()
        alert(error.error || "Failed to process refund")
      }
    } catch (error) {
      alert("An error occurred")
    }
  }

  if (status === "loading" || loading) {
    return <div className="max-w-7xl mx-auto px-4 py-12">Loading...</div>
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Panel</h1>

      <div className="space-y-8">
        <div className="border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Transactions</h2>
          <p className="text-gray-600">
            View all transactions, manage refunds, and ban accounts.
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Admin functionality will be expanded in future updates.
          </p>
        </div>

        <div className="border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Refunds</h2>
          <p className="text-gray-600">
            Process manual refunds for questions and bookings.
          </p>
        </div>

        <div className="border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">User Management</h2>
          <p className="text-gray-600">
            Ban abusive accounts and manage user access.
          </p>
        </div>
      </div>
    </div>
  )
}

