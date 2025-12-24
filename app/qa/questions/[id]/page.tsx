"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { useSession } from "next-auth/react"
import { formatDistanceToNow } from "date-fns"
import { RatingSystem } from "@/components/RatingSystem"
import { BackButton } from "@/components/BackButton"

interface PaidQuestion {
  id: string
  question: string
  answer: string | null
  price: number
  deadline: string
  answeredAt: string | null
  isRefundable: boolean
  student: { name: string; id: string }
  teacher: { name: string; id: string }
  course: { title: string } | null
}

export default function QuestionDetailPage() {
  const params = useParams()
  const { data: session } = useSession()
  const [question, setQuestion] = useState<PaidQuestion | null>(null)
  const [answer, setAnswer] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchQuestion()
  }, [params.id])

  const fetchQuestion = async () => {
    const res = await fetch(`/api/qa/questions/${params.id}`)
    const data = await res.json()
    setQuestion(data)
    setLoading(false)
  }

  const handleAnswer = async () => {
    const res = await fetch(`/api/qa/questions/${params.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answer }),
    })

    if (res.ok) {
      fetchQuestion()
      setAnswer("")
    } else {
      alert("Failed to submit answer")
    }
  }

  const handleRefund = async () => {
    // Mock refund
    alert("Refund processed (mock)")
  }

  if (loading) return <div className="text-center py-12">Loading...</div>
  if (!question) return <div className="text-center py-12">Question not found</div>

  const userId = (session?.user as any)?.id
  const isTeacher = (session?.user as any)?.role === "TEACHER"
  const isOwner = userId === question.teacher.id
  const deadline = new Date(question.deadline)
  const isPastDeadline = deadline < new Date()

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-4">
        <BackButton fallbackPath="/qa" />
      </div>
      <div className="uec-card p-8">
        <div className="mb-6">
          <div className="flex justify-between items-start mb-4">
            <h1 className="text-2xl font-bold">Question</h1>
            <div className="text-right">
              <p className="text-lg font-semibold text-blue-600">
                RM {question.price.toFixed(2)}
              </p>
              {question.isRefundable && (
                <button
                  onClick={handleRefund}
                  className="text-sm text-red-600 hover:underline"
                >
                  Request Refund
                </button>
              )}
            </div>
          </div>
          <p className="text-gray-600 mb-2">
            Student: {question.student.name}
            {question.course && ` • Course: ${question.course.title}`}
          </p>
          <p className="text-sm text-gray-500">
            Deadline: {formatDistanceToNow(deadline, { addSuffix: true })}
            {isPastDeadline && !question.answeredAt && (
              <span className="text-red-600 ml-2">(Overdue)</span>
            )}
          </p>
        </div>

        <div className="mb-6 p-4 bg-gray-50 rounded">
          <h2 className="font-semibold mb-2">Question:</h2>
          <p className="text-gray-700 whitespace-pre-wrap">{question.question}</p>
        </div>

        {question.answer ? (
          <div className="mb-6 p-4 bg-blue-50 rounded">
            <h2 className="font-semibold mb-2">Answer from {question.teacher.name}:</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{question.answer}</p>
          </div>
        ) : isOwner && isTeacher ? (
          <div className="mb-6">
            <h2 className="font-semibold mb-2">Your Answer:</h2>
            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-md mb-2"
              placeholder="Write your answer here..."
            />
            <button
              onClick={handleAnswer}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Submit Answer
            </button>
          </div>
        ) : (
          <div className="mb-6 p-4 bg-yellow-50 rounded">
            <p className="text-gray-600">Waiting for teacher response...</p>
          </div>
        )}

        {question.answer && (
          <div className="mb-6 border-b pb-4">
            <RatingSystem questionId={question.id} />
          </div>
        )}

        <div className="border-t pt-6">
          <h3 className="text-xl font-semibold mb-4">Discussion</h3>
          <CommentsSection questionId={question.id} />
        </div>
      </div>
    </div>
  )
}

function CommentsSection({ questionId }: { questionId: string }) {
  const { data: session } = useSession()
  const [comments, setComments] = useState<any[]>([])
  const [newComment, setNewComment] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchComments()
  }, [questionId])

  const fetchComments = async () => {
    const res = await fetch(`/api/comments?questionId=${questionId}`)
    const data = await res.json()
    setComments(data)
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim()) return

    const res = await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: newComment,
        questionId,
      }),
    })

    if (res.ok) {
      setNewComment("")
      fetchComments()
    }
  }

  if (loading) return <div>Loading comments...</div>

  return (
    <div>
      {session && (
        <form onSubmit={handleSubmit} className="mb-6">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md mb-2"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Post Comment
          </button>
        </form>
      )}
      <div className="space-y-4">
        {comments.map((comment) => (
          <div key={comment.id} className="border-l-2 border-gray-200 pl-4">
            <div className="flex justify-between mb-1">
              <span className="font-semibold">{comment.user.name}</span>
              <span className="text-sm text-gray-500">
                {new Date(comment.createdAt).toLocaleDateString()}
              </span>
            </div>
            <p className="text-gray-700">{comment.content}</p>
            {comment.replies && comment.replies.length > 0 && (
              <div className="mt-2 ml-4 space-y-2">
                {comment.replies.map((reply: any) => (
                  <div key={reply.id} className="border-l-2 border-gray-300 pl-3">
                    <div className="flex justify-between mb-1">
                      <span className="font-semibold text-sm">{reply.user.name}</span>
                      <span className="text-xs text-gray-500">
                        {new Date(reply.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-gray-700 text-sm">{reply.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

