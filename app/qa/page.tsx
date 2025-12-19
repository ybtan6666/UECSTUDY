"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"

interface PaidQuestion {
  id: string
  question: string
  price: number
  deadline: string
  answeredAt: string | null
  isRefundable: boolean
  student: { name: string }
  teacher: { name: string }
  course: { title: string } | null
}

export default function QAPage() {
  const { data: session } = useSession()
  const [questions, setQuestions] = useState<PaidQuestion[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMode, setSelectedMode] = useState<"A" | "B" | null>(null)

  useEffect(() => {
    fetchQuestions()
  }, [])

  const fetchQuestions = async () => {
    try {
      const res = await fetch("/api/qa/questions")
      if (res.ok) {
        const data = await res.json()
        setQuestions(data)
      }
    } catch (error) {
      console.error("Error fetching questions:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="text-center py-12">Loading...</div>

  const userRole = (session?.user as any)?.role

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-4xl font-bold mb-8 text-center text-red-600">
        问答系统 Q&A System
      </h1>

      {userRole === "STUDENT" && (
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Module A */}
          <div className="uec-card p-8 text-center transform hover:scale-105 transition-transform cursor-pointer" onClick={() => setSelectedMode("A")}>
            <div className="text-6xl mb-4">💬</div>
            <h2 className="text-2xl font-bold mb-2 text-blue-600">模式 A: 付费问答</h2>
            <h3 className="text-xl font-semibold mb-4 text-gray-700">Module A: Paid Questions</h3>
            <p className="text-gray-600 mb-6">
              选择教师提问，7天内保证回复。如果未回复，可申请退款。
              <br />
              Choose teachers to ask questions. Guaranteed response within 7 days. Refund if no response.
            </p>
            <Link
              href="/qa/ask"
              className="inline-block px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold text-lg"
            >
              开始提问 Start Asking →
            </Link>
          </div>

          {/* Module B */}
          <div className="uec-card p-8 text-center transform hover:scale-105 transition-transform cursor-pointer" onClick={() => setSelectedMode("B")}>
            <div className="text-6xl mb-4">📅</div>
            <h2 className="text-2xl font-bold mb-2 text-green-600">模式 B: 预订时间</h2>
            <h3 className="text-xl font-semibold mb-4 text-gray-700">Module B: Book Time</h3>
            <p className="text-gray-600 mb-6">
              预订教师的空闲时间进行咨询。可以是个人或小组会议。
              <br />
              Book available time slots with teachers. Individual or group sessions available.
            </p>
            <Link
              href="/qa/book"
              className="inline-block px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold text-lg"
            >
              查看时间表 View Slots →
            </Link>
          </div>
        </div>
      )}

      {userRole === "TEACHER" && (
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="uec-card p-8">
            <h2 className="text-2xl font-bold mb-4 text-blue-600">回答的问题</h2>
            <h3 className="text-xl font-semibold mb-4 text-gray-700">Answer Questions</h3>
            <p className="text-gray-600 mb-6">
              查看学生提出的付费问题并回答。
            </p>
            <Link
              href="/qa/questions"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              查看问题 View Questions
            </Link>
          </div>

          <div className="uec-card p-8">
            <h2 className="text-2xl font-bold mb-4 text-green-600">管理时间表</h2>
            <h3 className="text-xl font-semibold mb-4 text-gray-700">Manage Time Slots</h3>
            <p className="text-gray-600 mb-6">
              设置可预订的时间段供学生选择。
            </p>
            <Link
              href="/qa/slots"
              className="inline-block px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              管理时间表 Manage Slots
            </Link>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Questions</h2>
        {questions.map((q) => (
          <div key={q.id} className="uec-card p-6">
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1">
                <p className="font-semibold mb-1">{q.question}</p>
                <p className="text-sm text-gray-600">
                  Student: {q.student.name} • Teacher: {q.teacher.name}
                  {q.course && ` • Course: ${q.course.title}`}
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-blue-600">RM {q.price.toFixed(2)}</p>
                {!q.answeredAt && (
                  <p className="text-sm text-red-600">
                    {q.isRefundable ? "Refundable" : "Pending"}
                  </p>
                )}
              </div>
            </div>
            <Link
              href={`/qa/questions/${q.id}`}
              className="text-blue-600 hover:underline text-sm"
            >
              View Details →
            </Link>
          </div>
        ))}
      </div>

      {questions.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No questions yet.
        </div>
      )}
    </div>
  )
}

