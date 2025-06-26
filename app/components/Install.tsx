import Image from 'next/image'

export const Install = () => (
  <div className='flex justify-center items-center mt-6'>
    <a href='/install'>
      <Image
        alt='Add to Slack'
        height={50}
        width={170}
        src='/add_to_slack.png'
      />
    </a>
  </div>
)
