"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { RatingSystem } from "@/components/RatingSystem"

interface Course {
  id: string
  title: string
  subject: string
  description: string
  price: number
  videoUrl: string | null
  externalUrl: string | null
  teacher: { name: string; id: string }
  purchased: boolean
}

export default function CourseDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const [course, setCourse] = useState<Course | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (params.id) {
      fetchCourse()
    }
  }, [params.id])

  const fetchCourse = async () => {
    const res = await fetch(`/api/courses/${params.id}`)
    const data = await res.json()
    setCourse(data)
    setLoading(false)
  }

  const handlePurchase = async () => {
    const res = await fetch(`/api/courses/${params.id}/purchase`, {
      method: "POST",
    })

    if (res.ok) {
      alert("Course purchased successfully!")
      fetchCourse()
    } else {
      alert("Purchase failed")
    }
  }

  if (loading) return <div className="text-center py-12">Loading...</div>
  if (!course) return <div className="text-center py-12">Course not found</div>

  const isTeacher = (session?.user as any)?.role === "TEACHER"
  const isOwner = (session?.user as any)?.id === course.teacher.id

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="uec-card p-8">
        <h1 className="text-3xl font-bold mb-4 text-red-600">{course.title}</h1>
        <p className="text-gray-500 mb-2">Subject: {course.subject}</p>
        <p className="text-gray-500 mb-4">By {course.teacher.name}</p>

        <div className="mb-6 border-b pb-4">
          <RatingSystem courseId={course.id} />
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Description</h2>
          <p className="text-gray-700 whitespace-pre-wrap">{course.description}</p>
        </div>

        <div className="mb-6">
          <span className="text-2xl font-bold text-red-600">
            RM {course.price.toFixed(2)}
          </span>
        </div>

        {course.purchased || isOwner ? (
          <div className="space-y-4 mb-6">
            {course.videoUrl && (
              <div>
                <h3 className="font-semibold mb-2">Video Content</h3>
                <a
                  href={course.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Watch Video
                </a>
              </div>
            )}
            {course.externalUrl && (
              <div>
                <h3 className="font-semibold mb-2">External Resources</h3>
                <a
                  href={course.externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Open Link
                </a>
              </div>
            )}
          </div>
        ) : (
          !isTeacher && (
            <button
              onClick={handlePurchase}
              className="px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 mb-6"
            >
              Purchase Course
            </button>
          )
        )}

        <CourseChallenges courseId={course.id} isOwner={isOwner} />

        <div className="border-t pt-6 mt-6">
          <h3 className="text-xl font-semibold mb-4">Discussion</h3>
          <CommentsSection courseId={course.id} />
        </div>
      </div>
    </div>
  )
}

function CourseChallenges({ courseId, isOwner }: { courseId: string; isOwner: boolean }) {
  const { data: session } = useSession()
  const [challenges, setChallenges] = useState<any[]>([])
  const [availableChallenges, setAvailableChallenges] = useState<any[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [selectedChallenge, setSelectedChallenge] = useState("")

  useEffect(() => {
    fetchChallenges()
    if (isOwner) {
      fetchAvailableChallenges()
    }
  }, [courseId, isOwner])

  const fetchChallenges = async () => {
    try {
      const res = await fetch(`/api/courses/${courseId}/challenges`)
      if (res.ok) {
        const data = await res.json()
        setChallenges(data.map((cc: any) => cc.challenge))
      } else {
        setChallenges([])
      }
    } catch (error) {
      console.error("Error fetching challenges:", error)
      setChallenges([])
    }
  }

  const fetchAvailableChallenges = async () => {
    const res = await fetch("/api/challenges")
    const data = await res.json()
    setAvailableChallenges(data)
  }

  const handleAddChallenge = async () => {
    if (!selectedChallenge) return

    const res = await fetch(`/api/courses/${courseId}/challenges`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ challengeId: selectedChallenge }),
    })

    if (res.ok) {
      fetchChallenges()
      setShowAddForm(false)
      setSelectedChallenge("")
    }
  }

  if (challenges.length === 0 && !isOwner) return null

  return (
    <div className="border-t pt-6 mt-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold">🎯 Course Challenges</h3>
        {isOwner && (
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
          >
            {showAddForm ? "Cancel" : "Add Challenge"}
          </button>
        )}
      </div>

      {showAddForm && (
        <div className="mb-4 p-4 bg-gray-50 rounded">
          <select
            value={selectedChallenge}
            onChange={(e) => setSelectedChallenge(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md mb-2"
          >
            <option value="">Select a challenge...</option>
            {availableChallenges
              .filter((c) => !challenges.some((cc) => cc.id === c.id))
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title} - {c.subject}
                </option>
              ))}
          </select>
          <button
            onClick={handleAddChallenge}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Add to Course
          </button>
        </div>
      )}

      {challenges.length > 0 ? (
        <div className="space-y-2">
          {challenges.map((challenge) => (
            <Link
              key={challenge.id}
              href={`/challenges/${challenge.id}`}
              className="block p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <h4 className="font-semibold">{challenge.title}</h4>
              <p className="text-sm text-gray-600">
                {challenge.subject} • {challenge.coinReward} coins reward
              </p>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-gray-500">No challenges added yet.</p>
      )}
    </div>
  )
}

function CommentsSection({ courseId }: { courseId: string }) {
  const { data: session } = useSession()
  const [comments, setComments] = useState<any[]>([])
  const [newComment, setNewComment] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchComments()
  }, [courseId])

  const fetchComments = async () => {
    const res = await fetch(`/api/comments?courseId=${courseId}`)
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
        courseId,
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

