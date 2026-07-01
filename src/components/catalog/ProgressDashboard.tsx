'use client'

import { motion } from 'framer-motion'
import { BarChart2, TrendingUp } from 'lucide-react'
import { RadialBarChart, RadialBar, ResponsiveContainer, BarChart, Bar, XAxis, Tooltip } from 'recharts'
import type { Task } from '@/types'

interface Props {
  tasks?: Task[]
  title?: string
  showCharts?: boolean
}

export function ProgressDashboard({ tasks = [], title = 'Progress', showCharts = true }: Props) {
  const total = tasks.length
  const done = tasks.filter((t) => t.status === 'done').length
  const inProgress = tasks.filter((t) => t.status === 'in_progress').length
  const pct = total > 0 ? Math.round((done / total) * 100) : 0

  const byPriority = ['urgent', 'high', 'medium', 'low'].map((p) => ({
    name: p,
    count: tasks.filter((t) => t.priority === p).length,
    fill: { urgent: '#ef4444', high: '#f97316', medium: '#f59e0b', low: '#10b981' }[p],
  }))

  const radialData = [{ value: pct, fill: '#8b5cf6' }]

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <BarChart2 className="w-4 h-4 text-violet-400" />
        <h3 className="font-semibold text-white/90">{title}</h3>
        <div className="ml-auto flex items-center gap-1 text-emerald-400 text-sm">
          <TrendingUp className="w-3 h-3" />
          <span>{pct}%</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          { label: 'Total', value: total, color: 'text-white' },
          { label: 'Done', value: done, color: 'text-emerald-400' },
          { label: 'Active', value: inProgress, color: 'text-brand-400' },
        ].map((stat) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass rounded-xl p-3 text-center"
          >
            <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
            <div className="text-xs text-white/40">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      {showCharts && total > 0 && (
        <div className="grid grid-cols-2 gap-4">
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="80%" data={radialData}>
                <RadialBar dataKey="value" cornerRadius={4} />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byPriority} margin={{ top: 4, right: 4, bottom: 4, left: 0 }}>
                <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  )
}
