'use client'

import { motion } from 'framer-motion'
import { CheckCircle2, Circle, Calendar, Tag, Clock, Pencil, Trash2, AlertTriangle } from 'lucide-react'
import { cn, formatDate, isOverdue } from '@/lib/utils'
import type { Task } from '@/types'

interface Props {
  task?: Task
  title?: string
  priority?: string
  dueDate?: string
  tags?: string[]
  estimatedMinutes?: number
  onComplete?: () => void
  onEdit?: () => void
  onDelete?: () => void
  /** compact = kanban card style, row = full-width table row (default) */
  variant?: 'row' | 'card'
  className?: string
}

const PRIORITY_BADGE: Record<string, { bg: string; color: string; border: string; label: string }> = {
  urgent: { bg: 'rgba(239,68,68,0.12)',  color: '#f87171', border: 'rgba(239,68,68,0.3)',  label: 'Urgent' },
  high:   { bg: 'rgba(255,77,0,0.12)',   color: '#ff7040', border: 'rgba(255,77,0,0.3)',   label: 'High'   },
  medium: { bg: 'rgba(234,179,8,0.12)',  color: '#facc15', border: 'rgba(234,179,8,0.3)',  label: 'Mid'    },
  low:    { bg: 'rgba(34,197,94,0.12)',  color: '#4ade80', border: 'rgba(34,197,94,0.3)',  label: 'Low'    },
}

const PRIORITY_BAR: Record<string, string> = {
  urgent: '#ef4444',
  high:   '#ff4d00',
  medium: '#eab308',
  low:    '#22c55e',
}

const TAG_COLOR: Record<string, { bg: string; color: string }> = {
  work:     { bg: 'rgba(59,130,246,0.14)', color: '#60a5fa' },
  health:   { bg: 'rgba(34,197,94,0.14)',  color: '#4ade80' },
  personal: { bg: 'rgba(168,85,247,0.14)', color: '#c084fc' },
  study:    { bg: 'rgba(234,179,8,0.14)',  color: '#facc15' },
  finance:  { bg: 'rgba(20,184,166,0.14)', color: '#2dd4bf' },
}

function tagStyle(tag: string) {
  return TAG_COLOR[tag.toLowerCase()] ?? { bg: 'rgba(255,255,255,0.08)', color: 'rgba(238,232,222,0.5)' }
}

function fmtMins(m: number) {
  return m < 60 ? `${m}m` : `${Math.floor(m / 60)}h${m % 60 ? ` ${m % 60}m` : ''}`
}

export function TaskCard({
  task, title, priority, dueDate, tags, estimatedMinutes,
  onComplete, onEdit, onDelete,
  variant = 'row', className,
}: Props) {
  const t = task ?? { title, priority: priority ?? 'medium', dueDate, tags: tags ?? [], status: 'todo', estimatedMinutes } as Partial<Task>
  const overdue = isOverdue(t.dueDate)
  const done = t.status === 'done'
  const est = t.estimatedMinutes ?? estimatedMinutes
  const bar = PRIORITY_BAR[t.priority ?? 'medium'] ?? PRIORITY_BAR.medium
  const badge = PRIORITY_BADGE[t.priority ?? 'medium'] ?? PRIORITY_BADGE.medium

  // ── CARD variant (kanban) ────────────────────────────────────────────────────
  if (variant === 'card') {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className={cn('group', className)}
        style={{
          background: done ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '0.75rem',
          borderLeft: `3px solid ${bar}`,
          opacity: done ? 0.6 : 1,
          overflow: 'hidden',
        }}
      >
        {/* Top row: checkbox + title + actions */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', padding: '0.75rem 0.75rem 0.5rem' }}>
          <button
            onClick={(e) => { e.stopPropagation(); onComplete?.() }}
            style={{
              flexShrink: 0, marginTop: '1px',
              background: 'none', border: 'none', cursor: onComplete ? 'pointer' : 'default',
              color: done ? bar : 'rgba(238,232,222,0.22)', padding: 0, lineHeight: 0,
              transition: 'color 0.15s',
            }}
          >
            {done
              ? <CheckCircle2 style={{ width: '0.95rem', height: '0.95rem' }} />
              : <Circle style={{ width: '0.95rem', height: '0.95rem' }} />
            }
          </button>

          <p style={{
            flex: 1, fontSize: '0.82rem', fontWeight: 600, lineHeight: 1.4,
            color: done ? 'rgba(238,232,222,0.3)' : '#eee8de',
            textDecoration: done ? 'line-through' : 'none',
            wordBreak: 'break-word',
          }}>
            {t.title}
          </p>

          {/* Actions — visible on hover */}
          {(onEdit || onDelete) && (
            <div style={{ display: 'flex', gap: '0.15rem', flexShrink: 0, opacity: 0, transition: 'opacity 0.15s' }}
              className="group-hover:opacity-100">
              {onEdit && (
                <button onClick={(e) => { e.stopPropagation(); onEdit() }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.2rem', color: 'rgba(238,232,222,0.3)', borderRadius: '0.3rem', lineHeight: 0, transition: 'all 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#ff4d00'; e.currentTarget.style.background = 'rgba(255,77,0,0.12)' }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'rgba(238,232,222,0.3)'; e.currentTarget.style.background = 'none' }}>
                  <Pencil style={{ width: '0.7rem', height: '0.7rem' }} />
                </button>
              )}
              {onDelete && (
                <button onClick={(e) => { e.stopPropagation(); onDelete() }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.2rem', color: 'rgba(238,232,222,0.3)', borderRadius: '0.3rem', lineHeight: 0, transition: 'all 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#f87171'; e.currentTarget.style.background = 'rgba(248,113,113,0.12)' }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'rgba(238,232,222,0.3)'; e.currentTarget.style.background = 'none' }}>
                  <Trash2 style={{ width: '0.7rem', height: '0.7rem' }} />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Description */}
        {t.description && (
          <p style={{
            fontSize: '0.72rem', color: 'rgba(238,232,222,0.38)', lineHeight: 1.45,
            padding: '0 0.75rem 0.5rem 2.2rem',
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {t.description}
          </p>
        )}

        {/* Bottom meta row */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap',
          padding: '0.5rem 0.75rem 0.65rem',
          borderTop: '1px solid rgba(255,255,255,0.05)',
        }}>
          {/* Priority pill */}
          <span style={{
            fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
            color: badge.color, background: badge.bg, border: `1px solid ${badge.border}`,
            padding: '0.1rem 0.45rem', borderRadius: '99px',
          }}>
            {badge.label}
          </span>

          {/* Overdue */}
          {overdue && !done && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.15rem',
              fontSize: '0.6rem', fontWeight: 700, color: '#f87171',
              background: 'rgba(248,113,113,0.1)', padding: '0.1rem 0.4rem', borderRadius: '99px',
            }}>
              <AlertTriangle style={{ width: '0.55rem', height: '0.55rem' }} /> overdue
            </span>
          )}

          {/* Due date */}
          {t.dueDate && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.68rem',
              color: overdue && !done ? '#f87171' : 'rgba(238,232,222,0.38)',
              marginLeft: 'auto',
            }}>
              <Calendar style={{ width: '0.65rem', height: '0.65rem' }} />
              {formatDate(t.dueDate)}
            </span>
          )}

          {/* Time */}
          {est && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.68rem', color: 'rgba(255,77,0,0.55)' }}>
              <Clock style={{ width: '0.65rem', height: '0.65rem' }} />
              {fmtMins(est)}
            </span>
          )}
        </div>

        {/* Tags row */}
        {(t.tags?.length ?? 0) > 0 && (
          <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', padding: '0 0.75rem 0.65rem' }}>
            {t.tags?.slice(0, 3).map((tag) => {
              const s = tagStyle(tag)
              return (
                <span key={tag} style={{
                  fontSize: '0.62rem', fontWeight: 600, color: s.color, background: s.bg,
                  padding: '0.1rem 0.45rem', borderRadius: '99px',
                }}>
                  {tag}
                </span>
              )
            })}
          </div>
        )}
      </motion.div>
    )
  }

  // ── ROW variant (list view, default) ─────────────────────────────────────────
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -8 }}
      className={cn('group', className)}
      style={{
        display: 'flex', alignItems: 'center', minHeight: '3.5rem',
        background: done ? 'rgba(255,255,255,0.015)' : 'rgba(255,255,255,0.035)',
        border: '1px solid rgba(255,255,255,0.07)', borderRadius: '0.75rem',
        overflow: 'hidden', transition: 'background 0.15s',
      }}
    >
      {/* Priority bar */}
      <div style={{ width: '3px', alignSelf: 'stretch', background: bar, opacity: done ? 0.2 : 0.75, flexShrink: 0 }} />

      {/* Checkbox */}
      <button
        onClick={(e) => { e.stopPropagation(); onComplete?.() }}
        style={{
          flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: '2.75rem', alignSelf: 'stretch',
          background: 'none', border: 'none', cursor: onComplete ? 'pointer' : 'default',
          color: done ? bar : 'rgba(238,232,222,0.2)', transition: 'color 0.15s',
        }}
      >
        {done
          ? <CheckCircle2 style={{ width: '1.05rem', height: '1.05rem' }} />
          : <Circle style={{ width: '1.05rem', height: '1.05rem' }} />
        }
      </button>

      {/* Title column */}
      <div style={{ flex: 1, minWidth: 0, padding: '0.75rem 1rem 0.75rem 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{
            fontSize: '0.875rem', fontWeight: 600, letterSpacing: '-0.01em',
            color: done ? 'rgba(238,232,222,0.28)' : '#eee8de',
            textDecoration: done ? 'line-through' : 'none',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {t.title}
          </span>
          {overdue && !done && (
            <span style={{
              flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: '0.2rem',
              fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
              color: '#f87171', background: 'rgba(248,113,113,0.1)',
              padding: '0.15rem 0.45rem', borderRadius: '99px', border: '1px solid rgba(248,113,113,0.25)',
            }}>
              <AlertTriangle style={{ width: '0.55rem', height: '0.55rem' }} /> overdue
            </span>
          )}
        </div>
        {t.description && (
          <p style={{
            fontSize: '0.72rem', color: 'rgba(238,232,222,0.35)', marginTop: '0.15rem',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {t.description}
          </p>
        )}
        {est && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.2rem', fontSize: '0.68rem', color: 'rgba(255,77,0,0.55)' }}>
            <Clock style={{ width: '0.65rem', height: '0.65rem' }} />
            {fmtMins(est)}
          </span>
        )}
      </div>

      {/* Due date column */}
      <div style={{ width: '7.5rem', flexShrink: 0, paddingRight: '0.5rem' }}>
        {t.dueDate ? (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: overdue && !done ? '#f87171' : 'rgba(238,232,222,0.45)' }}>
            <Calendar style={{ width: '0.75rem', height: '0.75rem', flexShrink: 0 }} />
            {formatDate(t.dueDate)}
          </span>
        ) : (
          <span style={{ fontSize: '0.72rem', color: 'rgba(238,232,222,0.15)' }}>—</span>
        )}
      </div>

      {/* Tags column */}
      <div style={{ width: '8rem', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '0.3rem', paddingRight: '0.5rem', overflow: 'hidden' }}>
        {(t.tags?.length ?? 0) === 0 && (
          <span style={{ fontSize: '0.72rem', color: 'rgba(238,232,222,0.15)' }}>—</span>
        )}
        {t.tags?.slice(0, 2).map((tag) => {
          const s = tagStyle(tag)
          return (
            <span key={tag} style={{
              fontSize: '0.68rem', fontWeight: 600, color: s.color, background: s.bg,
              padding: '0.2rem 0.55rem', borderRadius: '99px', whiteSpace: 'nowrap',
            }}>
              {tag}
            </span>
          )
        })}
        {(t.tags?.length ?? 0) > 2 && (
          <span style={{ fontSize: '0.65rem', color: 'rgba(238,232,222,0.25)' }}>+{(t.tags?.length ?? 0) - 2}</span>
        )}
      </div>

      {/* Priority column */}
      <div style={{ width: '5.5rem', flexShrink: 0, paddingRight: '0.5rem' }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center',
          fontSize: '0.7rem', fontWeight: 700,
          color: badge.color, background: badge.bg,
          padding: '0.25rem 0.65rem', borderRadius: '99px',
          border: `1px solid ${badge.border}`, letterSpacing: '0.03em',
        }}>
          {badge.label}
        </span>
      </div>

      {/* Actions column */}
      {(onEdit || onDelete) && (
        <div style={{ width: '4.5rem', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.2rem', paddingRight: '0.75rem' }}>
          {onEdit && (
            <button
              onClick={(e) => { e.stopPropagation(); onEdit() }}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: '1.75rem', height: '1.75rem', borderRadius: '0.4rem',
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                cursor: 'pointer', color: 'rgba(238,232,222,0.45)', transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.color = '#ff4d00'; e.currentTarget.style.background = 'rgba(255,77,0,0.14)'; e.currentTarget.style.borderColor = 'rgba(255,77,0,0.3)' }}
              onMouseLeave={e => { e.currentTarget.style.color = 'rgba(238,232,222,0.45)'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}
            >
              <Pencil style={{ width: '0.75rem', height: '0.75rem' }} />
            </button>
          )}
          {onDelete && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete() }}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: '1.75rem', height: '1.75rem', borderRadius: '0.4rem',
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                cursor: 'pointer', color: 'rgba(238,232,222,0.45)', transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.color = '#f87171'; e.currentTarget.style.background = 'rgba(248,113,113,0.14)'; e.currentTarget.style.borderColor = 'rgba(248,113,113,0.3)' }}
              onMouseLeave={e => { e.currentTarget.style.color = 'rgba(238,232,222,0.45)'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}
            >
              <Trash2 style={{ width: '0.75rem', height: '0.75rem' }} />
            </button>
          )}
        </div>
      )}
    </motion.div>
  )
}
