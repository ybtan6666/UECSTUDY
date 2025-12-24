"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function QuestionsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [questions, setQuestions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("my-questions")

  useEffect(() => {
    if (status === "loading") return
    if (status === "unauthenticated") {
      router.push("/auth/signin")
      return
    }
    if (session) {
      fetchQuestions()
    }
  }, [session, status, router, filter])

  const fetchQuestions = async () => {
    try {
      const url =
        session?.user.role === "STUDENT"
          ? `/api/questions?filter=my-questions`
          : filter === "my-accepted"
          ? `/api/questions?filter=my-accepted`
          : `/api/questions?filter=open`
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        setQuestions(data)
      }
      setLoading(false)
    } catch (error) {
      console.error("Error fetching questions:", error)
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    const colors: any = {
      PENDING: "bg-yellow-100 text-yellow-800",
      ACCEPTED: "bg-blue-100 text-blue-800",
      ANSWERED: "bg-purple-100 text-purple-800",
      COMPLETED: "bg-green-100 text-green-800",
      CANCELLED: "bg-gray-100 text-gray-800",
      EXPIRED: "bg-red-100 text-red-800",
      REFUNDED: "bg-orange-100 text-orange-800",
    }
    return colors[status] || "bg-gray-100 text-gray-800"
  }

  if (status === "loading" || loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  if (!session) return null

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          {session.user.role === "STUDENT" ? "My Questions" : "Questions"}
        </h1>
        {session.user.role === "STUDENT" && (
          <Link
            href="/questions/ask"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Ask a Question
          </Link>
        )}
        {session.user.role === "TEACHER" && (
          <div className="flex space-x-2">
            <button
              onClick={() => setFilter("open")}
              className={`px-4 py-2 rounded-lg ${
                filter === "open"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              Open Questions
            </button>
            <button
              onClick={() => setFilter("my-accepted")}
              className={`px-4 py-2 rounded-lg ${
                filter === "my-accepted"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              My Accepted
            </button>
          </div>
        )}
      </div>

      {questions.length === 0 ? (
        <div className="text-center py-12 border border-gray-200 rounded-lg">
          <p className="text-gray-600">
            {session.user.role === "STUDENT"
              ? "You haven't asked any questions yet."
              : "No questions available."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {questions.map((question) => (
            <Link
              key={question.id}
              href={`/questions/${question.id}`}
              className="block border border-gray-200 rounded-lg p-6 hover:bg-gray-50 transition-colors"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    {question.orderNumber && (
                      <span className="text-xs font-mono font-semibold text-blue-600">
                        {question.orderNumber}
                      </span>
                    )}
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                        question.status
                      )}`}
                    >
                      {question.status}
                    </span>
                    <span className="text-sm text-gray-600">
                      MYR {question.price.toFixed(2)}
                    </span>
                    {question.teacher && (
                      <span className="text-sm text-gray-600">
                        Teacher: {question.teacher.name}
                      </span>
                    )}
                  </div>
                  <div className="text-gray-900 font-medium mb-2">
                    {question.questionText ||
                      question.questionImage ||
                      question.questionAudio ||
                      question.questionVideo ||
                      "Question"}
                  </div>
                  <div className="text-sm text-gray-600">
                    Deadline: {new Date(question.deadline).toLocaleString()}
                  </div>
                </div>
                {question.answerText && (
                  <div className="ml-4 text-sm text-green-600 font-semibold">
                    Answered
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

