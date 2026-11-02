'use client'
import { useEffect, useState } from 'react'

// Live only after the page has been in front, with focus, for a moment, so a
// click aimed at another window that hands over to this one
// (double-clickjacking) can't land on it. Being visible behind a popup doesn't
// count.
const IN_FRONT_FOR_MS = 1000

interface IContinueLinkProps {
  href: string
}

export const ContinueLink = ({ href }: IContinueLinkProps) => {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined
    const stop = () => {
      clearTimeout(timer)
      setReady(false)
    }
    const start = () => {
      stop()
      if (document.visibilityState === 'visible' && document.hasFocus()) {
        timer = setTimeout(() => setReady(true), IN_FRONT_FOR_MS)
      }
    }
    start()
    window.addEventListener('focus', start)
    window.addEventListener('blur', stop)
    document.addEventListener('visibilitychange', start)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('focus', start)
      window.removeEventListener('blur', stop)
      document.removeEventListener('visibilitychange', start)
    }
  }, [])

  const className =
    'bg-white text-unleash-secondary font-semibold px-5 py-2 rounded-md'
  return ready ? (
    <a href={href} className={className}>
      Continue to Slack
    </a>
  ) : (
    <span aria-disabled='true' className={`${className} opacity-50 cursor-wait`}>
      Continue to Slack
    </span>
  )
}
