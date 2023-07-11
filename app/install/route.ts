import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.redirect(
    `https://slack.com/oauth/v2/authorize?client_id=${process.env.NEXT_PUBLIC_CLIENT_ID}&scope=${process.env.NEXT_PUBLIC_SCOPE}`
  )
}
