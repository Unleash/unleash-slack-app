import Image from 'next/image'
import { ContinueLink } from '../../components/ContinueLink'
import { START_AGAIN } from '../error-page'
import type { PendingConnect } from '../pending'

interface IConfirmationProps {
  pending?: PendingConnect
}

export const Confirmation = ({ pending }: IConfirmationProps) => {
  const destination = pending && new URL(pending.returnTo)

  return (
    <main className='flex flex-col min-h-screen items-center px-4 py-16'>
      <div className='max-w-xl w-full bg-unleash-secondary text-white p-8 rounded-2xl drop-shadow-md flex flex-col gap-5'>
        <Image src='/unleash_logo.svg' alt='Unleash' width={56} height={56} />
        {pending && destination ? (
          <>
            <h1 className='text-2xl font-bold'>Connect Slack to this Unleash?</h1>
            <p className='text-gray-300'>
              After you allow the app in Slack, its access to your workspace
              goes to the Unleash instance at:
            </p>
            {/* The whole address: Cloud instances share a host and differ by path. */}
            <p className='font-mono text-2xl font-bold break-all bg-slate-800 rounded-md p-3'>
              {destination.host}
              {destination.pathname !== '/' && destination.pathname}
            </p>
            <p className='text-gray-300 text-sm'>
              Unleash has not verified this address. Continue only if it is
              your organization&apos;s Unleash and you started this from its
              Integrations page.
            </p>
            <div className='flex gap-3 flex-wrap'>
              <ContinueLink
                href={`/connect/continue?confirm=${encodeURIComponent(pending.confirmToken)}`}
              />
              <a
                href={`${pending.returnTo}/integrations`}
                className='border border-gray-400 px-5 py-2 rounded-md'
              >
                Cancel
              </a>
            </div>
          </>
        ) : (
          <>
            <h1 className='text-2xl font-bold'>This connection has expired</h1>
            <p className='text-gray-300'>{START_AGAIN}</p>
          </>
        )}
      </div>
    </main>
  )
}
