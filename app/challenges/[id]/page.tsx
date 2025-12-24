"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import React from "react"
import { RatingSystem } from "@/components/RatingSystem"
import { BackButton } from "@/components/BackButton"

interface Question {
  id: string
  question: string
  optionA: string
  optionB: string
  optionC: string
  optionD: string
  correctAnswer: string
  order: number
}

interface Challenge {
  id: string
  title: string
  subject: string
  coinReward: number
  teacher: { name: string }
  questions: Question[]
}

export default function ChallengeAttemptPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const [challenge, setChallenge] = useState<Challenge | null>(null)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (params.id) {
      fetchChallenge()
    }
  }, [params.id])

  const fetchChallenge = async () => {
    const res = await fetch(`/api/challenges/${params.id}`)
    const data = await res.json()
    setChallenge(data)
    setLoading(false)
  }

  const handleSubmit = async () => {
    const res = await fetch(`/api/challenges/${params.id}/attempt`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers }),
    })

    const data = await res.json()
    setScore(data.score)
    setSubmitted(true)
  }

  if (loading) return <div className="text-center py-12">Loading...</div>
  if (!challenge) return <div className="text-center py-12">Challenge not found</div>

  if (submitted && score !== null) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-white p-8 rounded-lg shadow text-center">
          <h1 className="text-3xl font-bold mb-4">Challenge Complete!</h1>
          <p className="text-2xl mb-4">
            Your Score: {score} / {challenge.questions.length}
          </p>
          <p className="text-lg text-gray-600 mb-6">
            You earned {challenge.coinReward} virtual coins!
          </p>
          <button
            onClick={() => router.push("/challenges")}
            className="px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Back to Challenges
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-4">
        <BackButton fallbackPath="/challenges" />
      </div>
      <div className="uec-card p-8">
        <h1 className="text-3xl font-bold mb-2 text-yellow-600">{challenge.title}</h1>
        <p className="text-gray-500 mb-4">{challenge.subject} • Reward: {challenge.coinReward} coins</p>
        
        <div className="mb-6 border-b pb-4">
          <RatingSystem challengeId={challenge.id} />
        </div>

        <div className="space-y-6 mb-6">
          {challenge.questions.map((q) => (
            <div key={q.id} className="border p-4 rounded-lg">
              <p className="font-semibold mb-3">{q.question}</p>
              <div className="space-y-2">
                {["A", "B", "C", "D"].map((option) => (
                  <label key={option} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name={`question-${q.id}`}
                      value={option}
                      checked={answers[q.id] === option}
                      onChange={(e) => setAnswers({ ...answers, [q.id]: option })}
                      className="w-4 h-4"
                    />
                    <span>{option}. {q[`option${option}` as keyof Question]}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={handleSubmit}
          disabled={Object.keys(answers).length !== challenge.questions.length}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          Submit Answers
        </button>

        <div className="border-t pt-6 mt-6">
          <h3 className="text-xl font-semibold mb-4">Discussion</h3>
          <CommentsSection challengeId={challenge.id} />
        </div>
      </div>
    </div>
  )
}

function CommentsSection({ challengeId }: { challengeId: string }) {
  const { data: session } = useSession()
  const [comments, setComments] = useState<any[]>([])
  const [newComment, setNewComment] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchComments()
  }, [challengeId])

  const fetchComments = async () => {
    const res = await fetch(`/api/comments?challengeId=${challengeId}`)
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
        challengeId,
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
          </div>
        ))}
      </div>
    </div>
  )
}

