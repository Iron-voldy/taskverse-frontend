'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { CheckSquare, Clock, Flame, Zap, TrendingUp, Plus, CalendarDays } from 'lucide-react'
import Link from 'next/link'
import { useTaskStore } from '@/store/useTaskStore'
import { useUserStore } from '@/store/useUserStore'
import { TaskCard } from '@/components/catalog/TaskCard'
import { DashboardCalendar } from './DashboardCalendar'
import { getLevelTitle, getXpProgress, isOverdue } from '@/lib/utils'
import { useXpReward } from '@/hooks/useXpReward'

export function Dashboard() {
  const { tasks, completeTask } = useTaskStore()
  const { user } = useUserStore()
  const { reward } = useXpReward()

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const stats = useMemo(() => ({
    total: tasks.length,
    done: tasks.filter((t) => t.status === 'done').length,
    overdue: tasks.filter((t) => t.status !== 'done' && isOverdue(t.dueDate)).length,
    dueToday: tasks.filter((t) => t.dueDate && new Date(t.dueDate) >= today).length,
  }), [tasks, today])

  const upcoming = tasks
    .filter((t) => t.status !== 'done' && t.status !== 'archived')
    .sort((a, b) => {
      if (!a.dueDate) return 1
      if (!b.dueDate) return -1
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    })
    .slice(0, 6)

  async function handleComplete(id: string) {
    const { xpAwarded } = await completeTask(id)
    reward(xpAwarded, `Task done! +${xpAwarded} XP`)
  }

  const xpPct = user ? getXpProgress(user.xp, user.level) : 0

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            Good <span suppressHydrationWarning>{getGreeting()}</span>,{' '}
            <span className="gradient-text">{user?.name?.split(' ')[0] ?? 'there'}</span> 👋
          </h1>
          <p className="text-white/40 text-sm mt-1">Here&apos;s what&apos;s on your plate today</p>
        </div>
        <Link href="/app/tasks" className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          New Task
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Tasks', value: stats.total, icon: CheckSquare, color: 'text-orange-400', bg: 'bg-orange-400/10' },
          { label: 'Completed', value: stats.done, icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
          { label: 'Overdue', value: stats.overdue, icon: Clock, color: 'text-red-400', bg: 'bg-red-400/10' },
          { label: 'Day Streak', value: user?.streak ?? 0, icon: Flame, color: 'text-orange-400', bg: 'bg-orange-400/10' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="glass rounded-2xl p-4"
          >
            <div className={`w-8 h-8 rounded-lg ${stat.bg} flex items-center justify-center mb-3`}>
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
            </div>
            <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
            <div className="text-xs text-white/40 mt-1">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      {/* XP Card */}
      {user && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-2xl p-5 gradient-border"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <span className="font-semibold text-sm">Level {user.level} — {getLevelTitle(user.level)}</span>
            </div>
            <span className="text-xs text-white/40">{user.xp} / {user.level * 500} XP</span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ background: 'linear-gradient(90deg, #ff4d00, #ff8c00)' }}
              initial={{ width: 0 }}
              animate={{ width: `${xpPct}%` }}
              transition={{ duration: 0.6, ease: 'easeOut', delay: 0.15 }}
            />
          </div>
          <p className="text-xs text-white/30 mt-2">Complete tasks to earn XP and level up</p>
        </motion.div>
      )}

      {/* Calendar + Upcoming side by side on large screens */}
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        {/* Calendar */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
          <div className="flex items-center gap-2 mb-4">
            <CalendarDays className="w-4 h-4 text-[#ff4d00]" />
            <h2 className="font-bold text-lg">Task Calendar</h2>
          </div>
          <DashboardCalendar />
        </motion.div>

        {/* Upcoming tasks */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-lg">Upcoming</h2>
            <Link href="/app/tasks" className="text-sm transition-colors" style={{ color: '#ff4d00' }}>
              View all →
            </Link>
          </div>
          <div className="space-y-2">
            {upcoming.map((task, i) => (
              <motion.div
                key={task._id}
                initial={{ opacity: 0, x: 6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.18 + i * 0.04 }}
              >
                <TaskCard task={task} variant="card" onComplete={() => handleComplete(task._id)} />
              </motion.div>
            ))}
            {upcoming.length === 0 && (
              <div className="glass rounded-2xl p-6 text-center">
                <p className="text-white/30 text-sm">All caught up!</p>
                <Link href="/app/tasks" className="btn-primary inline-flex items-center gap-2 mt-3 text-sm">
                  <Plus className="w-4 h-4" />
                  Add tasks
                </Link>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}
