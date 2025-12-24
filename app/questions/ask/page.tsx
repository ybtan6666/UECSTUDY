"use client"

import { useSession } from "next-auth/react"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { BackButton } from "@/components/BackButton"

const PLATFORM_MIN_PRICE = 5.0

export default function AskQuestionPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState<string | null>(null)
  const [teachers, setTeachers] = useState<any[]>([])
  const [formData, setFormData] = useState({
    questionText: "",
    questionImage: "",
    questionAudio: "",
    questionVideo: "",
    teacherId: "",
    price: PLATFORM_MIN_PRICE,
    expectedResponseHours: 24,
  })

  useEffect(() => {
    if (status === "loading") return
    if (status === "unauthenticated" || session?.user.role !== "STUDENT") {
      router.push("/auth/signin")
      return
    }
    fetchTeachers()
    
    // Check for teacherId in URL params
    const teacherId = searchParams.get("teacherId")
    if (teacherId) {
      setFormData((prev) => ({ ...prev, teacherId }))
    }
  }, [session, status, router, searchParams])

  const fetchTeachers = async () => {
    try {
      const res = await fetch("/api/teachers")
      if (res.ok) {
        const data = await res.json()
        setTeachers(data)
      }
    } catch (error) {
      console.error("Error fetching teachers:", error)
    }
  }

  const handleFileUpload = async (file: File, type: "image" | "audio" | "video") => {
    setUploading(type)
    try {
      const uploadFormData = new FormData()
      uploadFormData.append("file", file)
      uploadFormData.append("type", type)

      const res = await fetch("/api/upload", {
        method: "POST",
        body: uploadFormData,
      })

      if (res.ok) {
        const data = await res.json()
        setFormData((prev) => ({
          ...prev,
          [`question${type.charAt(0).toUpperCase() + type.slice(1)}`]: data.url,
        }))
      } else {
        const error = await res.json()
        alert(error.error || "Failed to upload file")
      }
    } catch (error) {
      alert("An error occurred while uploading")
    } finally {
      setUploading(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    if (!formData.questionText && !formData.questionImage && !formData.questionAudio && !formData.questionVideo) {
      alert("Please provide at least one form of question content (text, image, audio, or video)")
      return
    }

    if (!formData.price || formData.price < PLATFORM_MIN_PRICE) {
      alert(`Minimum price is MYR ${PLATFORM_MIN_PRICE}`)
      return
    }

    setLoading(true)

    try {
      const payload = {
        questionText: formData.questionText.trim() || null,
        questionImage: formData.questionImage.trim() || null,
        questionAudio: formData.questionAudio.trim() || null,
        questionVideo: formData.questionVideo.trim() || null,
        teacherId: formData.teacherId && formData.teacherId.trim() !== "" ? formData.teacherId : null,
        price: Number(formData.price),
        expectedResponseHours: Number(formData.expectedResponseHours),
      }

      console.log("Submitting question:", payload)

      const res = await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (res.ok) {
        router.push("/questions")
      } else {
        console.error("Submission error:", data)
        alert(data.error || "Failed to submit question. Please check the console for details.")
      }
    } catch (error) {
      console.error("Submission error:", error)
      alert("An error occurred. Please check the console for details.")
    } finally {
      setLoading(false)
    }
  }

  if (status === "loading") {
    return <div className="max-w-4xl mx-auto px-4 py-12">Loading...</div>
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="mb-4">
        <BackButton fallbackPath="/questions" />
      </div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Ask a Question</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Question Content (at least one required)
          </label>
          <textarea
            value={formData.questionText}
            onChange={(e) =>
              setFormData({ ...formData, questionText: e.target.value })
            }
            rows={6}
            className="w-full border border-gray-300 rounded-lg px-4 py-2"
            placeholder="Type your math question here..."
          />
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Image (optional)
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleFileUpload(file, "image")
              }}
              className="w-full border border-gray-300 rounded-lg px-4 py-2"
              disabled={uploading === "image"}
            />
            {uploading === "image" && (
              <p className="text-sm text-gray-500 mt-1">Uploading...</p>
            )}
            {formData.questionImage && (
              <div className="mt-2">
                <img
                  src={formData.questionImage}
                  alt="Question"
                  className="max-w-full h-32 object-contain rounded"
                />
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, questionImage: "" })}
                  className="text-sm text-red-600 mt-1"
                >
                  Remove
                </button>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Audio (optional)
            </label>
            <input
              type="file"
              accept="audio/*"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleFileUpload(file, "audio")
              }}
              className="w-full border border-gray-300 rounded-lg px-4 py-2"
              disabled={uploading === "audio"}
            />
            {uploading === "audio" && (
              <p className="text-sm text-gray-500 mt-1">Uploading...</p>
            )}
            {formData.questionAudio && (
              <div className="mt-2">
                <audio controls src={formData.questionAudio} className="w-full" />
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, questionAudio: "" })}
                  className="text-sm text-red-600 mt-1"
                >
                  Remove
                </button>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Video (optional)
            </label>
            <input
              type="file"
              accept="video/*"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleFileUpload(file, "video")
              }}
              className="w-full border border-gray-300 rounded-lg px-4 py-2"
              disabled={uploading === "video"}
            />
            {uploading === "video" && (
              <p className="text-sm text-gray-500 mt-1">Uploading...</p>
            )}
            {formData.questionVideo && (
              <div className="mt-2">
                <video controls src={formData.questionVideo} className="w-full h-32 rounded" />
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, questionVideo: "" })}
                  className="text-sm text-red-600 mt-1"
                >
                  Remove
                </button>
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Teacher (optional - leave empty for open marketplace)
          </label>
          {teachers.length === 0 ? (
            <div className="border border-yellow-200 bg-yellow-50 rounded-lg p-4 mb-2">
              <p className="text-sm text-yellow-800">
                No teachers available. You can still submit to the open marketplace, or run <code className="bg-yellow-100 px-1 rounded">npm run db:seed</code> to create teachers.
              </p>
            </div>
          ) : null}
          <select
            value={formData.teacherId}
            onChange={(e) =>
              setFormData({ ...formData, teacherId: e.target.value })
            }
            className="w-full border border-gray-300 rounded-lg px-4 py-2"
            disabled={teachers.length === 0}
          >
            <option value="">Open Marketplace (Any Teacher)</option>
            {teachers.map((teacher) => (
              <option key={teacher.id} value={teacher.id}>
                {teacher.name} ({teacher.uniqueId}) - {teacher.totalEndorsements} endorsements
              </option>
            ))}
          </select>
          <p className="text-sm text-gray-500 mt-1">
            Select a specific teacher or leave empty to post to the open marketplace
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Price (MYR) - Minimum: {PLATFORM_MIN_PRICE}
            </label>
            <input
              type="number"
              min={PLATFORM_MIN_PRICE}
              step="0.01"
              value={formData.price}
              onChange={(e) =>
                setFormData({ ...formData, price: parseFloat(e.target.value) })
              }
              className="w-full border border-gray-300 rounded-lg px-4 py-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Expected Response Time
            </label>
            <select
              value={formData.expectedResponseHours}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  expectedResponseHours: parseInt(e.target.value),
                })
              }
              className="w-full border border-gray-300 rounded-lg px-4 py-2"
            >
              <option value={6}>6 hours</option>
              <option value={24}>24 hours</option>
              <option value={72}>72 hours</option>
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || uploading !== null}
          className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Submitting..." : uploading ? `Uploading ${uploading}...` : "Submit Question"}
        </button>
      </form>
    </div>
  )
}
