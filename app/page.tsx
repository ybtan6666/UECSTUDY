"use client"

import Link from "next/link"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function Home() {
  const { data: session } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (session) {
      router.push("/dashboard")
    }
  }, [session, router])

  if (session) {
    return <div className="text-center py-12">Redirecting to dashboard...</div>
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-16">
        <div className="mb-6">
          <h1 className="text-6xl font-bold text-red-600 mb-2">
            独中统考
          </h1>
          <h2 className="text-5xl font-bold text-yellow-500 mb-4">
            UEC Learning Platform
          </h2>
        </div>
        <p className="text-2xl text-gray-700 mb-4 font-semibold">
          为教师关注付费，而不仅仅是内容
        </p>
        <p className="text-xl text-gray-600 mb-8">
          Pay for teacher attention, not just content
        </p>
        <div className="flex justify-center space-x-4 mt-6">
          <div className="w-16 h-1 bg-red-600"></div>
          <div className="w-16 h-1 bg-yellow-500"></div>
          <div className="w-16 h-1 bg-blue-600"></div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8 mb-16">
        <div className="uec-card p-6 transform hover:scale-105 transition-transform">
          <div className="text-4xl mb-4">📚</div>
          <h2 className="text-2xl font-semibold mb-2 text-red-600">购买课程</h2>
          <h3 className="text-xl font-semibold mb-4 text-gray-700">Buy Courses</h3>
          <p className="text-gray-600 mb-4">
            访问由经验丰富的教师创建的全面课程。按照自己的节奏学习视频内容和材料。
          </p>
          <Link href="/courses" className="inline-block px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold transition-colors">
            浏览课程 →
          </Link>
        </div>

        <div className="uec-card p-6 transform hover:scale-105 transition-transform">
          <div className="text-4xl mb-4">🎯</div>
          <h2 className="text-2xl font-semibold mb-2 text-yellow-600">尝试挑战</h2>
          <h3 className="text-xl font-semibold mb-4 text-gray-700">Try Challenges</h3>
          <p className="text-gray-600 mb-4">
            通过多选题挑战测试您的知识。完成挑战并获得虚拟金币，提高您的技能。
          </p>
          <Link href="/challenges" className="inline-block px-6 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 font-semibold transition-colors">
            查看挑战 →
          </Link>
        </div>

        <div className="uec-card p-6 transform hover:scale-105 transition-transform">
          <div className="text-4xl mb-4">💬</div>
          <h2 className="text-2xl font-semibold mb-2 text-blue-600">付费问答</h2>
          <h3 className="text-xl font-semibold mb-4 text-gray-700">Pay Teachers</h3>
          <p className="text-gray-600 mb-4">
            获得个性化帮助！付费让教师回答您的问题或预订一对一咨询课程。
          </p>
          <Link href="/qa" className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-colors">
            提问 →
          </Link>
        </div>
      </div>

      <div className="bg-gradient-to-r from-red-50 to-yellow-50 p-8 rounded-lg mb-12 border-4 border-red-200">
        <h2 className="text-3xl font-semibold mb-2 text-center text-red-600">
          两种获得教师帮助的方式
        </h2>
        <h3 className="text-2xl font-semibold mb-6 text-center text-gray-700">
          Two Ways to Get Teacher Help
        </h3>
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-xl font-semibold mb-3">
              Mode A: Paid Questions with Response Guarantee
            </h3>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>Pay to ask a question</li>
              <li>Teacher must respond within 7 days</li>
              <li>Automatic refund if no response</li>
              <li>Thread-style conversation</li>
            </ul>
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-3">
              Mode B: Book Teacher Time
            </h3>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>Book available time slots</li>
              <li>One-on-one or group sessions</li>
              <li>Zoom integration</li>
              <li>Consultancy-style learning</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="text-center space-x-4">
        <Link
          href="/auth/signup?role=student"
          className="inline-block px-8 py-4 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg font-bold text-lg hover:from-red-700 hover:to-red-800 shadow-lg transform hover:scale-105 transition-all"
        >
          学生注册 Sign Up as Student
        </Link>
        <Link
          href="/auth/signup?role=teacher"
          className="inline-block px-8 py-4 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-lg font-bold text-lg hover:from-yellow-600 hover:to-yellow-700 shadow-lg transform hover:scale-105 transition-all"
        >
          教师注册 Sign Up as Teacher
        </Link>
      </div>
    </div>
  )
}

