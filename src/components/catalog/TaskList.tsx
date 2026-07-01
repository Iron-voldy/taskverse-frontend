'use client'

import { AnimatePresence } from 'framer-motion'
import { CheckSquare } from 'lucide-react'
import { TaskCard } from './TaskCard'
import type { Task } from '@/types'

interface Props {
  tasks?: Task[]
  title?: string
  emptyMessage?: string
  onComplete?: (id: string) => void
}

export function TaskList({ tasks, title, emptyMessage = 'No tasks yet', onComplete }: Props) {
  const safeTasks = Array.isArray(tasks) ? tasks : []
  return (
    <div className="space-y-2">
      {title && (
        <div className="flex items-center gap-2 mb-4">
          <CheckSquare className="w-4 h-4 text-violet-400" />
          <h3 className="font-semibold text-white/90">{title}</h3>
          <span className="text-xs text-white/30 ml-auto">{safeTasks.length} tasks</span>
        </div>
      )}
      <AnimatePresence mode="popLayout">
        {safeTasks.length === 0 ? (
          <div className="text-center py-8 text-white/30 text-sm">{emptyMessage}</div>
        ) : (
          safeTasks.map((task) => (
            <TaskCard
              key={task._id}
              task={task}
              variant="card"
              onComplete={() => onComplete?.(task._id)}
            />
          ))
        )}
      </AnimatePresence>
    </div>
  )
}
