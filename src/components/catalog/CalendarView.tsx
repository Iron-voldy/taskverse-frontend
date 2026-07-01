'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  startOfWeek, endOfWeek, isSameMonth, isToday, isSameDay,
} from 'date-fns'
import { cn } from '@/lib/utils'
import type { Task } from '@/types'

interface Props {
  tasks?: Task[]
  title?: string
}

export function CalendarView({ tasks = [], title }: Props) {
  const [current, setCurrent] = useState(new Date())

  const monthStart = startOfMonth(current)
  const monthEnd = endOfMonth(current)
  const calStart = startOfWeek(monthStart)
  const calEnd = endOfWeek(monthEnd)
  const days = eachDayOfInterval({ start: calStart, end: calEnd })

  const tasksForDay = (day: Date) =>
    tasks.filter((t) => t.dueDate && isSameDay(new Date(t.dueDate), day))

  return (
    <div>
      {title && <h3 className="font-semibold text-white/90 mb-4">{title}</h3>}

      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setCurrent((d) => new Date(d.getFullYear(), d.getMonth() - 1))}
          className="btn-ghost p-1.5 rounded-lg">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="font-semibold text-sm">{format(current, 'MMMM yyyy')}</span>
        <button onClick={() => setCurrent((d) => new Date(d.getFullYear(), d.getMonth() + 1))}
          className="btn-ghost p-1.5 rounded-lg">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
          <div key={d} className="text-center text-xs text-white/30 py-1">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day, i) => {
          const dayTasks = tasksForDay(day)
          const inMonth = isSameMonth(day, current)
          const today = isToday(day)
          return (
            <motion.div
              key={day.toISOString()}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.005 }}
              className={cn(
                'min-h-[40px] rounded-lg p-1 transition-colors',
                inMonth ? 'hover:bg-white/5' : 'opacity-30',
                today && 'bg-violet-500/20 ring-1 ring-violet-500/40'
              )}
            >
              <div className={cn('text-xs text-center mb-1', today ? 'text-violet-400 font-bold' : 'text-white/60')}>
                {format(day, 'd')}
              </div>
              {dayTasks.slice(0, 2).map((t) => (
                <div key={t._id} className="w-full h-1 rounded-full bg-violet-500/60 mb-0.5" title={t.title} />
              ))}
              {dayTasks.length > 2 && (
                <div className="text-[10px] text-white/30 text-center">+{dayTasks.length - 2}</div>
              )}
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
