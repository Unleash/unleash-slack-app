import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'

export async function GET() {
  const state = randomUUID()

  const redirectUrl = new URL('https://slack.com/oauth/v2/authorize')
  redirectUrl.searchParams.set('client_id', process.env.NEXT_PUBLIC_CLIENT_ID!)
  redirectUrl.searchParams.set('scope', process.env.NEXT_PUBLIC_SCOPE!)
  redirectUrl.searchParams.set('state', state)

  const response = NextResponse.redirect(redirectUrl.toString(), {
    status: 302
  })

  response.cookies.set('slack_oauth_state', state, {
    httpOnly: true,
    secure: true,
    maxAge: 300,
    path: '/',
    sameSite: 'lax'
  })

  return response
}
