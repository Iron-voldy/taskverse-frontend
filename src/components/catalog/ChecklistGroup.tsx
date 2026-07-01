'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckSquare, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CheckItem {
  id: string
  label: string
  done?: boolean
}

interface Group {
  id: string
  title: string
  items: CheckItem[]
  color?: string
}

interface Props {
  groups?: Group[]
  items?: CheckItem[]  // AI may pass flat items instead of groups
  title?: string
}

export function ChecklistGroup({ groups, items, title }: Props) {
  // AI may pass `items` (flat) instead of `groups` — normalise both
  const safeGroups: Group[] = Array.isArray(groups) && groups.length > 0
    ? groups.map((g) => ({ ...g, items: Array.isArray(g.items) ? g.items : [] }))
    : Array.isArray(items) && items.length > 0
    ? [{ id: 'default', title: title ?? 'Checklist', items, color: '#ff4d00' }]
    : []

  const [expanded, setExpanded] = useState<Set<string>>(new Set(safeGroups.map((g) => g.id)))
  const [checked, setChecked] = useState<Set<string>>(
    new Set(safeGroups.flatMap((g) => g.items.filter((i) => i.done).map((i) => i.id)))
  )

  const toggle = (id: string) =>
    setChecked((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  const toggleGroup = (id: string) =>
    setExpanded((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })

  return (
    <div>
      {title && (
        <div className="flex items-center gap-2 mb-4">
          <CheckSquare className="w-4 h-4 text-brand-400" />
          <h3 className="font-semibold text-white/90">{title}</h3>
        </div>
      )}
      <div className="space-y-3">
        {safeGroups.map((group) => {
          const doneCount = group.items.filter((i) => checked.has(i.id)).length
          const isOpen = expanded.has(group.id)
          return (
            <div key={group.id} className="glass rounded-xl overflow-hidden">
              <button
                onClick={() => toggleGroup(group.id)}
                className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: group.color ?? '#8b5cf6' }} />
                  <span className="font-medium text-sm">{group.title}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-white/40">{doneCount}/{group.items.length}</span>
                  <ChevronDown className={cn('w-4 h-4 text-white/30 transition-transform', isOpen && 'rotate-180')} />
                </div>
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 space-y-2">
                      {group.items.map((item) => (
                        <label key={item.id} className="flex items-center gap-3 cursor-pointer group">
                          <div
                            onClick={() => toggle(item.id)}
                            className={cn(
                              'w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-all',
                              checked.has(item.id)
                                ? 'bg-violet-500 border-violet-500'
                                : 'border-white/20 hover:border-violet-400'
                            )}
                          >
                            {checked.has(item.id) && (
                              <svg viewBox="0 0 12 12" className="w-3 h-3 text-white" fill="none">
                                <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                              </svg>
                            )}
                          </div>
                          <span className={cn('text-sm', checked.has(item.id) ? 'line-through text-white/30' : 'text-white/80')}>
                            {item.label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}
        {safeGroups.length === 0 && <p className="text-white/30 text-sm text-center py-4">No checklists yet</p>}
      </div>
    </div>
  )
}
