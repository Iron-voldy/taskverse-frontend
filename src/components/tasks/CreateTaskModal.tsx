'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, Loader2, Sparkles, Clock, Tag } from 'lucide-react'
import { toast } from 'sonner'
import { useTaskStore } from '@/store/useTaskStore'
import { useGhostAutocomplete } from '@/hooks/useGhostAutocomplete'
import { tasksApi } from '@/lib/api'
import type { Priority, Task } from '@/types'

const C = {
  bg: '#050505',
  text: '#eee8de',
  dim: 'rgba(238,232,222,0.45)',
  orange: '#ff4d00',
  rule: 'rgba(255,255,255,0.07)',
  glass: 'rgba(255,255,255,0.04)',
  mono: '"Courier New", Courier, monospace',
}

interface Props {
  open: boolean
  onClose: () => void
  editTask?: Task
}

interface FormErrors {
  title?: string
  dueDate?: string
}

const PRIORITIES: Priority[] = ['low', 'medium', 'high', 'urgent']
const PRIORITY_COLORS: Record<Priority, string> = {
  low: '#4ade80',
  medium: '#facc15',
  high: '#fb923c',
  urgent: '#f87171',
}

function formatMinutes(m: number): string {
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  const rem = m % 60
  return rem ? `${h}h ${rem}m` : `${h}h`
}

export function CreateTaskModal({ open, onClose, editTask }: Props) {
  const { createTask, updateTask, lists } = useTaskStore()
  const isEdit = !!editTask

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<Priority>('medium')
  const [dueDate, setDueDate] = useState('')
  const [dueTime, setDueTime] = useState('')
  const [estimatedMinutes, setEstimatedMinutes] = useState<number>(30)
  const [listId, setListId] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [errors, setErrors] = useState<FormErrors>({})
  const [loading, setLoading] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const { ghost } = useGhostAutocomplete(title)

  // Populate form when editing
  useEffect(() => {
    if (editTask) {
      setTitle(editTask.title)
      setDescription(editTask.description ?? '')
      setPriority(editTask.priority)
      if (editTask.dueDate) {
        const d = new Date(editTask.dueDate)
        setDueDate(d.toISOString().split('T')[0])
        const h = d.getHours().toString().padStart(2, '0')
        const min = d.getMinutes().toString().padStart(2, '0')
        if (h !== '00' || min !== '00') setDueTime(`${h}:${min}`)
      }
      setEstimatedMinutes(editTask.estimatedMinutes ?? 30)
      setListId(editTask.listId ?? '')
      setTags(editTask.tags ?? [])
    } else {
      setTitle('')
      setDescription('')
      setPriority('medium')
      setDueDate('')
      setDueTime('')
      setEstimatedMinutes(30)
      setListId('')
      setTags([])
      setTagInput('')
      setErrors({})
    }
  }, [editTask, open])

  function validate(): boolean {
    const errs: FormErrors = {}
    if (!title.trim()) { errs.title = 'Title is required'; setErrors(errs); return false }
    if (title.trim().length < 3) { errs.title = 'Title must be at least 3 characters'; setErrors(errs); return false }
    if (dueDate) {
      const today = new Date(); today.setHours(0, 0, 0, 0)
      if (new Date(dueDate) < today) { errs.dueDate = 'Due date cannot be in the past'; setErrors(errs); return false }
    }
    setErrors({})
    return true
  }

  async function handleAiSuggest() {
    if (!title.trim()) { toast.error('Enter a task title first'); return }
    setAiLoading(true)
    try {
      const suggestion = await tasksApi.suggest(
        title.trim(),
        description || undefined,
        lists.map((l) => ({ _id: l._id, name: l.name })),
      )
      const filled: string[] = []
      if (suggestion.priority && suggestion.priority !== priority) {
        setPriority(suggestion.priority as Priority)
        filled.push(`priority → ${suggestion.priority}`)
      }
      if (suggestion.estimatedMinutes && suggestion.estimatedMinutes !== estimatedMinutes) {
        setEstimatedMinutes(suggestion.estimatedMinutes)
        const t = suggestion.estimatedMinutes
        filled.push(`time → ${t < 60 ? `${t}m` : `${Math.floor(t / 60)}h${t % 60 ? ` ${t % 60}m` : ''}` }`)
      }
      if (suggestion.listId) {
        setListId(suggestion.listId)
        filled.push('list')
      }
      if (suggestion.tags?.length) {
        setTags((prev) => [...new Set([...prev, ...suggestion.tags])])
        filled.push(`tags → ${suggestion.tags.join(', ')}`)
      }
      if (filled.length > 0) {
        toast.success(`AI filled: ${filled.join(' · ')}`)
      } else {
        toast.success('AI confirmed current values look good')
      }
    } catch {
      toast.error('AI suggest failed — try again')
    } finally {
      setAiLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)

    // Build due date with optional time
    let dueDateISO: string | undefined
    if (dueDate) {
      const dt = dueTime ? `${dueDate}T${dueTime}:00` : `${dueDate}T23:59:00`
      dueDateISO = new Date(dt).toISOString()
    }

    const payload = {
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      dueDate: dueDateISO,
      estimatedMinutes: estimatedMinutes > 0 ? estimatedMinutes : undefined,
      tags,
      listId: listId || undefined,
    }

    try {
      if (isEdit && editTask) {
        await updateTask(editTask._id, payload)
        toast.success('Task updated')
      } else {
        await createTask(payload)
        toast.success('Task created! +XP incoming')
      }
      onClose()
    } catch {
      toast.error(isEdit ? 'Failed to update task' : 'Failed to create task')
    } finally {
      setLoading(false)
    }
  }

  function addTag() {
    const t = tagInput.trim().toLowerCase().replace(/\s+/g, '-')
    if (t && !tags.includes(t) && tags.length < 5) {
      setTags([...tags, t])
      setTagInput('')
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40"
            style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
            onClick={onClose}
          />
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: 'fixed', left: '50%', top: '50%', x: '-50%', y: '-50%',
              width: '100%', maxWidth: '34rem', zIndex: 50,
              maxHeight: '90vh', overflowY: 'auto',
            }}
          >
            <div style={{ margin: '0 1rem', background: '#0a0a08', border: `1px solid ${C.rule}`, borderTop: `2px solid ${C.orange}` }}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 1.5rem', borderBottom: `1px solid ${C.rule}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ display: 'inline-block', width: 8, height: 8, background: C.orange }} />
                  <h2 style={{ fontFamily: C.mono, fontSize: '0.72rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: C.text, fontWeight: 600 }}>
                    {isEdit ? 'Edit Task' : 'New Task'}
                  </h2>
                </div>
                <button
                  onClick={onClose}
                  style={{ background: 'none', border: 'none', color: C.dim, cursor: 'pointer', lineHeight: 0, padding: '0.25rem' }}
                  onMouseEnter={e => (e.currentTarget.style.color = C.text)}
                  onMouseLeave={e => (e.currentTarget.style.color = C.dim)}
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSubmit} style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>

                {/* Title */}
                <div>
                  <div style={{ position: 'relative' }}>
                    <input
                      value={title}
                      onChange={(e) => { setTitle(e.target.value); setErrors((p) => ({ ...p, title: undefined })) }}
                      onKeyDown={(e) => { if (e.key === 'Tab' && ghost) { e.preventDefault(); setTitle(ghost) } }}
                      placeholder="Task title..."
                      autoFocus
                      style={{
                        width: '100%', boxSizing: 'border-box',
                        background: C.glass, border: `1px solid ${errors.title ? '#f87171' : C.rule}`,
                        color: C.text, padding: '0.65rem 1rem', fontFamily: C.mono, fontSize: '0.85rem',
                        outline: 'none', transition: 'border-color 0.2s',
                      }}
                      onFocus={e => { if (!errors.title) e.currentTarget.style.borderColor = C.orange }}
                      onBlur={e => { if (!errors.title) e.currentTarget.style.borderColor = C.rule }}
                    />
                    {ghost && ghost !== title && (
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', padding: '0.65rem 1rem', pointerEvents: 'none' }}>
                        <span style={{ visibility: 'hidden', fontFamily: C.mono, fontSize: '0.85rem' }}>{title}</span>
                        <span style={{ color: 'rgba(238,232,222,0.2)', fontFamily: C.mono, fontSize: '0.85rem' }}>{ghost.slice(title.length)}</span>
                      </div>
                    )}
                  </div>
                  {errors.title && <p style={{ color: '#f87171', fontSize: '0.7rem', fontFamily: C.mono, marginTop: '0.3rem' }}>{errors.title}</p>}
                  {ghost && ghost !== title && !errors.title && (
                    <p style={{ color: 'rgba(238,232,222,0.2)', fontSize: '0.65rem', fontFamily: C.mono, marginTop: '0.3rem' }}>↹ Tab to accept suggestion</p>
                  )}
                </div>

                {/* Description */}
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Description (optional)"
                  rows={2}
                  style={{
                    width: '100%', boxSizing: 'border-box', resize: 'vertical',
                    background: C.glass, border: `1px solid ${C.rule}`,
                    color: C.text, padding: '0.65rem 1rem', fontFamily: C.mono, fontSize: '0.82rem',
                    outline: 'none',
                  }}
                  onFocus={e => (e.currentTarget.style.borderColor = C.orange)}
                  onBlur={e => (e.currentTarget.style.borderColor = C.rule)}
                />

                {/* AI Suggest button */}
                <button
                  type="button"
                  onClick={handleAiSuggest}
                  disabled={aiLoading || !title.trim()}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center',
                    width: '100%', padding: '0.6rem', fontFamily: C.mono, fontSize: '0.68rem',
                    letterSpacing: '0.18em', textTransform: 'uppercase', cursor: 'pointer',
                    border: `1px dashed ${aiLoading ? 'rgba(255,77,0,0.3)' : 'rgba(255,77,0,0.5)'}`,
                    background: 'rgba(255,77,0,0.05)', color: aiLoading ? 'rgba(255,77,0,0.5)' : C.orange,
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => { if (!aiLoading && title.trim()) e.currentTarget.style.background = 'rgba(255,77,0,0.1)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,77,0,0.05)' }}
                >
                  {aiLoading ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
                  {aiLoading ? 'AI thinking...' : 'AI Auto-fill Priority · Time · List · Tags'}
                </button>

                {/* Priority */}
                <div>
                  <label style={{ display: 'block', fontFamily: C.mono, fontSize: '0.6rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: C.dim, marginBottom: '0.5rem' }}>Priority</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {PRIORITIES.map((p) => (
                      <button
                        key={p} type="button" onClick={() => setPriority(p)}
                        style={{
                          flex: 1, padding: '0.55rem 0', fontFamily: C.mono, fontSize: '0.65rem',
                          letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer',
                          border: `1px solid ${priority === p ? PRIORITY_COLORS[p] : C.rule}`,
                          background: priority === p ? `${PRIORITY_COLORS[p]}18` : 'transparent',
                          color: priority === p ? PRIORITY_COLORS[p] : C.dim,
                          transition: 'all 0.15s',
                        }}
                      >
                        {p[0].toUpperCase() + p.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Due date + time */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontFamily: C.mono, fontSize: '0.6rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: C.dim, marginBottom: '0.5rem' }}>Due Date</label>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => { setDueDate(e.target.value); setErrors((p) => ({ ...p, dueDate: undefined })) }}
                      style={{
                        width: '100%', boxSizing: 'border-box',
                        background: C.glass, border: `1px solid ${errors.dueDate ? '#f87171' : C.rule}`,
                        color: C.text, padding: '0.55rem 0.75rem', fontFamily: C.mono, fontSize: '0.78rem', outline: 'none',
                      }}
                      onFocus={e => { if (!errors.dueDate) e.currentTarget.style.borderColor = C.orange }}
                      onBlur={e => { if (!errors.dueDate) e.currentTarget.style.borderColor = C.rule }}
                    />
                    {errors.dueDate && <p style={{ color: '#f87171', fontSize: '0.65rem', fontFamily: C.mono, marginTop: '0.3rem' }}>{errors.dueDate}</p>}
                  </div>
                  <div>
                    <label style={{ display: 'block', fontFamily: C.mono, fontSize: '0.6rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: C.dim, marginBottom: '0.5rem' }}>Due Time</label>
                    <input
                      type="time"
                      value={dueTime}
                      onChange={(e) => setDueTime(e.target.value)}
                      style={{
                        width: '100%', boxSizing: 'border-box',
                        background: C.glass, border: `1px solid ${C.rule}`,
                        color: C.text, padding: '0.55rem 0.75rem', fontFamily: C.mono, fontSize: '0.78rem', outline: 'none',
                      }}
                      onFocus={e => (e.currentTarget.style.borderColor = C.orange)}
                      onBlur={e => (e.currentTarget.style.borderColor = C.rule)}
                    />
                  </div>
                </div>

                {/* Estimated time */}
                <div>
                  <label style={{ display: 'block', fontFamily: C.mono, fontSize: '0.6rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: C.dim, marginBottom: '0.5rem' }}>
                    <Clock size={10} style={{ display: 'inline', marginRight: '0.4rem' }} />
                    Estimated Time — <span style={{ color: C.orange }}>{formatMinutes(estimatedMinutes)}</span>
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <input
                      type="range" min={5} max={480} step={5}
                      value={estimatedMinutes}
                      onChange={(e) => setEstimatedMinutes(Number(e.target.value))}
                      style={{ flex: 1, accentColor: C.orange }}
                    />
                    <input
                      type="number" min={5} max={480}
                      value={estimatedMinutes}
                      onChange={(e) => setEstimatedMinutes(Math.min(480, Math.max(5, Number(e.target.value) || 5)))}
                      style={{
                        width: 64, background: C.glass, border: `1px solid ${C.rule}`,
                        color: C.text, padding: '0.4rem 0.5rem', fontFamily: C.mono, fontSize: '0.78rem',
                        outline: 'none', textAlign: 'center',
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: C.mono, fontSize: '0.55rem', color: 'rgba(238,232,222,0.2)', marginTop: '0.25rem' }}>
                    {['5m', '30m', '1h', '2h', '4h', '8h'].map((l) => <span key={l}>{l}</span>)}
                  </div>
                </div>

                {/* List */}
                {lists.length > 0 && (
                  <div>
                    <label style={{ display: 'block', fontFamily: C.mono, fontSize: '0.6rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: C.dim, marginBottom: '0.5rem' }}>List</label>
                    <select
                      value={listId}
                      onChange={(e) => setListId(e.target.value)}
                      style={{
                        width: '100%', background: C.glass, border: `1px solid ${C.rule}`,
                        color: C.text, padding: '0.55rem 0.75rem', fontFamily: C.mono, fontSize: '0.78rem', outline: 'none',
                      }}
                      onFocus={e => (e.currentTarget.style.borderColor = C.orange)}
                      onBlur={e => (e.currentTarget.style.borderColor = C.rule)}
                    >
                      <option value="" style={{ background: '#0a0a08' }}>— No list —</option>
                      {lists.map((l) => (
                        <option key={l._id} value={l._id} style={{ background: '#0a0a08' }}>{l.icon} {l.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Tags */}
                <div>
                  <label style={{ display: 'block', fontFamily: C.mono, fontSize: '0.6rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: C.dim, marginBottom: '0.5rem' }}>
                    <Tag size={10} style={{ display: 'inline', marginRight: '0.4rem' }} />
                    Tags {tags.length > 0 && <span style={{ color: C.orange }}>({tags.length}/5)</span>}
                  </label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }}
                      placeholder="Add tag, press Enter"
                      disabled={tags.length >= 5}
                      style={{
                        flex: 1, background: C.glass, border: `1px solid ${C.rule}`,
                        color: C.text, padding: '0.5rem 0.75rem', fontFamily: C.mono, fontSize: '0.75rem', outline: 'none',
                      }}
                      onFocus={e => (e.currentTarget.style.borderColor = C.orange)}
                      onBlur={e => (e.currentTarget.style.borderColor = C.rule)}
                    />
                    <button
                      type="button" onClick={addTag} disabled={!tagInput.trim() || tags.length >= 5}
                      style={{ padding: '0.5rem 0.75rem', background: 'rgba(255,77,0,0.12)', border: `1px solid rgba(255,77,0,0.3)`, color: C.orange, cursor: 'pointer', fontFamily: C.mono, fontSize: '0.65rem' }}
                    >
                      Add
                    </button>
                  </div>
                  {tags.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.5rem' }}>
                      {tags.map((t) => (
                        <span
                          key={t}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontFamily: C.mono, fontSize: '0.65rem', letterSpacing: '0.1em', padding: '0.2rem 0.5rem', border: `1px solid rgba(255,77,0,0.3)`, color: C.orange, background: 'rgba(255,77,0,0.06)' }}
                        >
                          #{t}
                          <button
                            type="button"
                            onClick={() => setTags(tags.filter((x) => x !== t))}
                            style={{ background: 'none', border: 'none', color: 'rgba(255,77,0,0.6)', cursor: 'pointer', lineHeight: 0, padding: 0 }}
                          >
                            <X size={10} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '0.5rem', borderTop: `1px solid ${C.rule}`, marginTop: '0.25rem' }}>
                  <button
                    type="button" onClick={onClose}
                    style={{ flex: 1, padding: '0.7rem', fontFamily: C.mono, fontSize: '0.68rem', letterSpacing: '0.14em', textTransform: 'uppercase', background: 'transparent', border: `1px solid ${C.rule}`, color: C.dim, cursor: 'pointer', transition: 'all 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(238,232,222,0.3)'; e.currentTarget.style.color = C.text }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = C.rule; e.currentTarget.style.color = C.dim }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !title.trim()}
                    style={{
                      flex: 1, padding: '0.7rem', fontFamily: C.mono, fontSize: '0.68rem', letterSpacing: '0.14em', textTransform: 'uppercase',
                      background: loading || !title.trim() ? 'rgba(255,77,0,0.35)' : C.orange,
                      border: 'none', color: '#050505', cursor: loading || !title.trim() ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                      transition: 'background 0.15s',
                    }}
                  >
                    {loading ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                    {isEdit ? 'Save Changes' : 'Create Task'}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
