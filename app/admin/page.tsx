"use client"

import { useSession } from "next-auth/react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { BackButton } from "@/components/BackButton"

type Transaction = {
  id: string
  orderNumber?: string
  type: "BOOKING" | "QUESTION"
  student: any
  teacher: any
  amount: number
  status: string
  paymentStatus: string
  createdAt: string
  completedAt?: string
  cancelledAt?: string
  refundedAt?: string
  platformFee?: number
  timeSlot?: any
}

type User = {
  id: string
  uniqueId: string
  email: string
  name: string
  role: string
  avatar?: string
  banned: boolean
  createdAt: string
  _count: {
    bookingsAsStudent: number
    bookingsAsTeacher: number
    questionsAsStudent: number
    questionsAsTeacher: number
  }
}

type VerificationCode = {
  id: string
  code: string
  used: boolean
  usedBy?: string
  usedAt?: string
  createdAt: string
  usedByUser?: {
    id: string
    name: string
    email: string
    uniqueId: string
  }
}

export default function AdminPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<"transactions" | "users" | "verification-codes">("transactions")
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [verificationCodes, setVerificationCodes] = useState<VerificationCode[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [refundReason, setRefundReason] = useState("")
  const [refundingId, setRefundingId] = useState<string | null>(null)
  const [codeFilter, setCodeFilter] = useState<"all" | "used" | "unused">("all")
  const [generatingCode, setGeneratingCode] = useState(false)

  useEffect(() => {
    if (status === "loading") return
    if (status === "unauthenticated" || session?.user.role !== "ADMIN") {
      router.push("/auth/signin")
      return
    }
    fetchData()
  }, [session, status, router, activeTab])

  const fetchData = async () => {
    setLoading(true)
    try {
      if (activeTab === "transactions") {
        const res = await fetch("/api/admin/transactions")
        if (res.ok) {
          const data = await res.json()
          setTransactions(data.transactions || [])
        }
      } else if (activeTab === "users") {
        const res = await fetch(`/api/admin/users?search=${encodeURIComponent(searchQuery)}`)
        if (res.ok) {
          const data = await res.json()
          setUsers(data.users || [])
        }
      } else if (activeTab === "verification-codes") {
        const usedParam = codeFilter === "used" ? "true" : codeFilter === "unused" ? "false" : ""
        const res = await fetch(`/api/admin/verification-codes${usedParam ? `?used=${usedParam}` : ""}`)
        if (res.ok) {
          const data = await res.json()
          setVerificationCodes(data.codes || [])
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === "users") {
      // Debounce search
      const timer = setTimeout(() => {
        fetchData()
      }, 300)
      return () => clearTimeout(timer)
    } else if (activeTab === "verification-codes") {
      fetchData()
    }
  }, [searchQuery, activeTab, codeFilter])

  const handleRefund = async (type: string, id: string) => {
    if (!refundReason.trim()) {
      alert("Please provide a reason for the refund")
      return
    }

    if (!confirm(`Refund this ${type.toLowerCase()}?`)) return

    setRefundingId(id)
    try {
      const res = await fetch("/api/admin/refund", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: type === "BOOKING" ? "BOOKING" : "QUESTION",
          id,
          reason: refundReason,
        }),
      })

      if (res.ok) {
        alert("Refund processed successfully")
        setRefundReason("")
        fetchData()
      } else {
        const error = await res.json()
        alert(error.error || "Failed to process refund")
      }
    } catch (error) {
      alert("An error occurred")
    } finally {
      setRefundingId(null)
    }
  }

  const handleBan = async (userId: string, banned: boolean) => {
    const action = banned ? "ban" : "unban"
    if (!confirm(`Are you sure you want to ${action} this user?`)) return

    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ banned, reason: "Admin action" }),
      })

      if (res.ok) {
        alert(`User ${banned ? "banned" : "unbanned"} successfully`)
        fetchData()
      } else {
        const error = await res.json()
        alert(error.error || "Failed to update user")
      }
    } catch (error) {
      alert("An error occurred")
    }
  }

  const handleGenerateCode = async () => {
    setGeneratingCode(true)
    try {
      const res = await fetch("/api/admin/verification-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })

      if (res.ok) {
        const data = await res.json()
        alert(`Verification code generated: ${data.code}`)
        fetchData()
      } else {
        const error = await res.json()
        alert(error.error || "Failed to generate code")
      }
    } catch (error) {
      alert("An error occurred")
    } finally {
      setGeneratingCode(false)
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatCurrency = (amount: number) => {
    return `MYR ${amount.toFixed(2)}`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-100 text-green-800"
      case "ACCEPTED":
        return "bg-blue-100 text-blue-800"
      case "PENDING":
        return "bg-yellow-100 text-yellow-800"
      case "CANCELLED":
        return "bg-gray-100 text-gray-800"
      case "REFUNDED":
        return "bg-red-100 text-red-800"
      case "EXPIRED":
        return "bg-orange-100 text-orange-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-4">
        <BackButton fallbackPath="/dashboard" />
      </div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Panel</h1>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab("transactions")}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "transactions"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Transactions
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "users"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            User Management
          </button>
          <button
            onClick={() => setActiveTab("verification-codes")}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "verification-codes"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Verification Codes
          </button>
        </nav>
      </div>

      {/* Transactions Tab */}
      {activeTab === "transactions" && (
        <div>
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">All Transactions</h2>
            <p className="text-sm text-gray-600">
              Sorted by date (newest first). Click "Refund" to manually process a refund.
            </p>
          </div>

          {transactions.length === 0 ? (
            <div className="text-center py-12 text-gray-500">No transactions found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Teacher
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {tx.orderNumber ? (
                          <span className="font-mono font-semibold text-blue-600">{tx.orderNumber}</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(tx.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            tx.type === "BOOKING"
                              ? "bg-purple-100 text-purple-800"
                              : "bg-indigo-100 text-indigo-800"
                          }`}
                        >
                          {tx.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {tx.student?.name || "N/A"}
                        <br />
                        <span className="text-xs text-gray-500">{tx.student?.email}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {tx.teacher?.name || "N/A"}
                        <br />
                        <span className="text-xs text-gray-500">{tx.teacher?.email}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency(tx.amount)}
                        {tx.platformFee && (
                          <span className="block text-xs text-gray-500">
                            Fee: {formatCurrency(tx.platformFee)}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                            tx.status
                          )}`}
                        >
                          {tx.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {tx.paymentStatus}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {tx.status !== "REFUNDED" && (
                          <div className="space-y-2">
                            <input
                              type="text"
                              placeholder="Refund reason"
                              value={refundReason}
                              onChange={(e) => setRefundReason(e.target.value)}
                              className="text-xs border border-gray-300 rounded px-2 py-1 w-full"
                            />
                            <button
                              onClick={() => handleRefund(tx.type, tx.id)}
                              disabled={refundingId === tx.id}
                              className="text-xs bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 disabled:opacity-50"
                            >
                              {refundingId === tx.id ? "Processing..." : "Refund"}
                            </button>
                          </div>
                        )}
                        {tx.status === "REFUNDED" && (
                          <span className="text-xs text-gray-500">Refunded</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Users Tab */}
      {activeTab === "users" && (
        <div>
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">User Management</h2>
            <div className="mt-4">
              <input
                type="text"
                placeholder="Search by name, email, or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full max-w-md border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {users.length === 0 ? (
            <div className="text-center py-12 text-gray-500">No users found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Activity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                            {user.avatar ? (
                              <img
                                src={user.avatar}
                                alt={user.name}
                                className="h-10 w-10 rounded-full"
                              />
                            ) : (
                              <span className="text-gray-600 font-medium">
                                {user.name.charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{user.name}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                            <div className="text-xs text-gray-400">{user.uniqueId}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            user.role === "ADMIN"
                              ? "bg-red-100 text-red-800"
                              : user.role === "TEACHER"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="text-xs">
                          <div>Bookings: {user._count.bookingsAsStudent + user._count.bookingsAsTeacher}</div>
                          <div>Questions: {user._count.questionsAsStudent + user._count.questionsAsTeacher}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {user.banned ? (
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                            Banned
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                            Active
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <Link
                          href={`/admin/users/${user.id}`}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          View
                        </Link>
                        <button
                          onClick={() => handleBan(user.id, !user.banned)}
                          className={`${
                            user.banned
                              ? "text-green-600 hover:text-green-900"
                              : "text-red-600 hover:text-red-900"
                          }`}
                        >
                          {user.banned ? "Unban" : "Ban"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Verification Codes Tab */}
      {activeTab === "verification-codes" && (
        <div>
          <div className="mb-6 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold mb-2">Verification Codes</h2>
              <p className="text-sm text-gray-600">
                Generate and manage 6-digit verification codes for teacher registration
              </p>
            </div>
            <button
              onClick={handleGenerateCode}
              disabled={generatingCode}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {generatingCode ? "Generating..." : "Generate New Code"}
            </button>
          </div>

          <div className="mb-4">
            <div className="flex space-x-2">
              <button
                onClick={() => setCodeFilter("all")}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  codeFilter === "all"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setCodeFilter("unused")}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  codeFilter === "unused"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                Unused
              </button>
              <button
                onClick={() => setCodeFilter("used")}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  codeFilter === "used"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                Used
              </button>
            </div>
          </div>

          {verificationCodes.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No verification codes found. Generate your first code to get started.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created At
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Used At
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Used By
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {verificationCodes.map((code) => (
                    <tr key={code.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-lg font-mono font-semibold text-gray-900">
                          {code.code}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {code.used ? (
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                            Used
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                            Available
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(code.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {code.usedAt ? formatDate(code.usedAt) : "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {code.usedByUser ? (
                          <div>
                            <div className="font-medium">{code.usedByUser.name}</div>
                            <div className="text-xs text-gray-400">{code.usedByUser.email}</div>
                            <div className="text-xs text-gray-400">{code.usedByUser.uniqueId}</div>
                          </div>
                        ) : (
                          "-"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
