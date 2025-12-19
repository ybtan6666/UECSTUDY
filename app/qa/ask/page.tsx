"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"

interface Course {
  id: string
  title: string
}

export default function AskQuestionPage() {
  const [question, setQuestion] = useState("")
  const [selectedTeachers, setSelectedTeachers] = useState<string[]>([])
  const [courseId, setCourseId] = useState("")
  const [price, setPrice] = useState("")
  const [teachers, setTeachers] = useState<any[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { data: session } = useSession()

  useEffect(() => {
    fetchTeachers()
    fetchCourses()
  }, [])

  const fetchTeachers = async () => {
    const res = await fetch("/api/users?role=TEACHER")
    const data = await res.json()
    setTeachers(data)
  }

  const fetchCourses = async () => {
    const res = await fetch("/api/courses")
    const data = await res.json()
    setCourses(data)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (selectedTeachers.length === 0) {
      alert("Please select at least one teacher")
      return
    }

    setLoading(true)

    // Create question for each selected teacher
    const promises = selectedTeachers.map(teacherId =>
      fetch("/api/qa/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          teacherId,
          courseId: courseId || null,
          price: parseFloat(price),
        }),
      })
    )

    try {
      const results = await Promise.all(promises)
      const allOk = results.every(res => res.ok)
      
      if (allOk) {
        alert(`Question posted to ${selectedTeachers.length} teacher(s)!`)
        router.push("/qa")
      } else {
        alert("Some questions failed to post")
      }
    } catch (error) {
      alert("Failed to post questions")
    } finally {
      setLoading(false)
    }
  }

  if ((session?.user as any)?.role !== "STUDENT") {
    return <div className="text-center py-12">Unauthorized</div>
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Ask a Paid Question</h1>
      <div className="bg-blue-50 p-4 rounded-lg mb-6">
        <p className="text-sm text-gray-700">
          <strong>Mode A:</strong> Pay to ask a question. The teacher must respond within 7 days.
          If no response, you'll be eligible for a refund.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Teacher(s) * (You can select multiple)
          </label>
          <div className="space-y-2 max-h-60 overflow-y-auto border border-gray-300 rounded-md p-3">
            {teachers.map((t) => (
              <label key={t.id} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                <input
                  type="checkbox"
                  checked={selectedTeachers.includes(t.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedTeachers([...selectedTeachers, t.id])
                    } else {
                      setSelectedTeachers(selectedTeachers.filter(id => id !== t.id))
                    }
                  }}
                  className="w-4 h-4"
                />
                <span>{t.name} {t.uniqueId && `(${t.uniqueId})`}</span>
              </label>
            ))}
          </div>
          {selectedTeachers.length === 0 && (
            <p className="text-red-500 text-sm mt-1">Please select at least one teacher</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Related Course (optional)
          </label>
          <select
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="">None</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Your Question *
          </label>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            required
            rows={6}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="Ask your question here..."
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Price (RM) *
          </label>
          <input
            type="number"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
            min="0.01"
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Posting..." : "Post Question & Pay"}
        </button>
      </form>
    </div>
  )
}

