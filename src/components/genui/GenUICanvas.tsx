'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles, Loader2, Pin, PinOff, Save, ChevronRight,
  ListTodo, Pencil, Trash2, Plus, Check, X, Clock, Tag, Calendar,
} from 'lucide-react'
import { toast } from 'sonner'
import { genuiApi, tasksApi, type SuggestedTask } from '@/lib/api'
import { GenUIRenderer } from './GenUIRenderer'
import type { LayoutSpec } from '@/types'

const PRIORITY_COLORS: Record<string, string> = {
  low: 'text-green-400 bg-green-400/10 border-green-400/20',
  medium: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  high: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
  urgent: 'text-red-400 bg-red-400/10 border-red-400/20',
}

const TASK_EXAMPLES = [
  'Study for 3 exams next week',
  'Launch my side project in 30 days',
  'Plan my Europe trip in March',
  'Build a morning routine habit',
  'Manage home renovation budget',
]

const CANVAS_EXAMPLES = [
  'Kanban board for my sprint',
  'Habit tracker for daily routines',
  'Budget overview for renovation',
  'Focus timer for deep work',
  'Project roadmap with milestones',
]

type Tab = 'canvas' | 'tasks'

interface EditingTask extends SuggestedTask {
  _localId: string
}

interface Props {
  tasks?: Record<string, unknown>[]
  onSave?: (spec: LayoutSpec) => void
}

function makeId() {
  return Math.random().toString(36).slice(2, 9)
}

export function GenUICanvas({ tasks = [], onSave }: Props) {
  const [tab, setTab] = useState<Tab>('tasks')

  // ── Canvas tab state ─────────────────────────────────────
  const [intent, setIntent] = useState('')
  const [loading, setLoading] = useState(false)
  const [streamText, setStreamText] = useState('')
  const [spec, setSpec] = useState<LayoutSpec | null>(null)
  const [pinned, setPinned] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // ── Tasks tab state ──────────────────────────────────────
  const [taskIntent, setTaskIntent] = useState('')
  const [taskPhase, setTaskPhase] = useState<'input' | 'questions' | 'tasks'>('input')
  const [taskLoading, setTaskLoading] = useState(false)
  const [questions, setQuestions] = useState<string[]>([])
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [suggestedTasks, setSuggestedTasks] = useState<EditingTask[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState<Partial<SuggestedTask>>({})
  const [savingAll, setSavingAll] = useState(false)
  const taskInputRef = useRef<HTMLInputElement>(null)

  // ── Canvas handlers ───────────────────────────────────────
  async function handleCompose(e: React.FormEvent) {
    e.preventDefault()
    if (!intent.trim() || loading) return
    setLoading(true)
    setStreamText('')
    setSpec(null)
    await genuiApi.compose(
      intent,
      (chunk) => setStreamText((prev) => prev + chunk),
      (finalSpec) => { setSpec(finalSpec as LayoutSpec); setLoading(false); toast.success('Interface assembled!') },
      (err) => { toast.error(err); setLoading(false) },
    )
  }

  async function handleSave() {
    if (!spec) return
    try {
      await genuiApi.saveCanvas(intent, spec, [], 'ui')
      setPinned(true)
      onSave?.(spec)
      toast.success('Canvas saved!')
    } catch (err) {
      console.error('Save canvas error:', err)
      toast.error('Failed to save canvas')
    }
  }

  // ── Task suggestion handlers ──────────────────────────────
  async function handlePlanIntent(e: React.FormEvent) {
    e.preventDefault()
    if (!taskIntent.trim() || taskLoading) return
    setTaskLoading(true)
    setQuestions([])
    setAnswers({})
    setSuggestedTasks([])
    try {
      const qs = await genuiApi.clarify(taskIntent)
      setQuestions(qs)
      setAnswers(Object.fromEntries(qs.map((q) => [q, ''])))
      setTaskPhase('questions')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to get questions')
    } finally {
      setTaskLoading(false)
    }
  }

  async function handleGenerateTasks() {
    if (taskLoading) return
    setTaskLoading(true)
    setSuggestedTasks([])
    try {
      const result = await genuiApi.suggestTasks(taskIntent, answers)
      setSuggestedTasks(result.map((t) => ({ ...t, _localId: makeId() })))
      setTaskPhase('tasks')
      toast.success(`${result.length} tasks generated!`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to generate tasks')
    } finally {
      setTaskLoading(false)
    }
  }

  function resetTaskFlow() {
    setTaskPhase('input')
    setTaskIntent('')
    setQuestions([])
    setAnswers({})
    setSuggestedTasks([])
    setEditingId(null)
  }

  function startEdit(task: EditingTask) {
    setEditingId(task._localId)
    setEditDraft({
      title: task.title,
      description: task.description,
      priority: task.priority,
      estimatedMinutes: task.estimatedMinutes,
      tags: [...task.tags],
      dueDate: task.dueDate,
    })
  }

  function commitEdit() {
    if (!editingId) return
    setSuggestedTasks((prev) =>
      prev.map((t) => t._localId === editingId ? { ...t, ...editDraft } : t)
    )
    setEditingId(null)
    setEditDraft({})
  }

  function cancelEdit() {
    setEditingId(null)
    setEditDraft({})
  }

  function deleteTask(id: string) {
    setSuggestedTasks((prev) => prev.filter((t) => t._localId !== id))
  }

  function addBlankTask() {
    const blank: EditingTask = {
      _localId: makeId(),
      title: 'New Task',
      description: '',
      priority: 'medium',
      estimatedMinutes: 30,
      tags: [],
    }
    setSuggestedTasks((prev) => [...prev, blank])
    setEditingId(blank._localId)
    setEditDraft({ title: 'New Task', description: '', priority: 'medium', estimatedMinutes: 30, tags: [], dueDate: undefined })
  }

  async function handleSaveAll() {
    if (suggestedTasks.length === 0) return
    setSavingAll(true)
    let saved = 0
    let failed = 0
    const createdIds: string[] = []
    for (const task of suggestedTasks) {
      try {
        const created = await tasksApi.create({
          title: task.title,
          description: task.description,
          priority: task.priority,
          estimatedMinutes: task.estimatedMinutes,
          tags: task.tags,
          dueDate: task.dueDate,
        })
        createdIds.push(created._id)
        saved++
      } catch {
        failed++
      }
    }
    setSavingAll(false)
    if (saved > 0) {
      // Save a canvas so the plan is viewable later
      const planSpec = {
        version: '1' as const,
        title: taskIntent.length > 80 ? taskIntent.slice(0, 80) + '…' : taskIntent,
        description: `AI task plan — ${saved} tasks`,
        layout: [{ id: 'task-plan-list', component: 'TaskList' as const, props: { title: taskIntent, filter: 'all' } }],
      }
      try {
        await genuiApi.saveCanvas(taskIntent, planSpec, createdIds, 'task-plan')
        onSave?.(planSpec)
      } catch { /* canvas save is best-effort */ }

      // Send plan confirmation email (best-effort, don't block)
      try {
        const { mailApi } = await import('@/lib/api')
        await mailApi.sendPlan(suggestedTasks)
      } catch { /* email is best-effort */ }
    }

    if (failed === 0) {
      toast.success(`${saved} tasks saved! A confirmation email has been sent.`)
      resetTaskFlow()
    } else {
      toast.error(`${saved} saved, ${failed} failed`)
      setSavingAll(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Tab switcher */}
      <div className="flex gap-1 glass rounded-xl p-1 w-fit">
        {(['tasks', 'canvas'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              tab === t
                ? 'bg-[#ff4d00] text-[#050505]'
                : 'text-[#eee8de]/50 hover:text-[#eee8de]/80'
            }`}
          >
            {t === 'tasks' ? (
              <span className="flex items-center gap-1.5"><ListTodo className="w-3.5 h-3.5" />Task Planner</span>
            ) : (
              <span className="flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5" />UI Canvas</span>
            )}
          </button>
        ))}
      </div>

      {/* ── TASK PLANNER TAB ─────────────────────────────── */}
      <AnimatePresence mode="wait">
        {tab === 'tasks' && (
          <motion.div
            key="tasks"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-4"
          >
            {/* Phase 1: Intent input */}
            <AnimatePresence mode="wait">
              {taskPhase === 'input' && (
                <motion.div key="input" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="glass rounded-2xl p-6">
                  <div className="flex items-center gap-2 mb-1">
                    <ListTodo className="w-5 h-5 text-[#ff4d00]" />
                    <h2 className="font-bold text-lg text-[#eee8de]">AI Task Planner</h2>
                    <span className="text-xs glass rounded-full px-2 py-0.5 text-[#eee8de]/40 ml-auto">Groq · llama-3.3-70b</span>
                  </div>
                  <p className="text-xs text-[#eee8de]/40 mb-4">Tell AI your goal → it asks questions → generates a real task list you can edit and save</p>
                  <form onSubmit={handlePlanIntent} className="flex gap-3">
                    <input
                      ref={taskInputRef}
                      value={taskIntent}
                      onChange={(e) => setTaskIntent(e.target.value)}
                      placeholder="What do you want to accomplish? e.g. Study for exam next week"
                      className="input-field flex-1"
                      disabled={taskLoading}
                    />
                    <button type="submit" disabled={taskLoading || !taskIntent.trim()} className="btn-primary flex items-center gap-2 flex-shrink-0">
                      {taskLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
                      {taskLoading ? 'Thinking...' : 'Plan'}
                    </button>
                  </form>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {TASK_EXAMPLES.map((ex) => (
                      <button
                        key={ex}
                        onClick={() => { setTaskIntent(ex); taskInputRef.current?.focus() }}
                        className="text-xs glass rounded-full px-3 py-1 text-[#eee8de]/50 hover:text-[#eee8de]/80 hover:bg-white/10 transition-all"
                      >
                        {ex}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Phase 2: Clarifying questions */}
              {taskPhase === 'questions' && (
                <motion.div key="questions" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="glass rounded-2xl p-6 space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Sparkles className="w-4 h-4 text-[#ff4d00]" />
                        <span className="font-bold text-[#eee8de]">A few quick questions</span>
                      </div>
                      <p className="text-xs text-[#eee8de]/40 italic">&ldquo;{taskIntent}&rdquo;</p>
                    </div>
                    <button onClick={resetTaskFlow} className="text-xs text-[#eee8de]/30 hover:text-[#eee8de]/60 transition-colors">
                      ← Start over
                    </button>
                  </div>

                  <div className="space-y-4">
                    {questions.map((q, i) => (
                      <motion.div
                        key={q}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.08 }}
                        className="space-y-1.5"
                      >
                        <label className="text-sm text-[#eee8de]/80 font-medium flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-full bg-[#ff4d00]/20 text-[#ff4d00] text-[10px] flex items-center justify-center flex-shrink-0 font-bold">{i + 1}</span>
                          {q}
                        </label>
                        <input
                          value={answers[q] ?? ''}
                          onChange={(e) => setAnswers((prev) => ({ ...prev, [q]: e.target.value }))}
                          placeholder="Your answer..."
                          className="input-field w-full text-sm"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && i === questions.length - 1) handleGenerateTasks()
                          }}
                        />
                      </motion.div>
                    ))}
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => handleGenerateTasks()}
                      disabled={taskLoading}
                      className="btn-primary flex items-center gap-2 flex-1 justify-center"
                    >
                      {taskLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ListTodo className="w-4 h-4" />}
                      {taskLoading ? 'Generating tasks...' : 'Generate My Task List'}
                    </button>
                    <button
                      onClick={() => handleGenerateTasks()}
                      disabled={taskLoading}
                      className="btn-ghost text-xs py-2 px-3 whitespace-nowrap"
                    >
                      Skip questions
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Phase 3: Task list */}
            <AnimatePresence>
              {taskPhase === 'tasks' && suggestedTasks.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-2"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-sm text-[#eee8de]/50">
                        {suggestedTasks.length} task{suggestedTasks.length !== 1 ? 's' : ''} — edit, delete, or add before saving
                      </p>
                      <p className="text-xs text-[#eee8de]/30 italic">&ldquo;{taskIntent}&rdquo;</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={resetTaskFlow} className="btn-ghost flex items-center gap-1.5 text-xs py-1">
                        ← New plan
                      </button>
                      <button onClick={addBlankTask} className="btn-ghost flex items-center gap-1.5 text-xs py-1">
                        <Plus className="w-3.5 h-3.5" /> Add Task
                      </button>
                      <button
                        onClick={handleSaveAll}
                        disabled={savingAll || suggestedTasks.length === 0}
                        className="btn-primary flex items-center gap-1.5 text-sm py-1.5"
                      >
                        {savingAll ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                        {savingAll ? 'Saving...' : `Save All (${suggestedTasks.length})`}
                      </button>
                    </div>
                  </div>

                  {suggestedTasks.map((task, idx) => (
                    <motion.div
                      key={task._localId}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 8 }}
                      transition={{ delay: idx * 0.04 }}
                      className="glass rounded-xl p-4"
                    >
                      {editingId === task._localId ? (
                        /* Editing mode */
                        <div className="space-y-3">
                          <input
                            value={editDraft.title ?? ''}
                            onChange={(e) => setEditDraft((d) => ({ ...d, title: e.target.value }))}
                            className="input-field w-full font-medium"
                            placeholder="Task title"
                            autoFocus
                          />
                          <input
                            value={editDraft.description ?? ''}
                            onChange={(e) => setEditDraft((d) => ({ ...d, description: e.target.value }))}
                            className="input-field w-full text-sm"
                            placeholder="Description (optional)"
                          />
                          <div className="flex gap-2 flex-wrap">
                            <select
                              value={editDraft.priority ?? 'medium'}
                              onChange={(e) => setEditDraft((d) => ({ ...d, priority: e.target.value as SuggestedTask['priority'] }))}
                              className="input-field text-sm py-1 flex-1 min-w-[100px]"
                            >
                              {['low', 'medium', 'high', 'urgent'].map((p) => (
                                <option key={p} value={p}>{p}</option>
                              ))}
                            </select>
                            <div className="flex items-center gap-1.5 flex-1 min-w-[120px]">
                              <Clock className="w-3.5 h-3.5 text-[#eee8de]/40 flex-shrink-0" />
                              <input
                                type="number"
                                min={5}
                                max={480}
                                value={editDraft.estimatedMinutes ?? 30}
                                onChange={(e) => setEditDraft((d) => ({ ...d, estimatedMinutes: Number(e.target.value) }))}
                                className="input-field text-sm py-1 w-24"
                              />
                              <span className="text-xs text-[#eee8de]/40">min</span>
                            </div>
                            <input
                              value={(editDraft.tags ?? []).join(', ')}
                              onChange={(e) => setEditDraft((d) => ({ ...d, tags: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) }))}
                              className="input-field text-sm py-1 flex-1 min-w-[120px]"
                              placeholder="tags, comma separated"
                            />
                            <div className="flex items-center gap-1.5 flex-1 min-w-[130px]">
                              <Calendar className="w-3.5 h-3.5 text-[#eee8de]/40 flex-shrink-0" />
                              <input
                                type="date"
                                value={editDraft.dueDate ?? ''}
                                onChange={(e) => setEditDraft((d) => ({ ...d, dueDate: e.target.value || undefined }))}
                                className="input-field text-sm py-1 flex-1"
                              />
                            </div>
                          </div>
                          <div className="flex gap-2 justify-end">
                            <button onClick={cancelEdit} className="btn-ghost text-xs py-1 flex items-center gap-1"><X className="w-3 h-3" />Cancel</button>
                            <button onClick={commitEdit} className="btn-primary text-xs py-1 flex items-center gap-1"><Check className="w-3 h-3" />Save</button>
                          </div>
                        </div>
                      ) : (
                        /* View mode */
                        <div className="flex items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium text-[#eee8de] text-sm truncate">{task.title}</p>
                              <span className={`text-[10px] px-1.5 py-0.5 rounded border flex-shrink-0 ${PRIORITY_COLORS[task.priority]}`}>
                                {task.priority}
                              </span>
                            </div>
                            {task.description && (
                              <p className="text-xs text-[#eee8de]/50 mb-1.5 line-clamp-2">{task.description}</p>
                            )}
                            <div className="flex items-center gap-3 text-[10px] text-[#eee8de]/40">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />{task.estimatedMinutes}m
                              </span>
                              {task.tags.length > 0 && (
                                <span className="flex items-center gap-1">
                                  <Tag className="w-3 h-3" />{task.tags.join(', ')}
                                </span>
                              )}
                              {task.dueDate && (
                                <span className="flex items-center gap-1 text-[#ff4d00]/70 font-medium">
                                  <Calendar className="w-3 h-3" />
                                  {new Date(task.dueDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-1 flex-shrink-0">
                            <button
                              onClick={() => startEdit(task)}
                              className="p-1.5 rounded-lg text-[#eee8de]/30 hover:text-[#ff4d00] hover:bg-[#ff4d00]/10 transition-all"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => deleteTask(task._localId)}
                              className="p-1.5 rounded-lg text-[#eee8de]/30 hover:text-red-400 hover:bg-red-400/10 transition-all"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ))}

                  <button onClick={addBlankTask} className="w-full glass rounded-xl p-3 text-[#eee8de]/30 hover:text-[#eee8de]/60 hover:bg-white/5 transition-all text-sm flex items-center justify-center gap-2">
                    <Plus className="w-4 h-4" /> Add another task
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* ── UI CANVAS TAB ─────────────────────────────────── */}
        {tab === 'canvas' && (
          <motion.div
            key="canvas"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-6"
          >
            <div className="glass rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-[#ff4d00]" />
                <h2 className="font-bold text-lg text-[#eee8de]">Generative Canvas</h2>
                <span className="text-xs glass rounded-full px-2 py-0.5 text-[#eee8de]/40 ml-auto">UI builder</span>
              </div>
              <form onSubmit={handleCompose} className="flex gap-3">
                <input
                  ref={inputRef}
                  value={intent}
                  onChange={(e) => setIntent(e.target.value)}
                  placeholder="Describe what you're trying to do..."
                  className="input-field flex-1"
                  disabled={loading}
                />
                <button type="submit" disabled={loading || !intent.trim()} className="btn-primary flex items-center gap-2 flex-shrink-0">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
                  {loading ? 'Building...' : 'Build'}
                </button>
              </form>
              <div className="flex flex-wrap gap-2 mt-3">
                {CANVAS_EXAMPLES.map((ex) => (
                  <button
                    key={ex}
                    onClick={() => { setIntent(ex); inputRef.current?.focus() }}
                    className="text-xs glass rounded-full px-3 py-1 text-[#eee8de]/50 hover:text-[#eee8de]/80 hover:bg-white/10 transition-all"
                  >
                    {ex}
                  </button>
                ))}
              </div>
            </div>

            <AnimatePresence>
              {loading && streamText && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="glass rounded-xl p-4 overflow-hidden"
                >
                  <p className="text-xs text-[#eee8de]/30 mb-2 font-mono">AI composing layout...</p>
                  <p className="text-xs text-[#ff4d00]/60 font-mono whitespace-pre-wrap line-clamp-4">{streamText}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {spec && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm text-[#eee8de]/40">
                      Generated for: <span className="text-[#eee8de]/70 italic">&ldquo;{intent}&rdquo;</span>
                    </p>
                    <div className="flex gap-2">
                      <button onClick={handleSave} className="btn-ghost flex items-center gap-1.5 text-sm">
                        {pinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
                        {pinned ? 'Unpin' : 'Pin'}
                      </button>
                      <button onClick={handleSave} className="btn-primary flex items-center gap-1.5 text-sm py-1.5">
                        <Save className="w-3.5 h-3.5" />
                        Save Canvas
                      </button>
                    </div>
                  </div>
                  <GenUIRenderer spec={spec} taskData={{ tasks }} />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
