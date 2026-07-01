import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'TaskVerse',
    short_name: 'TaskVerse',
    description: 'AI Todo That Builds Itself',
    start_url: '/app',
    display: 'standalone',
    background_color: '#020617',
    theme_color: '#0f172a',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  }
}
