import { auth } from '@/auth'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const session = await auth()
    console.log('[/api/token] session:', JSON.stringify(session, null, 2))

    if (!session) {
      console.log('[/api/token] NO SESSION — user not authenticated')
      return NextResponse.json({ accessToken: null, debug: 'no_session' }, { status: 200 })
    }

    const user = session.user as unknown as Record<string, unknown>
    const accessToken = user?.accessToken as string | undefined
    console.log('[/api/token] session.user keys:', Object.keys(user ?? {}))
    console.log('[/api/token] accessToken present:', !!accessToken)

    return NextResponse.json({ accessToken: accessToken ?? null })
  } catch (err) {
    console.error('[/api/token] error:', err)
    return NextResponse.json({ accessToken: null, debug: String(err) }, { status: 200 })
  }
}
