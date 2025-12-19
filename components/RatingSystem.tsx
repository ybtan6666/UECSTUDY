"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"

interface RatingSystemProps {
  courseId?: string
  challengeId?: string
  questionId?: string
}

export function RatingSystem({ courseId, challengeId, questionId }: RatingSystemProps) {
  const { data: session } = useSession()
  const [userRating, setUserRating] = useState<number | null>(null)
  const [averageRating, setAverageRating] = useState(0)
  const [totalRatings, setTotalRatings] = useState(0)
  const [review, setReview] = useState("")
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRatings()
  }, [courseId, challengeId, questionId])

  const fetchRatings = async () => {
    try {
      const params = new URLSearchParams()
      if (courseId) params.append("courseId", courseId)
      if (challengeId) params.append("challengeId", challengeId)
      if (questionId) params.append("questionId", questionId)

      const res = await fetch(`/api/ratings?${params}`)
      const data = await res.json()
      setAverageRating(data.averageRating)
      setTotalRatings(data.totalRatings)

      // Find user's rating
      if (session && data.ratings) {
        const userId = (session.user as any).id
        const userRatingData = data.ratings.find(
          (r: any) => (r.user && r.user.id === userId) || r.userId === userId
        )
        if (userRatingData) {
          setUserRating(userRatingData.rating)
          setReview(userRatingData.review || "")
        }
      }
    } catch (error) {
      console.error("Error fetching ratings:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleRating = async (rating: number) => {
    if (!session) {
      alert("Please sign in to rate")
      return
    }

    try {
      const res = await fetch("/api/ratings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId,
          challengeId,
          questionId,
          rating,
          review: showReviewForm ? review : null,
        }),
      })

      if (res.ok) {
        setUserRating(rating)
        fetchRatings()
      }
    } catch (error) {
      console.error("Error submitting rating:", error)
    }
  }

  const handleReviewSubmit = async () => {
    if (!userRating) {
      alert("Please select a rating first")
      return
    }

    await handleRating(userRating)
    setShowReviewForm(false)
  }

  if (loading) return <div>Loading ratings...</div>

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-4">
        <div>
          <div className="flex items-center space-x-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => handleRating(star)}
                className={`text-2xl ${
                  userRating && star <= userRating
                    ? "text-yellow-400"
                    : "text-gray-300"
                } hover:text-yellow-400 transition-colors`}
                disabled={!session}
              >
                ★
              </button>
            ))}
          </div>
          <p className="text-sm text-gray-600 mt-1">
            {averageRating > 0 ? (
              <>
                {averageRating.toFixed(1)} / 5.0 ({totalRatings} {totalRatings === 1 ? "rating" : "ratings"})
              </>
            ) : (
              "No ratings yet"
            )}
          </p>
        </div>
      </div>

      {session && userRating && (
        <div>
          <button
            onClick={() => setShowReviewForm(!showReviewForm)}
            className="text-sm text-blue-600 hover:underline"
          >
            {showReviewForm ? "Cancel Review" : "Add Review"}
          </button>
          {showReviewForm && (
            <div className="mt-2">
              <textarea
                value={review}
                onChange={(e) => setReview(e.target.value)}
                placeholder="Write your review..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
              <button
                onClick={handleReviewSubmit}
                className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Submit Review
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

