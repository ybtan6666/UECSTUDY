"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"

export default function CreateChallengePage() {
  const [title, setTitle] = useState("")
  const [subject, setSubject] = useState("")
  const [coinReward, setCoinReward] = useState("10")
  const [questions, setQuestions] = useState([
    { question: "", optionA: "", optionB: "", optionC: "", optionD: "", correctAnswer: "A" },
  ])
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { data: session } = useSession()

  if ((session?.user as any)?.role !== "TEACHER") {
    return <div className="text-center py-12">Unauthorized</div>
  }

  const addQuestion = () => {
    setQuestions([
      ...questions,
      { question: "", optionA: "", optionB: "", optionC: "", optionD: "", correctAnswer: "A" },
    ])
  }

  const updateQuestion = (index: number, field: string, value: string) => {
    const updated = [...questions]
    updated[index] = { ...updated[index], [field]: value }
    setQuestions(updated)
  }

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const res = await fetch("/api/challenges", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        subject,
        coinReward: parseInt(coinReward),
        questions: questions.filter((q) => q.question.trim()),
      }),
    })

    if (res.ok) {
      router.push("/challenges")
    } else {
      alert("Failed to create challenge")
    }
    setLoading(false)
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Create Challenge</h1>
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Title *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Subject *
          </label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Coin Reward *
          </label>
          <input
            type="number"
            value={coinReward}
            onChange={(e) => setCoinReward(e.target.value)}
            required
            min="1"
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Questions</h2>
            <button
              type="button"
              onClick={addQuestion}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Add Question
            </button>
          </div>

          {questions.map((q, index) => (
            <div key={index} className="border p-4 rounded-lg mb-4">
              <div className="flex justify-between mb-2">
                <span className="font-semibold">Question {index + 1}</span>
                {questions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeQuestion(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Remove
                  </button>
                )}
              </div>
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Question text"
                  value={q.question}
                  onChange={(e) => updateQuestion(index, "question", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Option A"
                    value={q.optionA}
                    onChange={(e) => updateQuestion(index, "optionA", e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md"
                  />
                  <input
                    type="text"
                    placeholder="Option B"
                    value={q.optionB}
                    onChange={(e) => updateQuestion(index, "optionB", e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md"
                  />
                  <input
                    type="text"
                    placeholder="Option C"
                    value={q.optionC}
                    onChange={(e) => updateQuestion(index, "optionC", e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md"
                  />
                  <input
                    type="text"
                    placeholder="Option D"
                    value={q.optionD}
                    onChange={(e) => updateQuestion(index, "optionD", e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <select
                  value={q.correctAnswer}
                  onChange={(e) => updateQuestion(index, "correctAnswer", e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                  <option value="D">D</option>
                </select>
              </div>
            </div>
          ))}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Creating..." : "Create Challenge"}
        </button>
      </form>
    </div>
  )
}

