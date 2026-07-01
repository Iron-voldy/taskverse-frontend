'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Trash2, X, AlertTriangle } from 'lucide-react'
import type { Task } from '@/types'

interface Props {
  task: Task | null
  onConfirm: () => void
  onClose: () => void
}

const PRIORITY_STYLE: Record<string, string> = {
  urgent: 'bg-red-500/10 text-red-400 ring-1 ring-red-500/25',
  high:   'bg-orange-500/10 text-orange-400 ring-1 ring-orange-500/25',
  medium: 'bg-yellow-500/10 text-yellow-400 ring-1 ring-yellow-500/25',
  low:    'bg-green-500/10 text-green-400 ring-1 ring-green-500/25',
}

export function DeleteTaskModal({ task, onConfirm, onClose }: Props) {
  return (
    <AnimatePresence>
      {task && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9998,
              background: 'rgba(5,5,5,0.8)',
              backdropFilter: 'blur(6px)',
              WebkitBackdropFilter: 'blur(6px)',
            }}
          />

          {/* Centering container — pure CSS, no transform magic */}
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1rem',
              pointerEvents: 'none',
            }}
          >
            {/* Animated modal — only scale/opacity, centering handled by parent flex */}
            <motion.div
              key="modal"
              initial={{ opacity: 0, scale: 0.93, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.93, y: 10 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              style={{
                width: '100%',
                maxWidth: '420px',
                pointerEvents: 'auto',
              }}
            >
              <div style={{
                background: 'rgba(10,10,8,0.98)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '1.25rem',
                padding: '1.75rem',
                boxShadow: '0 32px 80px rgba(0,0,0,0.7)',
              }}>

                {/* Icon + title */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                    <div style={{
                      width: '2.5rem', height: '2.5rem', borderRadius: '0.75rem',
                      background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <AlertTriangle style={{ width: '1rem', height: '1rem', color: '#f87171' }} />
                    </div>
                    <div>
                      <p style={{ fontWeight: 700, color: '#eee8de', fontSize: '1rem', lineHeight: 1.3 }}>Delete Task?</p>
                      <p style={{ fontSize: '0.72rem', color: 'rgba(238,232,222,0.4)', marginTop: '0.2rem' }}>This cannot be undone</p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(238,232,222,0.3)', padding: '0.25rem', lineHeight: 0 }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#eee8de')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'rgba(238,232,222,0.3)')}
                  >
                    <X style={{ width: '1rem', height: '1rem' }} />
                  </button>
                </div>

                {/* Task preview */}
                <div style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: '0.875rem',
                  padding: '1rem 1.125rem',
                  marginBottom: '1.5rem',
                }}>
                  <p style={{ color: '#eee8de', fontWeight: 600, fontSize: '0.9rem', lineHeight: 1.4, marginBottom: '0.35rem' }}>
                    {task.title}
                  </p>
                  {task.description && (
                    <p style={{
                      color: 'rgba(238,232,222,0.4)', fontSize: '0.78rem', lineHeight: 1.5, marginBottom: '0.6rem',
                      display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                    }}>
                      {task.description}
                    </p>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span
                      style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '0.2rem 0.6rem', borderRadius: '99px' }}
                      className={PRIORITY_STYLE[task.priority]}
                    >
                      {task.priority}
                    </span>
                    {task.dueDate && (
                      <span style={{ fontSize: '0.72rem', color: 'rgba(238,232,222,0.35)' }}>
                        Due {new Date(task.dueDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    )}
                  </div>
                </div>

                {/* Buttons */}
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    onClick={onClose}
                    style={{
                      flex: 1, padding: '0.75rem', borderRadius: '0.75rem',
                      background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)',
                      color: 'rgba(238,232,222,0.6)', fontSize: '0.85rem', fontWeight: 500,
                      cursor: 'pointer', transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => { onConfirm(); onClose() }}
                    style={{
                      flex: 1, padding: '0.75rem', borderRadius: '0.75rem',
                      background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.35)',
                      color: '#f87171', fontSize: '0.85rem', fontWeight: 600,
                      cursor: 'pointer', transition: 'background 0.15s',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.28)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.15)')}
                  >
                    <Trash2 style={{ width: '0.9rem', height: '0.9rem' }} />
                    Delete
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
