'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { differenceInDays, differenceInHours } from 'date-fns'

interface Props {
  title?: string
  deadline?: string
  color?: string
  size?: number
}

export function CountdownRing({ title = 'Deadline', deadline, color = '#8b5cf6', size = 140 }: Props) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, progress: 0 })

  useEffect(() => {
    if (!deadline) return
    const target = new Date(deadline)
    const update = () => {
      const now = new Date()
      const days = Math.max(0, differenceInDays(target, now))
      const hours = Math.max(0, differenceInHours(target, now) % 24)
      const totalHours = Math.max(0, differenceInHours(target, now))
      const maxHours = 30 * 24
      const progress = Math.max(0, Math.min(1, 1 - totalHours / maxHours))
      setTimeLeft({ days, hours, progress })
    }
    update()
    const id = setInterval(update, 60000)
    return () => clearInterval(id)
  }, [deadline])

  const r = size / 2 - 12
  const circumference = 2 * Math.PI * r
  const strokeDash = circumference * (1 - timeLeft.progress)
  const urgent = timeLeft.days <= 3

  return (
    <div className="flex flex-col items-center gap-3">
      {title && <h3 className="font-semibold text-white/90 text-center">{title}</h3>}
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,0.1)" strokeWidth="8" fill="none" />
          <motion.circle
            cx={size / 2} cy={size / 2} r={r}
            stroke={urgent ? '#ef4444' : color}
            strokeWidth="8" fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: strokeDash }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn('text-3xl font-bold', urgent ? 'text-red-400' : 'text-white')}>
            {timeLeft.days}
          </span>
          <span className="text-xs text-white/40">days left</span>
          {timeLeft.hours > 0 && (
            <span className="text-xs text-white/30">{timeLeft.hours}h</span>
          )}
        </div>
      </div>
    </div>
  )
}
