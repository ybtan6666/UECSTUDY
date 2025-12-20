// One-time setup route for production
// Call this ONCE after deployment to set up database
// DELETE THIS FILE after setup is complete!

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  // Simple auth check - change this password!
  const authHeader = req.headers.get("authorization")
  if (authHeader !== "Bearer setup-secret-change-me") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Check if database is accessible
    await prisma.$connect()
    
    // Check if users exist
    const userCount = await prisma.user.count()
    
    if (userCount === 0) {
      // Run seed
      const { exec } = require("child_process")
      exec("npm run db:seed", (error: any, stdout: any, stderr: any) => {
        if (error) {
          console.error(`Error: ${error}`)
          return
        }
        console.log(`stdout: ${stdout}`)
        console.error(`stderr: ${stderr}`)
      })
      
      return NextResponse.json({ 
        message: "Database setup initiated. Check logs.",
        userCount 
      })
    }
    
    return NextResponse.json({ 
      message: "Database already has data",
      userCount 
    })
  } catch (error: any) {
    return NextResponse.json({ 
      error: "Database setup failed",
      message: error.message 
    }, { status: 500 })
  }
}

