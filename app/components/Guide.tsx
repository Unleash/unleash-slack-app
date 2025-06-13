'use client'
import { Icon } from '@iconify/react'
import { useState } from 'react'

interface IGuideProps {
  access_token: string
}

export const Guide = ({ access_token }: IGuideProps) => {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = () => {
    navigator.clipboard.writeText(access_token)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className='flex flex-col gap-4 mt-6'>
      Access token:
      <div className='relative'>
        <input
          value={access_token}
          readOnly
          className='bg-slate-800 p-4 pr-12 outline outline-1 rounded-md w-full'
          onClick={e => e.currentTarget.select()}
        />
        <button
          className='absolute right-0 top-0 h-full w-12 flex items-center justify-center'
          onClick={copyToClipboard}
        >
          {copied ? (
            <Icon icon='mdi:check' className='text-3xl text-green-500' />
          ) : (
            <Icon icon='mdi:content-copy' className='text-3xl' />
          )}
        </button>
      </div>
      <p>
        You should copy this access token and paste it in the{' '}
        <b>Access token</b> field you&apos;ll find in the Slack App integration
        configuration inside your Unleash instance.
      </p>
    </div>
  )
}
