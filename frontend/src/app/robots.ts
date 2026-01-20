import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const siteUrl = 'https://political-accountability.in'

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/api/',
          '/auth/callback',
          '/auth/reset-password',
          '/dashboard',
          '/profile', // /profile without username (requires auth)
        ],
      },
      {
        userAgent: 'GPTBot',
        allow: [
          '/',
          '/promises/',
          '/politicians/',
          '/elections/',
          '/how-it-works',
          '/about',
          '/guidelines',
          '/llms.txt',
        ],
        disallow: [
          '/admin/',
          '/api/',
          '/auth/',
          '/dashboard',
        ],
      },
      {
        userAgent: 'ChatGPT-User',
        allow: [
          '/',
          '/promises/',
          '/politicians/',
          '/elections/',
          '/how-it-works',
          '/about',
          '/guidelines',
          '/llms.txt',
        ],
        disallow: [
          '/admin/',
          '/api/',
          '/auth/',
          '/dashboard',
        ],
      },
      {
        userAgent: 'Claude-Web',
        allow: [
          '/',
          '/promises/',
          '/politicians/',
          '/elections/',
          '/how-it-works',
          '/about',
          '/guidelines',
          '/llms.txt',
        ],
        disallow: [
          '/admin/',
          '/api/',
          '/auth/',
          '/dashboard',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: [
          '/admin/',
          '/api/',
          '/auth/callback',
          '/auth/reset-password',
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  }
}
