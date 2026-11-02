import type { NextRequest } from 'next/server'
import { brokerDeps } from '../connect/config'
import { finishConnection } from '../connect/flow'

export const dynamic = 'force-dynamic'

export const GET = (request: NextRequest) =>
  finishConnection(request, brokerDeps())
