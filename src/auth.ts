import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import Credentials from 'next-auth/providers/credentials'

// Server-only: used in NextAuth callbacks (never sent to browser)
const API = process.env.BACKEND_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

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
          console.log('[auth] authorize: calling', `${API}/auth/login`)
          const res = await fetch(`${API}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials),
          })
          console.log('[auth] authorize: status', res.status)
          if (!res.ok) return null
          const { user, token } = await res.json()
          console.log('[auth] authorize: got user._id =', user?._id, 'token present:', !!token)
          return { ...user, id: user._id, accessToken: token }
        } catch (e) {
          console.error('[auth] authorize error:', e)
          return null
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        const accessToken = (user as Record<string, unknown>).accessToken as string
        console.log('[auth] jwt callback (sign-in): accessToken present:', !!accessToken)
        token.accessToken = accessToken
        token.userId = user.id
      }
      if (account?.provider === 'google' && account.id_token) {
        try {
          console.log('[auth] jwt callback (google): calling', `${API}/auth/google`)
          const res = await fetch(`${API}/auth/google`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: account.id_token }),
          })
          console.log('[auth] google auth status:', res.status)
          if (res.ok) {
            const { user: dbUser, token: accessToken } = await res.json()
            console.log('[auth] google: got dbUser._id =', dbUser?._id, 'token present:', !!accessToken)
            token.accessToken = accessToken
            token.userId = dbUser._id
          }
        } catch (e) {
          console.error('[auth] google auth error:', e)
        }
      }
      console.log('[auth] jwt returning: token.accessToken present:', !!token.accessToken)
      return token
    },
    async session({ session, token }) {
      session.user.id = token.userId as string
      ;(session.user as unknown as Record<string, unknown>).accessToken = token.accessToken
      console.log('[auth] session callback: token.accessToken present:', !!token.accessToken,
        '| session.user.accessToken set:', !!(session.user as unknown as Record<string, unknown>).accessToken)
      return session
    },
  },
  pages: { signIn: '/login', error: '/login' },
  secret: process.env.NEXTAUTH_SECRET,
})
