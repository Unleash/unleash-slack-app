import type { NextRequest } from 'next/server'
import { brokerDeps } from './config'
import { startConnection } from './flow'

export const dynamic = 'force-dynamic'

export const GET = (request: NextRequest) =>
  startConnection(request, brokerDeps())
