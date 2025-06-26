import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Unleash App for Slack',
  description:
    "Add Unleash to your Slack workspace by using Unleash's official App for Slack."
}

export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <html lang='en' className='bg-unleash-background'>
      <body className={inter.className}>{children}</body>
    </html>
  )
}
