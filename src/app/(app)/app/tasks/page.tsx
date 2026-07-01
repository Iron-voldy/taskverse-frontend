import type { Metadata } from 'next'
import { TasksPage } from '@/components/tasks/TasksPage'

export const metadata: Metadata = { title: 'Tasks', robots: { index: false } }

export default function Tasks() {
  return <TasksPage />
}
