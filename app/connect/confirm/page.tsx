import { cookies } from 'next/headers'
import { readConfig } from '../config'
import { PENDING_COOKIE, decodePending } from '../pending'
import { Confirmation } from './Confirmation'

export const dynamic = 'force-dynamic'

export default async function Confirm() {
  const pending = decodePending(
    (await cookies()).get(PENDING_COOKIE)?.value,
    readConfig(process.env)
  )

  return <Confirmation pending={pending} />
}
