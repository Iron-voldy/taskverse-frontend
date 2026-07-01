import type { Metadata } from 'next'
import { CanvasPage } from '@/components/canvas/CanvasPage'

export const metadata: Metadata = { title: 'AI Canvas', robots: { index: false } }

export default function Canvas() {
  return <CanvasPage />
}
