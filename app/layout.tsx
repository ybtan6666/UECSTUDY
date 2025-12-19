import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/components/AuthProvider"
import { Navbar } from "@/components/Navbar"
import { SessionDebug } from "@/components/SessionDebug"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "UEC Learning Platform",
  description: "Pay for teacher attention, not just content",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <Navbar />
          <main className="min-h-screen">{children}</main>
          <SessionDebug />
        </AuthProvider>
      </body>
    </html>
  )
}

