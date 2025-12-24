"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { BackButton } from "@/components/BackButton"

interface Course {
  id: string
  title: string
  subject: string
  description: string
  price: number
  teacher: { name: string }
  _count: { purchases: number }
}

export default function CoursesPage() {
  const { data: session } = useSession()
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCourses()
  }, [])

  const fetchCourses = async () => {
    try {
      const res = await fetch("/api/courses")
      if (res.ok) {
        const data = await res.json()
        setCourses(data)
      } else {
        console.error("Failed to fetch courses")
      }
    } catch (error) {
      console.error("Error fetching courses:", error)
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
        <h1 className="text-3xl font-bold">Courses</h1>
        {(session?.user as any)?.role === "TEACHER" && (
          <Link
            href="/courses/create"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Create Course
          </Link>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {courses.map((course) => (
          <Link key={course.id} href={`/courses/${course.id}`} className="uec-card p-6 transform hover:scale-105 transition-transform">
            <h2 className="text-xl font-semibold mb-2 text-red-600">{course.title}</h2>
            <p className="text-sm text-gray-500 mb-2">{course.subject}</p>
            <p className="text-gray-600 mb-4 line-clamp-3">{course.description}</p>
            <div className="flex justify-between items-center mb-4">
              <span className="text-lg font-bold text-red-600">
                RM {course.price.toFixed(2)}
              </span>
              <span className="text-sm text-gray-500">
                by {course.teacher.name}
              </span>
            </div>
            <div className="text-center px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
              View Details →
            </div>
          </Link>
        ))}
      </div>

      {courses.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No courses available yet.
        </div>
      )}
    </div>
  )
}

