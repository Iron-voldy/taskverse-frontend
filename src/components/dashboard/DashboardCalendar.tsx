'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, X, Clock, CheckCircle2, Circle, AlertCircle } from 'lucide-react'
import { useTaskStore } from '@/store/useTaskStore'
import { useXpReward } from '@/hooks/useXpReward'
import { isOverdue } from '@/lib/utils'
import type { Task } from '@/types'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

const PRIORITY_DOT: Record<string, string> = {
  urgent: 'bg-red-400',
  high: 'bg-orange-400',
  medium: 'bg-yellow-400',
  low: 'bg-green-400',
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function fmtTime(mins: number) {
  if (mins < 60) return `${mins}m`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m ? `${h}h ${m}m` : `${h}h`
}

interface DayPanelProps {
  date: Date
  tasks: Task[]
  onClose: () => void
  onComplete: (id: string) => Promise<void>
}

function DayPanel({ date, tasks, onClose, onComplete }: DayPanelProps) {
  const [completing, setCompleting] = useState<string | null>(null)

  const dateLabel = date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
  const todo = tasks.filter((t) => t.status !== 'done' && t.status !== 'archived')
  const done = tasks.filter((t) => t.status === 'done')

  async function handleComplete(id: string) {
    setCompleting(id)
    await onComplete(id)
    setCompleting(null)
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 24 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="glass rounded-2xl p-5 space-y-4"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="font-bold text-[#eee8de]">{dateLabel}</p>
          <p className="text-xs text-[#eee8de]/40 mt-0.5">
            {tasks.length === 0 ? 'No tasks' : `${todo.length} pending · ${done.length} done`}
          </p>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg text-[#eee8de]/30 hover:text-[#eee8de]/70 hover:bg-white/10 transition-all">
          <X className="w-4 h-4" />
        </button>
      </div>

      {tasks.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-[#eee8de]/20 text-sm">No tasks due this day</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
          {todo.map((task) => (
            <motion.div
              key={task._id}
              layout
              className={`flex items-start gap-3 glass rounded-xl p-3 ${isOverdue(task.dueDate) ? 'border border-red-400/20' : ''}`}
            >
              <button
                onClick={() => handleComplete(task._id)}
                disabled={completing === task._id}
                className="mt-0.5 flex-shrink-0 text-[#eee8de]/30 hover:text-[#ff4d00] transition-colors"
              >
                {completing === task._id
                  ? <CheckCircle2 className="w-4 h-4 text-[#ff4d00] animate-pulse" />
                  : <Circle className="w-4 h-4" />
                }
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm text-[#eee8de] font-medium truncate">{task.title}</p>
                  {isOverdue(task.dueDate) && <AlertCircle className="w-3 h-3 text-red-400 flex-shrink-0" />}
                </div>
                {task.description && (
                  <p className="text-xs text-[#eee8de]/40 mt-0.5 line-clamp-1">{task.description}</p>
                )}
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                    task.priority === 'urgent' ? 'bg-red-400/15 text-red-400'
                    : task.priority === 'high' ? 'bg-orange-400/15 text-orange-400'
                    : task.priority === 'medium' ? 'bg-yellow-400/15 text-yellow-400'
                    : 'bg-green-400/15 text-green-400'
                  }`}>{task.priority}</span>
                  {task.estimatedMinutes && (
                    <span className="flex items-center gap-0.5 text-[10px] text-[#eee8de]/30">
                      <Clock className="w-2.5 h-2.5" />{fmtTime(task.estimatedMinutes)}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}

          {done.length > 0 && (
            <>
              <p className="text-[10px] text-[#eee8de]/30 pt-1 font-medium uppercase tracking-wider">Completed</p>
              {done.map((task) => (
                <div key={task._id} className="flex items-center gap-3 rounded-xl p-3 opacity-40">
                  <CheckCircle2 className="w-4 h-4 text-[#ff4d00] flex-shrink-0" />
                  <p className="text-sm text-[#eee8de] line-through truncate">{task.title}</p>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </motion.div>
  )
}

export function DashboardCalendar() {
  const { tasks, completeTask } = useTaskStore()
  const { reward } = useXpReward()
  const today = new Date()

  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1))
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()

  // Parse a YYYY-MM-DD date string as local midnight (not UTC)
  function localDate(dateStr: string) {
    const [y, m, d] = dateStr.split('T')[0].split('-').map(Number)
    return new Date(y, m - 1, d)
  }

  // Build task map keyed by "Y-M-D" in local time
  const tasksByDay = useMemo(() => {
    const map = new Map<string, Task[]>()
    for (const task of tasks) {
      if (!task.dueDate) continue
      const d = localDate(task.dueDate)
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(task)
    }
    return map
  }, [tasks])

  function dayKey(d: Date) {
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
  }

  function tasksForDay(d: Date) {
    return tasksByDay.get(dayKey(d)) ?? []
  }

  // Calendar grid
  const firstDow = new Date(year, month, 1).getDay() // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: Array<Date | null> = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1)),
  ]
  // pad to complete last row
  while (cells.length % 7 !== 0) cells.push(null)

  function prevMonth() { setViewDate(new Date(year, month - 1, 1)); setSelectedDate(null) }
  function nextMonth() { setViewDate(new Date(year, month + 1, 1)); setSelectedDate(null) }

  function handleDayClick(d: Date) {
    setSelectedDate((prev) => (prev && isSameDay(prev, d) ? null : d))
  }

  async function handleComplete(id: string) {
    const { xpAwarded } = await completeTask(id)
    reward(xpAwarded, `+${xpAwarded} XP`)
  }

  const selectedTasks = selectedDate ? tasksForDay(selectedDate) : []

  return (
    <div className="space-y-4">
      {/* Calendar card */}
      <div className="glass rounded-2xl p-5">
        {/* Month nav */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-[#eee8de]">
            {MONTHS[month]} <span className="text-[#eee8de]/40 font-normal">{year}</span>
          </h2>
          <div className="flex gap-1">
            <button onClick={prevMonth} className="p-1.5 rounded-lg text-[#eee8de]/40 hover:text-[#eee8de] hover:bg-white/10 transition-all">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => { setViewDate(new Date(today.getFullYear(), today.getMonth(), 1)); setSelectedDate(today) }}
              className="px-2.5 py-1 rounded-lg text-xs text-[#eee8de]/50 hover:text-[#eee8de] hover:bg-white/10 transition-all"
            >
              Today
            </button>
            <button onClick={nextMonth} className="p-1.5 rounded-lg text-[#eee8de]/40 hover:text-[#eee8de] hover:bg-white/10 transition-all">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 mb-1">
          {DAYS.map((d) => (
            <div key={d} className="text-center text-[10px] text-[#eee8de]/30 font-medium py-1">{d}</div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 gap-y-1">
          {cells.map((date, i) => {
            if (!date) return <div key={`e-${i}`} />

            const dayTasks = tasksForDay(date)
            const isToday = isSameDay(date, today)
            const isSelected = selectedDate ? isSameDay(date, selectedDate) : false
            const hasPending = dayTasks.some((t) => t.status !== 'done' && t.status !== 'archived')
            const hasOverdue = dayTasks.some((t) => t.status !== 'done' && isOverdue(t.dueDate))
            const topPriorities = [...new Set(dayTasks.map((t) => t.priority))].slice(0, 3)

            return (
              <motion.button
                key={date.toISOString()}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleDayClick(date)}
                className={`relative flex flex-col items-center rounded-xl py-1.5 transition-all ${
                  isSelected
                    ? 'bg-[#ff4d00] text-[#050505]'
                    : isToday
                    ? 'bg-[#ff4d00]/15 text-[#ff4d00]'
                    : dayTasks.length > 0
                    ? 'bg-white/5 text-[#eee8de] hover:bg-white/10'
                    : 'text-[#eee8de]/30 hover:bg-white/5 hover:text-[#eee8de]/60'
                }`}
              >
                <span className={`text-xs font-medium ${
                  isSelected ? 'text-[#050505]'
                  : dayTasks.length > 0 ? 'text-[#eee8de]'
                  : 'text-[#eee8de]/30'
                }`}>
                  {date.getDate()}
                </span>

                {/* Priority dots for days with tasks */}
                {dayTasks.length > 0 && (
                  <div className="flex gap-0.5 mt-0.5">
                    {topPriorities.map((p) => (
                      <span
                        key={p}
                        className={`w-1 h-1 rounded-full ${isSelected ? 'bg-[#050505]/50' : PRIORITY_DOT[p]}`}
                      />
                    ))}
                  </div>
                )}

                {/* Empty day — tiny dot to show it's a valid day */}
                {dayTasks.length === 0 && !isToday && !isSelected && (
                  <span className="w-0.5 h-0.5 rounded-full bg-[#eee8de]/10 mt-0.5" />
                )}

                {/* Overdue warning ring */}
                {hasOverdue && !isSelected && (
                  <span className="absolute inset-0 rounded-xl ring-1 ring-red-400/40 pointer-events-none" />
                )}
              </motion.button>
            )
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-4 pt-3 border-t border-white/5 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-white/5 flex-shrink-0" />
            <span className="text-[10px] text-[#eee8de]/30">Has tasks</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded flex-shrink-0 opacity-30" style={{ border: '1px dashed rgba(238,232,222,0.2)' }} />
            <span className="text-[10px] text-[#eee8de]/30">No tasks</span>
          </div>
          {[['urgent', 'Urgent'], ['high', 'High'], ['medium', 'Medium'], ['low', 'Low']].map(([p, label]) => (
            <div key={p} className="flex items-center gap-1">
              <span className={`w-1.5 h-1.5 rounded-full ${PRIORITY_DOT[p]}`} />
              <span className="text-[10px] text-[#eee8de]/30">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Day detail panel */}
      <AnimatePresence mode="wait">
        {selectedDate && (
          <DayPanel
            key={selectedDate.toISOString()}
            date={selectedDate}
            tasks={selectedTasks}
            onClose={() => setSelectedDate(null)}
            onComplete={handleComplete}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
