"use client"

import { useSession } from "next-auth/react"
import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"

export default function QuestionDetailPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const [question, setQuestion] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [answerData, setAnswerData] = useState({
    answerText: "",
    answerImage: "",
    answerAudio: "",
    answerVideo: "",
  })

  useEffect(() => {
    if (status === "loading") return
    if (status === "unauthenticated") {
      router.push("/auth/signin")
      return
    }
    if (session) {
      fetchQuestion()
    }
  }, [session, status, router, params.id])

  const fetchQuestion = async () => {
    try {
      const res = await fetch(`/api/questions/${params.id}`)
      if (res.ok) {
        const data = await res.json()
        setQuestion(data)
      }
      setLoading(false)
    } catch (error) {
      console.error("Error fetching question:", error)
      setLoading(false)
    }
  }

  const handleAction = async (action: string, data?: any) => {
    setActionLoading(true)
    try {
      const res = await fetch(`/api/questions/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...data }),
      })

      if (res.ok) {
        fetchQuestion()
      } else {
        const error = await res.json()
        alert(error.error || "Action failed")
      }
    } catch (error) {
      alert("An error occurred")
    } finally {
      setActionLoading(false)
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
    return <div className="max-w-4xl mx-auto px-4 py-12">Loading...</div>
  }

  if (!question) {
    return <div className="max-w-4xl mx-auto px-4 py-12">Question not found</div>
  }

  const isStudent = session?.user.role === "STUDENT" && question.studentId === session.user.id
  const isTeacher = session?.user.role === "TEACHER" && question.teacherId === session.user.id

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="mb-6">
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
            question.status
          )}`}
        >
          {question.status}
        </span>
        <span className="ml-4 text-gray-600">MYR {question.price.toFixed(2)}</span>
      </div>

      <div className="border border-gray-200 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Question</h2>
        {question.questionText && (
          <div className="mb-4">
            <p className="text-gray-900 whitespace-pre-wrap">{question.questionText}</p>
          </div>
        )}
        {question.questionImage && (
          <div className="mb-4">
            <img src={question.questionImage} alt="Question" className="max-w-full rounded" />
          </div>
        )}
        {question.questionAudio && (
          <div className="mb-4">
            <audio controls src={question.questionAudio} className="w-full" />
          </div>
        )}
        {question.questionVideo && (
          <div className="mb-4">
            <video controls src={question.questionVideo} className="w-full rounded" />
          </div>
        )}
        <div className="text-sm text-gray-600 mt-4">
          Asked by: {question.student.name} ({question.student.uniqueId})
        </div>
        {question.teacher && (
          <div className="text-sm text-gray-600">
            Teacher: {question.teacher.name} ({question.teacher.uniqueId})
          </div>
        )}
        <div className="text-sm text-gray-600">
          Deadline: {new Date(question.deadline).toLocaleString()}
        </div>
      </div>

      {question.answerText || question.answerImage || question.answerAudio || question.answerVideo ? (
        <div className="border border-gray-200 rounded-lg p-6 mb-6 bg-green-50">
          <h2 className="text-xl font-semibold mb-4">Answer</h2>
          {question.answerText && (
            <div className="mb-4">
              <p className="text-gray-900 whitespace-pre-wrap">{question.answerText}</p>
            </div>
          )}
          {question.answerImage && (
            <div className="mb-4">
              <img src={question.answerImage} alt="Answer" className="max-w-full rounded" />
            </div>
          )}
          {question.answerAudio && (
            <div className="mb-4">
              <audio controls src={question.answerAudio} className="w-full" />
            </div>
          )}
          {question.answerVideo && (
            <div className="mb-4">
              <video controls src={question.answerVideo} className="w-full rounded" />
            </div>
          )}
          {question.answeredAt && (
            <div className="text-sm text-gray-600 mt-4">
              Answered at: {new Date(question.answeredAt).toLocaleString()}
            </div>
          )}
        </div>
      ) : null}

      {/* Actions */}
      {isTeacher && question.status === "PENDING" && (
        <div className="border border-gray-200 rounded-lg p-6 mb-6">
          <button
            onClick={() => handleAction("ACCEPT")}
            disabled={actionLoading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            Accept Question
          </button>
        </div>
      )}

      {isTeacher && question.status === "ACCEPTED" && (
        <div className="border border-gray-200 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Submit Answer</h3>
          <div className="space-y-4">
            <textarea
              value={answerData.answerText}
              onChange={(e) =>
                setAnswerData({ ...answerData, answerText: e.target.value })
              }
              rows={6}
              className="w-full border border-gray-300 rounded-lg px-4 py-2"
              placeholder="Type your answer here..."
            />
            <div className="grid md:grid-cols-2 gap-4">
              <input
                type="url"
                value={answerData.answerImage}
                onChange={(e) =>
                  setAnswerData({ ...answerData, answerImage: e.target.value })
                }
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
                placeholder="Image URL"
              />
              <input
                type="url"
                value={answerData.answerAudio}
                onChange={(e) =>
                  setAnswerData({ ...answerData, answerAudio: e.target.value })
                }
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
                placeholder="Audio URL"
              />
            </div>
            <input
              type="url"
              value={answerData.answerVideo}
              onChange={(e) =>
                setAnswerData({ ...answerData, answerVideo: e.target.value })
              }
              className="w-full border border-gray-300 rounded-lg px-4 py-2"
              placeholder="Video URL"
            />
            <button
              onClick={() => handleAction("ANSWER", answerData)}
              disabled={actionLoading}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              Submit Answer
            </button>
          </div>
        </div>
      )}

      {isStudent && question.status === "ANSWERED" && (
        <div className="border border-gray-200 rounded-lg p-6 mb-6">
          <button
            onClick={() => handleAction("COMPLETE")}
            disabled={actionLoading}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            Mark as Completed (Release Payment)
          </button>
        </div>
      )}

      {isStudent && question.status === "PENDING" && (
        <div className="border border-gray-200 rounded-lg p-6 mb-6">
          <button
            onClick={() => {
              if (confirm("Are you sure you want to cancel this question?")) {
                handleAction("CANCEL")
              }
            }}
            disabled={actionLoading}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            Cancel Question
          </button>
        </div>
      )}

      {/* Order Logs */}
      {question.orderLogs && question.orderLogs.length > 0 && (
        <div className="border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Order History</h3>
          <div className="space-y-2">
            {question.orderLogs.map((log: any) => (
              <div key={log.id} className="text-sm text-gray-600">
                <span className="font-medium">{log.action}</span> -{" "}
                {log.fromStatus && `${log.fromStatus} → `}
                {log.toStatus} - {new Date(log.createdAt).toLocaleString()}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

