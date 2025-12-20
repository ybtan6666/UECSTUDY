import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "./prisma"
import bcrypt from "bcryptjs"

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.log("[AUTH] Missing credentials")
          return null
        }

        try {
          console.log("[AUTH] Attempting to authenticate:", credentials.email)
          
          // Ensure database connection
          await prisma.$connect()
          console.log("[AUTH] Database connected")

          // First, list all users to debug
          const allUsers = await prisma.user.findMany({
            select: { email: true }
          })
          console.log("[AUTH] Total users in DB:", allUsers.length)
          console.log("[AUTH] User emails:", allUsers.map(u => u.email))

          const user = await prisma.user.findUnique({
            where: { email: credentials.email }
          })

          if (!user) {
            console.log("[AUTH] User not found:", credentials.email)
            // List all users for debugging
            const allUsers = await prisma.user.findMany({
              select: { email: true, role: true }
            })
            console.log("[AUTH] Available users in database:", allUsers)
            return null
          }

          console.log("[AUTH] User found:", user.email, "Role:", user.role)

          const isValid = await bcrypt.compare(credentials.password, user.password)

          if (!isValid) {
            console.log("[AUTH] Invalid password for:", credentials.email)
            return null
          }

          console.log("[AUTH] ✓ Authentication successful for:", user.email)
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          }
        } catch (error: any) {
          console.error("[AUTH] ✗ Error:", error.message)
          console.error("[AUTH] Stack:", error.stack)
          return null
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role
        token.email = user.email
        token.name = user.name
      }
      return token
    },
    async session({ session, token }) {
      if (session.user && token) {
        (session.user as any).id = token.id as string
        (session.user as any).role = token.role as string
        session.user.email = (token.email as string) || session.user.email
        session.user.name = (token.name as string) || session.user.name
      }
      return session
    }
  },
  pages: {
    signIn: "/auth/signin",
  },
  session: {
    strategy: "jwt",
  },
}

