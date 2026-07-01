'use client'

import { motion } from 'framer-motion'
import { Flame } from 'lucide-react'
import { cn } from '@/lib/utils'
import { format, subDays, eachDayOfInterval } from 'date-fns'

interface Props {
  title?: string
  streak?: number
  completedDates?: string[]
  weeks?: number
}

export function HabitGrid({ title = 'Habit Tracker', streak = 0, completedDates = [], weeks = 12 }: Props) {
  const today = new Date()
  const start = subDays(today, weeks * 7 - 1)
  const days = eachDayOfInterval({ start, end: today })
  const completedSet = new Set(completedDates.map((d) => format(new Date(d), 'yyyy-MM-dd')))

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-white/90">{title}</h3>
        <div className="flex items-center gap-2 glass rounded-full px-3 py-1.5">
          <Flame className={cn('w-4 h-4', streak > 0 ? 'text-orange-400 animate-streak' : 'text-white/30')} />
          <span className="text-sm font-bold text-orange-400">{streak}</span>
          <span className="text-xs text-white/40">day streak</span>
        </div>
      </div>

      <div className="flex gap-1 flex-wrap">
        {days.map((day, i) => {
          const key = format(day, 'yyyy-MM-dd')
          const done = completedSet.has(key)
          const isToday = key === format(today, 'yyyy-MM-dd')
          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.002 }}
              title={key}
              className={cn(
                'w-3 h-3 rounded-sm transition-colors',
                done ? 'bg-violet-500' : 'bg-white/10',
                isToday && 'ring-1 ring-violet-400',
              )}
            />
          )
        })}
      </div>

      <div className="flex items-center gap-2 mt-3 text-xs text-white/30">
        <span>Less</span>
        {['bg-white/10', 'bg-violet-800/60', 'bg-violet-600/70', 'bg-violet-500', 'bg-violet-400'].map((c, i) => (
          <div key={i} className={cn('w-3 h-3 rounded-sm', c)} />
        ))}
        <span>More</span>
      </div>
    </div>
  )
}
