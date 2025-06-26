import { cookies } from 'next/headers'
import Image from 'next/image'
import Link from 'next/link'
import { Guide } from './components/Guide'
import { Install } from './components/Install'

const getAccessToken = async (code: string): Promise<string | undefined> => {
  const res = await fetch('https://slack.com/api/oauth.v2.access', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: `client_id=${process.env.NEXT_PUBLIC_CLIENT_ID}&client_secret=${process.env.CLIENT_SECRET}&code=${code}`
  })
  const { access_token } = await res.json()
  return access_token
}

const validateState = (
  storedState: string | undefined,
  state: string | undefined
) => {
  if (!storedState || !state || state !== storedState) {
    throw new Error('Invalid state parameter')
  }
}

export default async function Home({
  searchParams: { code, state }
}: {
  searchParams: {
    code?: string
    state?: string
  }
}) {
  let error, access_token
  const cookieStore = cookies()
  const storedState = cookieStore.get('slack_oauth_state')?.value

  if (code) {
    try {
      validateState(storedState, state)
      access_token = await getAccessToken(code)
    } catch (e) {
      console.error(`An error occurred: ${e}`)
      error = 'An error occurred. Please try again later.'
    }
  }

  return (
    <main className='flex flex-col min-h-screen bg-unleash-background'>
      <header className='w-full p-4 flex justify-between items-center'>
        <Link href='https://www.getunleash.io/' target='_blank'>
          <Image
            src='/unleash_pos.svg'
            alt='Unleash Logo'
            width={150}
            height={60}
          />
        </Link>
      </header>

      <section className='flex-1 flex flex-col items-center justify-center px-4 py-16'>
        {error && (
          <div className='p-4 bg-red-500 text-white rounded-md mb-4'>
            {error}
          </div>
        )}

        <div className='max-w-3xl bg-unleash-secondary text-white p-8 rounded-xl drop-shadow-md'>
          <div className='flex items-center gap-4'>
            <Image
              src='/unleash_logo.svg'
              alt='Unleash Logo'
              width={80}
              height={80}
            />
            <div>
              <h1 className='text-3xl font-bold'>Unleash App for Slack</h1>
              <p className='text-gray-300 mt-1 text-sm'>
                Get real-time feature flag and change notifications directly in
                Slack. Stay in sync with your team, effortlessly.
              </p>
            </div>
          </div>

          <div className='my-4'>
            {access_token ? <Guide access_token={access_token} /> : <Install />}
          </div>

          <div className='text-gray-300 text-sm leading-relaxed'>
            <h2 className='text-lg text-white font-semibold mb-2'>
              How it works:
            </h2>
            <ul className='list-disc list-inside mb-4'>
              <li>
                🔔 Get alerts when feature flags are created, updated, enabled
                or disabled.
              </li>
              <li>
                🔧 Monitor changes to projects, strategies, environments, and
                more.
              </li>
              <li>
                🏷️ Tag flags with e.g. <code>slack:general</code> to send
                updates to specific channels.
              </li>
              <li>✅ Stay on top of change requests and approvals.</li>
            </ul>
            <p>
              After installing the App for Slack, copy your access token and
              paste it into the integration settings inside Unleash. Then choose
              your events and channels. That's it.
            </p>
            <p className='mt-4'>
              Read more in our{' '}
              <Link
                href='https://docs.getunleash.io/reference/integrations/slack-app'
                className='underline'
              >
                documentation
              </Link>
              .
            </p>
          </div>
        </div>
      </section>

      <footer className='w-full text-center text-gray-500 text-xs py-4'>
        <Link
          href='https://www.getunleash.io/privacy-policy'
          className='underline'
        >
          Privacy Policy
        </Link>
      </footer>
    </main>
  )
}
