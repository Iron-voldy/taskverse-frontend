'use client'

import { motion } from 'framer-motion'
import { Calendar, CheckCircle2, Circle } from 'lucide-react'
import { formatDate, cn } from '@/lib/utils'
import type { Task } from '@/types'

interface TimelineItem {
  id: string
  title: string
  date: string
  done?: boolean
  color?: string
}

interface Props {
  items?: TimelineItem[]
  tasks?: Task[]
  title?: string
}

export function Timeline({ items, tasks, title }: Props) {
  const events: TimelineItem[] = (Array.isArray(items) && items.length > 0 ? items : null)
    ?? (Array.isArray(tasks) ? tasks : [])
    .filter((t) => t.dueDate)
    .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
    .map((t) => ({ id: t._id, title: t.title, date: t.dueDate!, done: t.status === 'done' }))

  return (
    <div>
      {title && (
        <div className="flex items-center gap-2 mb-6">
          <Calendar className="w-4 h-4 text-brand-400" />
          <h3 className="font-semibold text-white/90">{title}</h3>
        </div>
      )}
      <div className="relative">
        <div className="absolute left-4 top-0 bottom-0 w-px bg-gradient-to-b from-violet-500/50 via-brand-500/30 to-transparent" />
        <div className="space-y-4">
          {events.map((event, i) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              className="flex items-start gap-4 pl-2"
            >
              <div className={cn(
                'w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 z-10',
                event.done ? 'text-violet-400' : 'text-brand-400'
              )}>
                {event.done
                  ? <CheckCircle2 className="w-5 h-5" />
                  : <Circle className="w-5 h-5" />
                }
              </div>
              <div className="glass rounded-lg p-3 flex-1 hover:bg-white/10 transition-colors">
                <p className={cn('text-sm font-medium', event.done && 'line-through text-white/40')}>
                  {event.title}
                </p>
                <p className="text-xs text-white/30 mt-1">{formatDate(event.date)}</p>
              </div>
            </motion.div>
          ))}
          {events.length === 0 && (
            <p className="text-white/30 text-sm pl-10">No scheduled events</p>
          )}
        </div>
      </div>
    </div>
  )
}
