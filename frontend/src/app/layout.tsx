import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'sonner';
import { OrganizationJsonLd, WebsiteJsonLd } from '@/components/seo';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const SITE_URL = 'https://political-accountability.in';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Political Accountability Platform - Track Political Promises in India',
    template: '%s | Political Accountability Platform',
  },
  description: 'Track political promises made by Indian politicians. Community-driven verification with transparent accountability. Hold your representatives accountable with evidence-based tracking.',
  keywords: [
    'political accountability',
    'india politics',
    'election promises',
    'politician tracker',
    'promise tracker',
    'indian democracy',
    'civic engagement',
    'government transparency',
    'election verification',
    'BJP promises',
    'Congress promises',
    'AAP promises',
    'MP promises',
    'MLA promises',
    'Modi promises',
    'state elections india',
    'lok sabha',
    'vidhan sabha',
    'political promises india',
    'neta promises'
  ],
  authors: [{ name: 'Political Accountability Platform', url: SITE_URL }],
  creator: 'Political Accountability Platform',
  publisher: 'Political Accountability Platform',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: SITE_URL,
    siteName: 'Political Accountability Platform',
    title: 'Political Accountability Platform - Track Political Promises in India',
    description: 'Track political promises made by Indian politicians. Community-driven verification with transparent accountability.',
    images: [
      {
        url: `${SITE_URL}/images/og-default.png`,
        width: 1200,
        height: 630,
        alt: 'Political Accountability Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Political Accountability Platform',
    description: 'Track political promises made by Indian politicians with community verification.',
    site: '@paborgin',
    creator: '@paborgin',
    images: [`${SITE_URL}/images/og-default.png`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
  category: 'politics',
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <OrganizationJsonLd />
        <WebsiteJsonLd />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-screen bg-background font-sans antialiased">
        {children}
        <Toaster position="top-center" richColors closeButton />
      </body>
    </html>
  );
}
