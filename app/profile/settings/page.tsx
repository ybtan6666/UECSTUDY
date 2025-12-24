"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function ProfileSettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  // State
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)

  // Fetch current user data
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
    } else if (session) {
      fetchUserData()
    }
  }, [session, status])

  const fetchUserData = async () => {
    try {
      const res = await fetch("/api/profile")
      if (res.ok) {
        const data = await res.json()
        setUser(data.user)
      }
    } catch (error) {
      console.error("Error fetching profile:", error)
    } finally {
      setLoading(false)
    }
  }

 // 📸 HANDLE IMAGE UPLOAD (DEBUG VERSION)
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    // 🔍 DEBUG 1: Check if we have the User ID
    console.log("👤 Current User Data:", user)
    if (!user.id) {
      alert("Error: User ID is missing! Cannot update database.")
      console.error("❌ User ID is undefined. Check /api/profile response.")
      return
    }

    setUploading(true)

    try {
      // 1. Upload File
      console.log("📤 Uploading file...")
      const formData = new FormData()
      formData.append("file", file)
      formData.append("type", "image")

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })
      
      const uploadData = await uploadRes.json()
      console.log("✅ Upload Response:", uploadData)
      
      // 2. Determine URL
      let finalUrl = ""
      if (uploadData.url) {
        finalUrl = uploadData.url
      } else if (uploadData.fileName) {
        finalUrl = `/uploads/image/${uploadData.fileName}`
      }
      
      console.log("🔗 Final URL to save:", finalUrl)

      if (finalUrl) {
        // 3. Update Database
        console.log("💾 Sending update to database...")
        const updateRes = await fetch("/api/auth/update-avatar", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            userId: user.id, 
            avatarUrl: finalUrl 
          }),
        })

        const updateJson = await updateRes.json()
        console.log("📝 Database Update Response:", updateJson)

        if (updateRes.ok) {
           setUser({ ...user, avatar: finalUrl })
           window.dispatchEvent(new Event("profile-updated"))
           alert("Success! Image updated.")
           router.refresh()
        } else {
           alert("Database update failed: " + (updateJson.error || "Unknown error"))
        }
      } 

    } catch (error) {
      console.error("🔥 Error updating avatar:", error)
      alert("Something went wrong.")
    } finally {
      setUploading(false)
    }
  }
  if (loading) return <div className="p-8 text-center">Loading settings...</div>

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Back Button */}
      <div className="mb-6">
        <Link href="/profile" className="text-gray-500 hover:text-gray-900 flex items-center">
          ← Back to Profile
        </Link>
      </div>

      <h1 className="text-3xl font-bold text-gray-900 mb-8">Edit Profile</h1>

      {/* 🟢 SECTION 1: Profile Picture */}
      <div className="uec-card p-8 mb-8 flex items-start space-x-8">
        <div className="flex-shrink-0">
            <div className="relative group">
                {/* Image Display */}
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-gray-100 relative">
                    {user?.avatar ? (
                    <img 
                        src={user.avatar} 
                        alt="Profile" 
                        className="w-full h-full object-cover"
                    />
                    ) : (
                    <div className="w-full h-full bg-purple-600 flex items-center justify-center text-white text-3xl font-bold">
                        {user?.name?.charAt(0) || "U"}
                    </div>
                    )}
                    
                    {/* Uploading Spinner Overlay */}
                    {uploading && (
                      <div className="absolute inset-0 bg-white bg-opacity-70 flex items-center justify-center">
                        <span className="text-xs font-bold text-gray-800">...</span>
                      </div>
                    )}
                </div>

                {/* Hover Overlay for Upload */}
                <label className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                    <span className="text-white text-sm font-medium">Change</span>
                    <input 
                        type="file" 
                        className="hidden" 
                        accept="image/*"
                        onChange={handleFileChange}
                        disabled={uploading}
                    />
                </label>
            </div>
        </div>

        <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-900">Profile Picture</h2>
            <p className="text-gray-500 mb-4">Click the image to upload a new photo. JPG, GIF or PNG.</p>
        </div>
      </div>

      {/* 🟡 SECTION 2: Basic Info (Read Only) */}
      <div className="uec-card p-8 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Personal Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input 
                    type="text" 
                    value={user?.name || ""} 
                    disabled 
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-500 cursor-not-allowed"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <input 
                    type="email" 
                    value={user?.email || ""} 
                    disabled 
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-500 cursor-not-allowed"
                />
            </div>
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <input 
                    type="text" 
                    value={user?.role || ""} 
                    disabled 
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-500 cursor-not-allowed"
                />
            </div>
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">User ID</label>
                <input 
                    type="text" 
                    value={user?.uniqueId || ""} 
                    disabled 
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-500 cursor-not-allowed"
                />
            </div>
        </div>
      </div>
    </div>
  )
}