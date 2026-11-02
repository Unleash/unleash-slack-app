import type { NextRequest } from 'next/server'
import { brokerDeps } from '../config'
import { continueToSlack } from '../flow'

export const dynamic = 'force-dynamic'

export const GET = (request: NextRequest) =>
  continueToSlack(request, brokerDeps())
