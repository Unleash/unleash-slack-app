import Image from 'next/image'
import { Guide } from './components/Guide'
import { Install } from './components/Install'

async function getAccessToken(code: string) {
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

export default async function Home({
  searchParams: { code }
}: {
  searchParams: {
    code: string
  }
}) {
  let error, access_token
  if (code) {
    try {
      access_token = await getAccessToken(code)
    } catch (e) {
      console.error(`An error occurred: ${e}`)
      error = 'An error occurred. Please try again later.'
    }
  }

  return (
    <main className='flex min-h-screen flex-col items-center md:justify-center md:p-24'>
      {error && (
        <div className='p-4 bg-red-500 text-white rounded-md mb-4'>{error}</div>
      )}
      <div className='max-w-4xl pt-40 p-4 flex-1 md:flex-grow-0 md:p-12 bg-unleash-secondary text-white md:rounded-xl drop-shadow-md'>
        <div className='flex flex-col md:flex-row justify-center items-center gap-2'>
          <Image
            src='/unleash_logo.svg'
            alt='Unleash Logo'
            width={100}
            height={100}
          />
          <div className='flex flex-col justify-center ml-8'>
            <h1 className='text-2xl font-bold'>Unleash</h1>
            <p className='text-gray-400'>
              Add Unleash to your Slack workspace by using Unleash&apos;s
              official App for Slack.
            </p>
          </div>
        </div>
        {access_token ? <Guide access_token={access_token} /> : <Install />}
      </div>
      <div className='fixed p-4 top-0 bg-unleash-background w-full'>
        <a href='https://www.getunleash.io/' target='_blank' rel='noreferrer'>
          <Image
            src='/unleash_pos.svg'
            alt='Unleash Logo'
            className='w-36 h-12 md:w-72 md:h-24'
            width={200}
            height={200}
          />
        </a>
      </div>
    </main>
  )
}
