'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { TaskCard } from './TaskCard'
import type { Task } from '@/types'

interface Column {
  id: string
  title: string
  color: string
  tasks: Task[]
}

interface Props {
  columns?: Column[]
  tasks?: Task[]
  groupBy?: 'status' | 'priority'
  title?: string
  onComplete?: (id: string) => void
}

const STATUS_COLUMNS = [
  { id: 'todo', title: 'To Do', color: 'border-white/20' },
  { id: 'in_progress', title: 'In Progress', color: 'border-brand-400/40' },
  { id: 'done', title: 'Done', color: 'border-violet-400/40' },
]

export function KanbanBoard({ columns, tasks = [], groupBy = 'status', title, onComplete }: Props) {
  const safeTasks = Array.isArray(tasks) ? tasks : []
  const cols: Column[] = (Array.isArray(columns) ? columns : []).length > 0
    ? (columns as Column[]).map((col) => ({ ...col, tasks: Array.isArray(col.tasks) ? col.tasks : [] }))
    : STATUS_COLUMNS.map((col) => ({
        ...col,
        tasks: safeTasks.filter((t) => t[groupBy === 'status' ? 'status' : 'priority'] === col.id),
      }))

  return (
    <div>
      {title && <h3 className="font-semibold text-white/90 mb-4">{title}</h3>}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 overflow-x-auto">
        {cols.map((col) => (
          <motion.div
            key={col.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn('glass rounded-xl p-4 border-t-2 min-h-[200px]', col.color)}
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-white/70">{col.title}</h4>
              <span className="text-xs text-white/30 glass rounded-full px-2 py-0.5">{col.tasks.length}</span>
            </div>
            <div className="space-y-2">
              {col.tasks.map((task) => (
                <TaskCard key={task._id} task={task} variant="card" onComplete={() => onComplete?.(task._id)} />
              ))}
              {col.tasks.length === 0 && (
                <div className="text-center py-6 text-white/20 text-xs border border-dashed border-white/10 rounded-lg">
                  Drop tasks here
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
