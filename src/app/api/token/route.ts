import { auth } from '@/auth'
import { NextResponse } from 'next/server'

// Server-side token endpoint — uses auth() which reads the full encrypted JWT.
// The /api/auth/session client endpoint in NextAuth v5 beta does not reliably
// expose custom fields added to session.user, so we use this instead.
export async function GET() {
  const session = await auth()
  const accessToken = (session?.user as Record<string, unknown>)?.accessToken as string | undefined
  if (!accessToken) return NextResponse.json({ accessToken: null }, { status: 200 })
  return NextResponse.json({ accessToken })
}
