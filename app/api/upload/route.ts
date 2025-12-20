// API: File Upload
// Handles image, audio, and video uploads
// For MVP, we'll store files in public/uploads (in production, use S3/Cloudinary)

import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { existsSync } from "fs"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get("file") as File
    const fileType = formData.get("type") as string // "image", "audio", "video"

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file type (more lenient)
    const allowedTypes: any = {
      image: ["image/jpeg", "image/png", "image/gif", "image/webp", "image/jpg"],
      audio: ["audio/mpeg", "audio/wav", "audio/mp3", "audio/ogg", "audio/mp4", "audio/x-m4a", "audio/m4a"],
      video: ["video/mp4", "video/webm", "video/ogg", "video/quicktime", "video/x-msvideo"],
    }

    if (!allowedTypes[fileType]) {
      return NextResponse.json(
        { error: `Invalid file type: ${fileType}` },
        { status: 400 }
      )
    }

    // Check if file type matches (case-insensitive, partial match)
    const fileTypeLower = file.type.toLowerCase()
    const isValidType = allowedTypes[fileType].some((allowedType: string) => 
      fileTypeLower.includes(allowedType.split("/")[1]) || 
      fileTypeLower === allowedType.toLowerCase()
    )

    // Also check file extension as fallback
    const fileExt = file.name.split(".").pop()?.toLowerCase()
    const commonFormats: any = {
      image: ["jpg", "jpeg", "png", "gif", "webp"],
      audio: ["mp3", "wav", "ogg", "m4a"],
      video: ["mp4", "webm", "mov", "avi"],
    }

    if (!isValidType && (!fileExt || !commonFormats[fileType]?.includes(fileExt))) {
      return NextResponse.json(
        { error: `Invalid file type for ${fileType}. Received: ${file.type}, File: ${file.name}` },
        { status: 400 }
      )
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File size exceeds 10MB limit" },
        { status: 400 }
      )
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), "public", "uploads", fileType)
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(2, 15)
    const ext = file.name.split(".").pop()
    const filename = `${timestamp}-${randomStr}.${ext}`
    const filepath = join(uploadsDir, filename)

    // Save file
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filepath, buffer)

    // Return public URL
    const url = `/uploads/${fileType}/${filename}`

    return NextResponse.json({ url })
  } catch (error: any) {
    console.error("Upload error:", error)
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    )
  }
}

