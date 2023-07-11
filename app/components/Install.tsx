import Image from 'next/image'

export const Install = () => (
  <div className='flex justify-center items-center mt-6'>
    <a
      href={`https://slack.com/oauth/v2/authorize?client_id=${process.env.NEXT_PUBLIC_CLIENT_ID}&scope=channels:read,chat:write,chat:write.public,groups:read`}
    >
      <Image
        alt='Add to Slack'
        height={50}
        width={170}
        src='/add_to_slack.png'
      />
    </a>
  </div>
)
