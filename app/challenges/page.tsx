"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { BackButton } from "@/components/BackButton"

interface Challenge {
  id: string
  title: string
  subject: string
  coinReward: number
  teacher: { name: string }
  _count: { attempts: number }
}

export default function ChallengesPage() {
  const { data: session } = useSession()
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchChallenges()
  }, [])

  const fetchChallenges = async () => {
    try {
      const res = await fetch("/api/challenges")
      if (res.ok) {
        const data = await res.json()
        setChallenges(data)
      } else {
        console.error("Failed to fetch challenges")
      }
    } catch (error) {
      console.error("Error fetching challenges:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="text-center py-12">Loading...</div>

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-4">
        <BackButton fallbackPath="/dashboard" />
      </div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Challenges</h1>
        {(session?.user as any)?.role === "TEACHER" && (
          <Link
            href="/challenges/create"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Create Challenge
          </Link>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {challenges.map((challenge) => (
          <Link key={challenge.id} href={`/challenges/${challenge.id}`} className="uec-card p-6 transform hover:scale-105 transition-transform">
            <h2 className="text-xl font-semibold mb-2 text-yellow-600">{challenge.title}</h2>
            <p className="text-sm text-gray-500 mb-2">{challenge.subject}</p>
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm font-semibold text-yellow-600">
                🪙 Reward: {challenge.coinReward} coins
              </span>
              <span className="text-sm text-gray-500">
                by {challenge.teacher.name}
              </span>
            </div>
            <div className="text-center px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 font-semibold">
              Attempt Challenge →
            </div>
          </Link>
        ))}
      </div>

      {challenges.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No challenges available yet.
        </div>
      )}
    </div>
  )
}

