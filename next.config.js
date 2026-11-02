/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    // The connect pages must not be framed: the confirmation screen is a safeguard.
    // The callback's redirect carries the sealed token, so it sends no referrer.
    return [
      {
        source: '/connect/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Content-Security-Policy', value: "frame-ancestors 'none'" },
          { key: 'Referrer-Policy', value: 'no-referrer' }
        ]
      },
      {
        source: '/callback',
        headers: [
          { key: 'Referrer-Policy', value: 'no-referrer' },
          { key: 'Cache-Control', value: 'no-store' }
        ]
      }
    ]
  }
}

module.exports = nextConfig
