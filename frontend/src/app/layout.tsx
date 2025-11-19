import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'sonner';

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Political Accountability Platform',
  description: 'Track political promises with community verification and transparent accountability',
  keywords: ['politics', 'accountability', 'promises', 'verification', 'transparency'],
  authors: [{ name: 'Political Accountability Platform' }],
  openGraph: {
    title: 'Political Accountability Platform',
    description: 'Track political promises with community verification and transparent accountability',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        {children}
        <Toaster position="top-center" richColors closeButton />
      </body>
    </html>
  );
}
