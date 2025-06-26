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
      <header className='w-full p-4 flex flex-col sm:flex-row justify-between items-center'>
        <Link href='https://www.getunleash.io/' target='_blank'>
          <Image
            src='/unleash_pos.svg'
            alt='Unleash Logo'
            width={150}
            height={60}
          />
        </Link>
      </header>

      <section className='flex flex-col items-center justify-center px-4 mt-16 mb-8'>
        {error && (
          <div className='p-4 bg-red-500 text-white rounded-md mb-4'>
            {error}
          </div>
        )}

        <div className='max-w-3xl bg-unleash-secondary text-white p-8 rounded-2xl drop-shadow-md'>
          <div className='flex flex-col text-center sm:flex-row sm:text-left items-center gap-4'>
            <Image
              src='/unleash_logo.svg'
              alt='Unleash Logo'
              width={80}
              height={80}
            />
            <div>
              <h1 className='text-3xl font-bold'>Unleash App for Slack</h1>
              <p className='text-gray-300 mt-1 text-sm'>
                Connect Unleash to Slack and stay updated on every change, right
                where your team works.
              </p>
            </div>
          </div>

          <div className='flex justify-center mt-6 mb-8'>
            {access_token ? <Guide access_token={access_token} /> : <Install />}
          </div>

          {!access_token && (
            <div className='text-gray-300 text-sm leading-relaxed'>
              <p>
                The Unleash App for Slack brings real-time feature flag updates
                and change notifications directly to your Slack workspace,
                helping teams stay in sync and move faster.
              </p>
              <h2 className='text-lg text-white font-semibold mt-4 mb-2'>
                How it works
              </h2>
              <ul className='list-disc list-inside space-y-1'>
                <li>
                  🔔 Receive instant alerts when feature flags are created,
                  updated, enabled, disabled, or tagged
                </li>
                <li>
                  🔧 Monitor changes to projects, environments, strategies,
                  users, service accounts and more
                </li>
                <li>
                  ✅ Stay on top of change requests, Unleash's approval workflow
                  for safe, auditable flag changes
                </li>
                <li>
                  🏷️ Target specific channels using "slack" tags on feature
                  flags (e.g. <code>slack:general</code>)
                </li>
                <li>
                  🔄 Customize alerts by project, environment, and event type
                </li>
                <li>
                  🔐 Works with both public and private channels (just invite
                  the app to private ones)
                </li>
              </ul>
            </div>
          )}
        </div>
      </section>

      <section className='w-full text-gray-800 px-4'>
        <div className='max-w-3xl mx-auto text-sm'>
          <h2 className='text-xl font-semibold mt-4 mb-2'>How to set it up</h2>
          <ol className='list-decimal list-inside space-y-1'>
            <li>Click "Add to Slack" and select your workspace</li>
            <li>
              After installation, copy the access token shown on this page
            </li>
            <li>
              Go to <code>Unleash → Integrations → App for Slack</code> in the
              admin UI
            </li>
            <li>
              Paste your access token into the integration settings and select
              the events you'd like to be notified about
            </li>
          </ol>

          <h3 className='text-lg font-medium mt-6 mb-2'>
            Additional configuration details
          </h3>
          <ul className='list-disc list-inside space-y-1'>
            <li>
              The app can only post to private channels if you manually invite
              it to each one
            </li>
            <li>
              You can configure a comma-separated list of channels to always
              receive notifications
            </li>
            <li>
              Feature flags can also include Slack-specific tags (e.g.{' '}
              <code>slack:general</code>) to target additional channels
            </li>
            <li>
              If no channels are configured, only the tagged channels will
              receive notifications
            </li>
            <li>
              You can filter events by project and environment to fine-tune your
              notifications
            </li>
            <li>
              Multiple integration configurations are supported, so you can
              tailor settings for different teams or use cases
            </li>
          </ul>
          <p className='mt-8'>
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
      </section>

      <footer className='w-full text-center text-gray-500 text-xs py-4 mt-auto'>
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
