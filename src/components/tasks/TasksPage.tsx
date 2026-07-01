'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Search, X, Trash2, ChevronDown, ChevronRight, CalendarDays } from 'lucide-react'
import { toast } from 'sonner'
import { useTaskStore } from '@/store/useTaskStore'
import { useXpReward } from '@/hooks/useXpReward'
import { TaskCard } from '@/components/catalog/TaskCard'
import { KanbanBoard } from '@/components/catalog/KanbanBoard'
import { CreateTaskModal } from './CreateTaskModal'
import { DeleteTaskModal } from './DeleteTaskModal'
import type { Priority, Task } from '@/types'

type View = 'list' | 'kanban'
type FilterState = { priority?: Priority; status?: string; search: string }

const C = {
  orange: '#ff4d00',
  rule: 'rgba(255,255,255,0.07)',
  dim: 'rgba(238,232,222,0.45)',
  mono: '"Courier New", Courier, monospace',
}

// Parse YYYY-MM-DD as local midnight (avoids UTC timezone shift)
function localDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('T')[0].split('-').map(Number)
  return new Date(y, m - 1, d)
}

function dayKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function formatDayLabel(dateStr: string): { label: string; sub: string; isToday: boolean; isPast: boolean } {
  const d = localDate(dateStr)
  const today = new Date()
  const todayKey = dayKey(today)
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1)
  const tomorrowKey = dayKey(tomorrow)
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1)
  const yesterdayKey = dayKey(yesterday)

  const key = dayKey(d)
  const isToday = key === todayKey
  const isTomorrow = key === tomorrowKey
  const isYesterday = key === yesterdayKey
  const isPast = d < yesterday

  const dayName = d.toLocaleDateString('en-US', { weekday: 'long' })
  const monthDay = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  let label = dayName
  if (isToday) label = 'Today'
  else if (isTomorrow) label = 'Tomorrow'
  else if (isYesterday) label = 'Yesterday'

  return { label, sub: monthDay, isToday, isPast: isPast && !isYesterday }
}

// Column header row (shared between day sections)
function ColumnHeaders() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center',
      padding: '0 0 0.35rem 0',
      marginBottom: '0.15rem',
    }}>
      <div style={{ width: 'calc(3px + 2.75rem)', flexShrink: 0 }} />
      <div style={{ flex: 1, fontSize: '0.62rem', fontFamily: C.mono, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(238,232,222,0.22)' }}>Task</div>
      <div style={{ width: '7.5rem', flexShrink: 0, fontSize: '0.62rem', fontFamily: C.mono, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(238,232,222,0.22)' }}>Due Date</div>
      <div style={{ width: '8rem', flexShrink: 0, fontSize: '0.62rem', fontFamily: C.mono, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(238,232,222,0.22)' }}>Tags</div>
      <div style={{ width: '5.5rem', flexShrink: 0, fontSize: '0.62rem', fontFamily: C.mono, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(238,232,222,0.22)' }}>Priority</div>
      <div style={{ width: '4.5rem', flexShrink: 0 }} />
    </div>
  )
}

interface DaySection {
  key: string        // YYYY-MM-DD or 'no-date'
  dateStr: string | null
  tasks: Task[]
}

export function TasksPage() {
  const { tasks, completeTask, deleteTask } = useTaskStore()
  const { reward } = useXpReward()
  const [view, setView] = useState<View>('list')
  const [filter, setFilter] = useState<FilterState>({ search: '' })
  const [showCreate, setShowCreate] = useState(false)
  const [editTask, setEditTask] = useState<Task | undefined>()
  const [deleteTask_modal, setDeleteTask_modal] = useState<Task | null>(null)
  const [deleteAllConfirm, setDeleteAllConfirm] = useState(false)
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())

  const filtered = tasks.filter((t) => {
    if (filter.search && !t.title.toLowerCase().includes(filter.search.toLowerCase()) &&
        !(t.description ?? '').toLowerCase().includes(filter.search.toLowerCase()) &&
        !t.tags.some((tag) => tag.includes(filter.search.toLowerCase()))) return false
    if (filter.priority && t.priority !== filter.priority) return false
    if (filter.status && t.status !== filter.status) return false
    return true
  })

  // Group tasks by due date
  const daySections = useMemo((): DaySection[] => {
    const map = new Map<string, Task[]>()
    const noDate: Task[] = []

    for (const t of filtered) {
      if (!t.dueDate) { noDate.push(t); continue }
      const key = dayKey(localDate(t.dueDate))
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(t)
    }

    // Sort day keys chronologically
    const sorted = [...map.entries()].sort(([a], [b]) => a.localeCompare(b))
    const sections: DaySection[] = sorted.map(([key, tasks]) => ({
      key,
      dateStr: tasks[0].dueDate!,
      tasks,
    }))

    if (noDate.length > 0) {
      sections.push({ key: 'no-date', dateStr: null, tasks: noDate })
    }

    return sections
  }, [filtered])

  function toggleCollapse(key: string) {
    setCollapsed(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  async function handleComplete(id: string) {
    try {
      const { xpAwarded } = await completeTask(id)
      reward(xpAwarded, `+${xpAwarded} XP`)
    } catch {
      toast.error('Failed to update task')
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteTask(id)
      toast.success('Task deleted')
    } catch {
      toast.error('Failed to delete task')
    }
  }

  async function handleDeleteAll() {
    if (!deleteAllConfirm) { setDeleteAllConfirm(true); setTimeout(() => setDeleteAllConfirm(false), 4000); return }
    let count = 0
    for (const t of [...tasks]) {
      try { await deleteTask(t._id); count++ } catch { /* skip */ }
    }
    setDeleteAllConfirm(false)
    toast.success(`Deleted ${count} tasks`)
  }

  const hasFilter = !!(filter.priority || filter.status || filter.search)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#eee8de', letterSpacing: '-0.02em' }}>Tasks</h1>
          <p style={{ color: C.dim, fontSize: '0.78rem', fontFamily: C.mono, marginTop: '0.2rem' }}>
            {filtered.length} of {tasks.length} tasks
            {hasFilter && <span style={{ color: C.orange }}> (filtered)</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {tasks.length > 0 && (
            <button
              onClick={handleDeleteAll}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                padding: '0.6rem 0.9rem',
                background: deleteAllConfirm ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${deleteAllConfirm ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.08)'}`,
                color: deleteAllConfirm ? '#f87171' : 'rgba(238,232,222,0.4)',
                fontFamily: C.mono, fontSize: '0.65rem',
                letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              <Trash2 style={{ width: '0.85rem', height: '0.85rem' }} />
              {deleteAllConfirm ? 'Confirm Delete All' : 'Delete All'}
            </button>
          )}
          <button
            onClick={() => { setEditTask(undefined); setShowCreate(true) }}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.6rem 1.2rem', background: C.orange, border: 'none',
              color: '#050505', fontFamily: C.mono, fontSize: '0.68rem',
              letterSpacing: '0.14em', textTransform: 'uppercase', cursor: 'pointer',
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          >
            <Plus className="w-4 h-4" />
            New Task
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: C.dim }} />
          <input
            value={filter.search}
            onChange={(e) => setFilter((f) => ({ ...f, search: e.target.value }))}
            placeholder="Search title, description, tags..."
            style={{
              width: '100%', boxSizing: 'border-box',
              background: 'rgba(255,255,255,0.03)', border: `1px solid ${C.rule}`,
              color: '#eee8de', padding: '0.55rem 0.75rem 0.55rem 2.5rem',
              fontFamily: C.mono, fontSize: '0.78rem', outline: 'none',
            }}
          />
        </div>

        <select
          value={filter.priority ?? ''}
          onChange={(e) => setFilter((f) => ({ ...f, priority: (e.target.value as Priority) || undefined }))}
          style={{
            background: 'rgba(255,255,255,0.03)', border: `1px solid ${C.rule}`,
            color: filter.priority ? C.orange : C.dim, padding: '0.55rem 0.75rem',
            fontFamily: C.mono, fontSize: '0.72rem', outline: 'none', cursor: 'pointer',
          }}
        >
          <option value="" style={{ background: '#0a0a08', color: '#eee8de' }}>All Priorities</option>
          {(['low', 'medium', 'high', 'urgent'] as Priority[]).map((p) => (
            <option key={p} value={p} style={{ background: '#0a0a08', color: '#eee8de' }}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
          ))}
        </select>

        <select
          value={filter.status ?? ''}
          onChange={(e) => setFilter((f) => ({ ...f, status: e.target.value || undefined }))}
          style={{
            background: 'rgba(255,255,255,0.03)', border: `1px solid ${C.rule}`,
            color: filter.status ? C.orange : C.dim, padding: '0.55rem 0.75rem',
            fontFamily: C.mono, fontSize: '0.72rem', outline: 'none', cursor: 'pointer',
          }}
        >
          <option value="" style={{ background: '#0a0a08', color: '#eee8de' }}>All Statuses</option>
          {['todo', 'in_progress', 'done'].map((s) => (
            <option key={s} value={s} style={{ background: '#0a0a08', color: '#eee8de' }}>{s.replace('_', ' ')}</option>
          ))}
        </select>

        {hasFilter && (
          <button
            onClick={() => setFilter({ search: '' })}
            style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', background: 'rgba(255,77,0,0.08)', border: `1px solid rgba(255,77,0,0.25)`, color: C.orange, padding: '0.5rem 0.75rem', fontFamily: C.mono, fontSize: '0.65rem', cursor: 'pointer', letterSpacing: '0.1em', textTransform: 'uppercase' }}
          >
            <X className="w-3 h-3" /> Clear
          </button>
        )}

        <div style={{ display: 'flex', border: `1px solid ${C.rule}`, marginLeft: 'auto', overflow: 'hidden' }}>
          {(['list', 'kanban'] as View[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              style={{
                padding: '0.5rem 1rem', fontFamily: C.mono, fontSize: '0.65rem',
                letterSpacing: '0.12em', textTransform: 'uppercase', cursor: 'pointer', border: 'none',
                background: view === v ? C.orange : 'transparent',
                color: view === v ? '#050505' : C.dim,
                transition: 'all 0.15s',
              }}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Task display */}
      <AnimatePresence mode="wait">
        {view === 'list' ? (
          <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {filtered.length === 0 ? (
              <div style={{ padding: '4rem 2rem', textAlign: 'center', border: `1px solid ${C.rule}`, background: 'rgba(255,255,255,0.02)' }}>
                <p style={{ color: 'rgba(238,232,222,0.2)', fontFamily: C.mono, fontSize: '0.78rem' }}>
                  {hasFilter ? 'No tasks match your filters' : 'No tasks yet — create your first one'}
                </p>
                {!hasFilter && (
                  <button
                    onClick={() => { setEditTask(undefined); setShowCreate(true) }}
                    style={{ marginTop: '1rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1.2rem', background: C.orange, border: 'none', color: '#050505', fontFamily: C.mono, fontSize: '0.65rem', letterSpacing: '0.14em', textTransform: 'uppercase', cursor: 'pointer' }}
                  >
                    <Plus className="w-4 h-4" /> Create Task
                  </button>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {daySections.map((section) => {
                  const isCollapsed = collapsed.has(section.key)
                  const info = section.dateStr ? formatDayLabel(section.dateStr) : null
                  const doneCount = section.tasks.filter(t => t.status === 'done').length

                  return (
                    <div key={section.key}>
                      {/* Day header */}
                      <button
                        onClick={() => toggleCollapse(section.key)}
                        style={{
                          width: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem',
                          background: 'none', border: 'none', cursor: 'pointer',
                          padding: '0 0 0.75rem 0', textAlign: 'left',
                          borderBottom: '1px solid rgba(255,255,255,0.07)',
                          marginBottom: '0.5rem',
                        }}
                      >
                        {/* Chevron */}
                        <span style={{ color: 'rgba(238,232,222,0.3)', flexShrink: 0 }}>
                          {isCollapsed
                            ? <ChevronRight style={{ width: '0.9rem', height: '0.9rem' }} />
                            : <ChevronDown style={{ width: '0.9rem', height: '0.9rem' }} />
                          }
                        </span>

                        {/* Calendar icon */}
                        <span style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          width: '1.75rem', height: '1.75rem', borderRadius: '0.4rem', flexShrink: 0,
                          background: info?.isToday ? 'rgba(255,77,0,0.15)' : info?.isPast ? 'rgba(248,113,113,0.1)' : 'rgba(255,255,255,0.06)',
                          border: `1px solid ${info?.isToday ? 'rgba(255,77,0,0.3)' : info?.isPast ? 'rgba(248,113,113,0.2)' : 'rgba(255,255,255,0.1)'}`,
                        }}>
                          <CalendarDays style={{
                            width: '0.85rem', height: '0.85rem',
                            color: info?.isToday ? C.orange : info?.isPast ? '#f87171' : 'rgba(238,232,222,0.4)',
                          }} />
                        </span>

                        {/* Date label */}
                        <div style={{ flex: 1 }}>
                          <span style={{
                            fontSize: '0.88rem', fontWeight: 700, letterSpacing: '-0.01em',
                            color: info?.isToday ? C.orange : info?.isPast ? '#f87171' : '#eee8de',
                          }}>
                            {info ? info.label : 'No Due Date'}
                          </span>
                          {info && (
                            <span style={{ marginLeft: '0.6rem', fontSize: '0.72rem', color: 'rgba(238,232,222,0.35)', fontFamily: C.mono }}>
                              {info.sub}
                            </span>
                          )}
                        </div>

                        {/* Task count badge */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                          {doneCount > 0 && (
                            <span style={{ fontSize: '0.65rem', fontFamily: C.mono, color: 'rgba(74,222,128,0.7)' }}>
                              {doneCount} done
                            </span>
                          )}
                          <span style={{
                            fontSize: '0.68rem', fontFamily: C.mono, fontWeight: 700,
                            color: 'rgba(238,232,222,0.4)',
                            background: 'rgba(255,255,255,0.06)',
                            padding: '0.1rem 0.55rem', borderRadius: '99px',
                            border: '1px solid rgba(255,255,255,0.08)',
                          }}>
                            {section.tasks.length}
                          </span>
                        </div>
                      </button>

                      {/* Tasks under this day */}
                      <AnimatePresence>
                        {!isCollapsed && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                            style={{ overflow: 'hidden' }}
                          >
                            <ColumnHeaders />
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                              {section.tasks.map((task) => (
                                <TaskCard
                                  key={task._id}
                                  task={task}
                                  onComplete={() => handleComplete(task._id)}
                                  onEdit={() => { setEditTask(task); setShowCreate(true) }}
                                  onDelete={() => setDeleteTask_modal(task)}
                                />
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )
                })}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div key="kanban" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <KanbanBoard tasks={filtered} onComplete={handleComplete} />
          </motion.div>
        )}
      </AnimatePresence>

      <CreateTaskModal
        open={showCreate}
        onClose={() => { setShowCreate(false); setEditTask(undefined) }}
        editTask={editTask}
      />

      <DeleteTaskModal
        task={deleteTask_modal}
        onConfirm={() => deleteTask_modal && handleDelete(deleteTask_modal._id)}
        onClose={() => setDeleteTask_modal(null)}
      />
    </div>
  )
}
