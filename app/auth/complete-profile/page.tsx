"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"

export default function CompleteProfilePage() {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const userId = searchParams.get("userId") // Get ID passed from Signup page

const handleUpload = async () => {
    if (!file || !userId) return
    setLoading(true)

    try {
      // 1. Upload file to storage
      const formData = new FormData()
      formData.append("file", file)
      formData.append("type", "image") // This matches your API expectation

      console.log("📤 Sending upload request...") // DEBUG

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })
      
      const uploadData = await uploadRes.json()
      
      // 🔍 CRITICAL DEBUG: Look at this line in your Browser Console (F12)
      console.log("📥 Upload API Response:", uploadData) 

      // Support BOTH versions (The old one you had, and the new code you just shared)
      // If code returns "url", use it directly.
      // If code returns "fileName", manually add the folder path.
      let finalAvatarUrl = ""

      if (uploadData.url) {
        finalAvatarUrl = uploadData.url
      } else if (uploadData.fileName) {
        finalAvatarUrl = `/uploads/image/${uploadData.fileName}`
      }

      if (finalAvatarUrl) {
        console.log("💾 Saving to database:", finalAvatarUrl) // DEBUG

        // 2. Update user in database
        const updateRes = await fetch("/api/auth/update-avatar", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            userId: userId, 
            avatarUrl: finalAvatarUrl 
          }),
        })

        if (updateRes.ok) {
           console.log("✅ Database updated successfully!")
           // 3. Done! Go to Sign In
           router.push("/auth/signin")
        } else {
           console.error("❌ Database update failed")
           alert("Failed to save profile picture.")
        }

      } else {
        console.error("❌ No URL found in response. Check the logs.")
        alert("Upload failed. Server didn't return a file URL.")
      }
      
    } catch (error) {
      console.error("🔥 Error:", error)
      alert("Something went wrong, please try signing in.")
    } finally {
      setLoading(false)
    }
  }

  if (!userId) {
    return <div className="p-8 text-center">Invalid request. <Link href="/auth/signin">Go to Sign In</Link></div>
  }

  return (
    <div className="max-w-md mx-auto mt-20 px-4">
      <div className="uec-card p-8 text-center">
        <h1 className="text-2xl font-bold mb-2 text-red-600">Welcome! 🎉</h1>
        <p className="text-gray-600 mb-8">Your account has been created.</p>
        
        <div className="mb-8">
          <p className="font-medium text-gray-900 mb-4">Upload a profile picture?</p>
          
          <div className="flex items-center justify-center w-full">
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                 {file ? (
                   <p className="text-sm text-green-600 font-semibold">{file.name}</p>
                 ) : (
                   <>
                    <svg className="w-8 h-8 mb-4 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                    </svg>
                    <p className="text-sm text-gray-500"><span className="font-semibold">Click to upload</span></p>
                   </>
                 )}
              </div>
              <input type="file" className="hidden" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            </label>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleUpload}
            disabled={!file || loading}
            className={`w-full py-2 px-4 rounded-md text-white font-medium ${!file ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'}`}
          >
            {loading ? "Uploading..." : "Save & Continue"}
          </button>
          
          <Link href="/auth/signin" className="block w-full py-2 px-4 text-sm text-gray-500 hover:text-gray-700">
            Skip for now
          </Link>
        </div>
      </div>
    </div>
  )
}