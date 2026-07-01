import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import Credentials from 'next-auth/providers/credentials'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          const res = await fetch(`${API}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials),
          })
          if (!res.ok) return null
          const { user, token } = await res.json()
          return { ...user, id: user._id, accessToken: token }
        } catch {
          return null
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.accessToken = (user as Record<string, unknown>).accessToken as string
        token.userId = user.id
      }
      if (account?.provider === 'google' && account.id_token) {
        try {
          const res = await fetch(`${API}/auth/google`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: account.id_token }),
          })
          if (res.ok) {
            const { user: dbUser, token: accessToken } = await res.json()
            token.accessToken = accessToken
            token.userId = dbUser._id
          }
        } catch { /* continue with existing token */ }
      }
      return token
    },
    async session({ session, token }) {
      session.user.id = token.userId as string
      ;(session as unknown as Record<string, unknown>).accessToken = token.accessToken
      return session
    },
  },
  pages: { signIn: '/login', error: '/login' },
  secret: process.env.NEXTAUTH_SECRET,
})
