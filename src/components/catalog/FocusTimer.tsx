'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Pause, RotateCcw, Coffee } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  workMinutes?: number
  breakMinutes?: number
  title?: string
}

type Phase = 'work' | 'break'

export function FocusTimer({ workMinutes = 25, breakMinutes = 5, title = 'Focus Timer' }: Props) {
  const [phase, setPhase] = useState<Phase>('work')
  const [seconds, setSeconds] = useState(workMinutes * 60)
  const [running, setRunning] = useState(false)
  const [sessions, setSessions] = useState(0)

  const total = phase === 'work' ? workMinutes * 60 : breakMinutes * 60
  const progress = (total - seconds) / total
  const r = 54
  const circ = 2 * Math.PI * r
  const mm = String(Math.floor(seconds / 60)).padStart(2, '0')
  const ss = String(seconds % 60).padStart(2, '0')

  const reset = useCallback(() => {
    setRunning(false)
    setPhase('work')
    setSeconds(workMinutes * 60)
  }, [workMinutes])

  useEffect(() => {
    if (!running) return
    if (seconds === 0) {
      if (phase === 'work') {
        setSessions((s) => s + 1)
        setPhase('break')
        setSeconds(breakMinutes * 60)
      } else {
        setPhase('work')
        setSeconds(workMinutes * 60)
      }
      setRunning(false)
      return
    }
    const id = setTimeout(() => setSeconds((s) => s - 1), 1000)
    return () => clearTimeout(id)
  }, [running, seconds, phase, workMinutes, breakMinutes])

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center gap-2">
        {phase === 'work'
          ? <div className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
          : <Coffee className="w-4 h-4 text-amber-400" />
        }
        <h3 className="font-semibold text-white/90">{title}</h3>
        {sessions > 0 && (
          <span className="text-xs glass rounded-full px-2 py-0.5 text-white/50">{sessions} done</span>
        )}
      </div>

      <div className="relative">
        <svg width="140" height="140" className="-rotate-90">
          <circle cx="70" cy="70" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
          <motion.circle
            cx="70" cy="70" r={r} fill="none"
            stroke={phase === 'work' ? '#8b5cf6' : '#f59e0b'}
            strokeWidth="8" strokeLinecap="round"
            strokeDasharray={circ}
            animate={{ strokeDashoffset: circ * (1 - progress) }}
            transition={{ duration: 0.5 }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.span
              key={`${mm}:${ss}`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-3xl font-bold tabular-nums"
            >
              {mm}:{ss}
            </motion.span>
          </AnimatePresence>
          <span className={cn('text-xs mt-1', phase === 'work' ? 'text-violet-400' : 'text-amber-400')}>
            {phase === 'work' ? 'Focus' : 'Break'}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button onClick={reset} className="btn-ghost p-2 rounded-full" aria-label="Reset">
          <RotateCcw className="w-4 h-4" />
        </button>
        <button
          onClick={() => setRunning((r) => !r)}
          className={cn(
            'flex items-center gap-2 px-6 py-2.5 rounded-full font-medium transition-all active:scale-95',
            phase === 'work'
              ? 'bg-violet-600 hover:bg-violet-500 shadow-glow'
              : 'bg-amber-500 hover:bg-amber-400'
          )}
          aria-label={running ? 'Pause' : 'Start'}
        >
          {running ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          {running ? 'Pause' : 'Start'}
        </button>
      </div>
    </div>
  )
}
