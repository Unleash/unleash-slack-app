/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    // The connect pages must not be framed: the confirmation screen is a safeguard.
    return [
      {
        source: '/connect/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Content-Security-Policy', value: "frame-ancestors 'none'" },
          { key: 'Referrer-Policy', value: 'no-referrer' }
        ]
      }
    ]
  }
}

module.exports = nextConfig
