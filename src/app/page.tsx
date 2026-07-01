import type { Metadata } from 'next'
import { LandingPage } from '@/components/landing/LandingPage'

export const metadata: Metadata = {
  title: 'TaskVerse — AI Todo That Builds Itself',
  description:
    'Type a goal. TaskVerse AI instantly assembles a custom interface — kanban, timeline, habit grid, budget tracker, or focus timer — built around exactly what you need. Free forever.',
  alternates: { canonical: 'https://taskverse.app' },
  openGraph: {
    title: 'TaskVerse — AI Todo That Builds Itself',
    description:
      'Type a goal. TaskVerse AI builds the perfect workspace around it. Free forever, no credit card.',
    type: 'website',
    url: 'https://taskverse.app',
    images: [{ url: 'https://taskverse.app/og-image.png', width: 1200, height: 630 }],
  },
}

export default function Home() {
  return <LandingPage />
}
