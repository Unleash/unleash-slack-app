'use client'
import { Icon } from '@iconify/react'

interface IGuideProps {
  access_token: string
}

export const Guide = ({ access_token }: IGuideProps) => {
  const copyToClipboard = () => {
    navigator.clipboard.writeText(access_token)
  }

  return (
    <div className='flex flex-col gap-4 mt-6'>
      Access token:
      <div className='relative'>
        <input
          value={access_token}
          readOnly
          className='bg-slate-800 p-4 outline outline-1 rounded-md w-full'
        />
        <button
          className='absolute right-0 top-0 h-full w-12 flex items-center justify-center'
          onClick={copyToClipboard}
        >
          <Icon icon='mdi:content-copy' className='text-3xl' />
        </button>
      </div>
      You should copy this access token and paste it in the Slack App addon
      configuration.
    </div>
  )
}
