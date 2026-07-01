import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'
import { Toaster } from 'sonner'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

const BASE_URL = 'https://taskverse.app'

export const metadata: Metadata = {
  title: {
    default: 'TaskVerse — AI Todo That Builds Itself',
    template: '%s | TaskVerse',
  },
  description:
    'Type a goal and TaskVerse AI builds the perfect workspace — kanban, timeline, habit grid, or budget tracker. Free productivity app powered by generative UI.',
  authors: [{ name: 'TaskVerse' }],
  alternates: { canonical: BASE_URL },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: BASE_URL,
    siteName: 'TaskVerse',
    title: 'TaskVerse — AI Todo That Builds Itself',
    description: 'Type a goal. The AI assembles the perfect interface around it. Free forever.',
    images: [
      {
        url: `${BASE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'TaskVerse — AI-powered todo app that builds itself',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TaskVerse — AI Todo That Builds Itself',
    description: 'Type a goal. The AI assembles the perfect interface around it. Free forever.',
    images: [`${BASE_URL}/og-image.png`],
  },
  robots: { index: true, follow: true },
}

export const viewport: Viewport = {
  themeColor: '#0f172a',
  width: 'device-width',
  initialScale: 1,
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'TaskVerse',
  url: BASE_URL,
  description:
    'AI-powered productivity app that generates a custom interface — kanban, timeline, habit grid, or budget tracker — based on your goal.',
  applicationCategory: 'ProductivityApplication',
  operatingSystem: 'Web',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  author: { '@type': 'Organization', name: 'TaskVerse', url: BASE_URL },
  featureList: [
    'AI-generated kanban boards',
    'Habit grid tracking',
    'Budget tracker',
    'Focus timer',
    'Timeline view',
    'XP and leveling system',
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`${inter.variable} font-sans bg-surface-950 text-white antialiased`}>
        <Providers>
          {children}
          <Toaster richColors position="top-right" theme="dark" />
        </Providers>
      </body>
    </html>
  )
}
