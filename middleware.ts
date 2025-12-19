import { withAuth } from "next-auth/middleware"

export default withAuth({
  pages: {
    signIn: "/auth/signin",
  },
})

export const config = {
  matcher: [
    "/courses/create/:path*",
    "/challenges/create/:path*",
    "/qa/:path*",
    "/profile/:path*",
  ],
}

