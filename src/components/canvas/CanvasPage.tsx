'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Pin, Sparkles, ListTodo, X, CheckCircle2, Circle, Clock, Tag } from 'lucide-react'
import { genuiApi, tasksApi } from '@/lib/api'
import { GenUICanvas } from '@/components/genui/GenUICanvas'
import { GenUIRenderer } from '@/components/genui/GenUIRenderer'
import type { Canvas, LayoutSpec, Task } from '@/types'
import { useTaskStore } from '@/store/useTaskStore'
import { useXpReward } from '@/hooks/useXpReward'

const PRIORITY_COLORS: Record<string, string> = {
  urgent: 'text-red-400 bg-red-400/10',
  high: 'text-orange-400 bg-orange-400/10',
  medium: 'text-yellow-400 bg-yellow-400/10',
  low: 'text-green-400 bg-green-400/10',
}

function fmtMins(m: number) {
  return m < 60 ? `${m}m` : `${Math.floor(m / 60)}h${m % 60 ? ` ${m % 60}m` : ''}`
}

function TaskPlanView({ canvas, onClose }: { canvas: Canvas; onClose: () => void }) {
  const { tasks, completeTask, fetchTasks } = useTaskStore()
  const { reward } = useXpReward()
  const [completing, setCompleting] = useState<string | null>(null)

  const planTasks = tasks.filter((t) => canvas.taskIds.includes(t._id))
  const todo = planTasks.filter((t) => t.status !== 'done' && t.status !== 'archived')
  const done = planTasks.filter((t) => t.status === 'done')
  const progress = planTasks.length > 0 ? Math.round((done.length / planTasks.length) * 100) : 0

  async function handleComplete(id: string) {
    setCompleting(id)
    const { xpAwarded } = await completeTask(id)
    reward(xpAwarded, `+${xpAwarded} XP`)
    setCompleting(null)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="glass rounded-2xl p-6 space-y-5"
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <ListTodo className="w-4 h-4 text-[#ff4d00] flex-shrink-0" />
            <h2 className="font-bold text-[#eee8de] truncate">{canvas.layoutSpec.title}</h2>
          </div>
          <p className="text-xs text-[#eee8de]/40 italic">&ldquo;{canvas.intent}&rdquo;</p>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg text-[#eee8de]/30 hover:text-[#eee8de] hover:bg-white/10 transition-all ml-4">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Progress bar */}
      {planTasks.length > 0 && (
        <div>
          <div className="flex items-center justify-between text-xs text-[#eee8de]/40 mb-1.5">
            <span>{done.length} of {planTasks.length} tasks done</span>
            <span className="font-medium text-[#ff4d00]">{progress}%</span>
          </div>
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ background: 'linear-gradient(90deg, #ff4d00, #ff8c00)' }}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
        </div>
      )}

      {/* Task list */}
      <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
        {todo.map((task) => (
          <motion.div key={task._id} layout className="flex items-start gap-3 rounded-xl p-3 hover:bg-white/5 transition-colors group">
            <button
              onClick={() => handleComplete(task._id)}
              disabled={completing === task._id}
              className="mt-0.5 flex-shrink-0 text-[#eee8de]/20 hover:text-[#ff4d00] transition-colors"
            >
              {completing === task._id
                ? <CheckCircle2 className="w-4 h-4 text-[#ff4d00] animate-pulse" />
                : <Circle className="w-4 h-4" />}
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-[#eee8de] font-medium">{task.title}</p>
              {task.description && <p className="text-xs text-[#eee8de]/40 mt-0.5 line-clamp-1">{task.description}</p>}
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${PRIORITY_COLORS[task.priority]}`}>
                  {task.priority}
                </span>
                {task.estimatedMinutes && (
                  <span className="flex items-center gap-0.5 text-[10px] text-[#eee8de]/30">
                    <Clock className="w-2.5 h-2.5" />{fmtMins(task.estimatedMinutes)}
                  </span>
                )}
                {task.tags?.length > 0 && (
                  <span className="flex items-center gap-0.5 text-[10px] text-[#eee8de]/30">
                    <Tag className="w-2.5 h-2.5" />{task.tags.join(', ')}
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        ))}

        {done.length > 0 && (
          <>
            <p className="text-[10px] text-[#eee8de]/20 pt-2 font-medium uppercase tracking-wider">Completed</p>
            {done.map((task) => (
              <div key={task._id} className="flex items-center gap-3 rounded-xl p-3 opacity-35">
                <CheckCircle2 className="w-4 h-4 text-[#ff4d00] flex-shrink-0" />
                <p className="text-sm text-[#eee8de] line-through truncate">{task.title}</p>
              </div>
            ))}
          </>
        )}

        {planTasks.length === 0 && (
          <p className="text-center text-[#eee8de]/20 text-sm py-6">Tasks not found — they may have been deleted</p>
        )}
      </div>
    </motion.div>
  )
}

export function CanvasPage() {
  const [canvases, setCanvases] = useState<Canvas[]>([])
  const [activeCanvas, setActiveCanvas] = useState<Canvas | null>(null)

  const taskPlans = canvases.filter((c) => c.source === 'task-plan')
  const uiCanvases = canvases.filter((c) => c.source !== 'task-plan')

  useEffect(() => {
    genuiApi.getCanvases().then(setCanvases).catch(() => {})
  }, [])

  function handleSave() {
    genuiApi.getCanvases().then(setCanvases).catch(() => {})
  }

  function handleCanvasClick(canvas: Canvas) {
    setActiveCanvas((prev) => prev?._id === canvas._id ? null : canvas)
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-[#ff4d00]" />
          AI Canvas
        </h1>
        <p className="text-[#eee8de]/40 text-sm mt-1">Plan tasks with AI or build a custom UI interface for any goal</p>
      </div>

      <GenUICanvas onSave={handleSave} />

      {/* Active canvas viewer */}
      <AnimatePresence mode="wait">
        {activeCanvas && (
          activeCanvas.source === 'task-plan' ? (
            <TaskPlanView key={activeCanvas._id} canvas={activeCanvas} onClose={() => setActiveCanvas(null)} />
          ) : (
            <motion.div
              key={activeCanvas._id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-[#eee8de]">{activeCanvas.layoutSpec.title}</h2>
                <button onClick={() => setActiveCanvas(null)} className="btn-ghost text-sm flex items-center gap-1">
                  <X className="w-3.5 h-3.5" /> Close
                </button>
              </div>
              <GenUIRenderer spec={activeCanvas.layoutSpec} />
            </motion.div>
          )
        )}
      </AnimatePresence>

      {/* Saved task plans */}
      {taskPlans.length > 0 && (
        <div>
          <h2 className="font-bold mb-3 flex items-center gap-2 text-[#eee8de]">
            <ListTodo className="w-4 h-4 text-[#ff4d00]" />
            Saved Plans
          </h2>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {taskPlans.map((canvas, i) => (
              <CanvasCard key={canvas._id} canvas={canvas} index={i} active={activeCanvas?._id === canvas._id} onClick={() => handleCanvasClick(canvas)} />
            ))}
          </div>
        </div>
      )}

      {/* Saved UI canvases */}
      {uiCanvases.length > 0 && (
        <div>
          <h2 className="font-bold mb-3 flex items-center gap-2 text-[#eee8de]">
            <Sparkles className="w-4 h-4 text-[#ff4d00]" />
            Saved Canvases
          </h2>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {uiCanvases.map((canvas, i) => (
              <CanvasCard key={canvas._id} canvas={canvas} index={i} active={activeCanvas?._id === canvas._id} onClick={() => handleCanvasClick(canvas)} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function CanvasCard({ canvas, index, active, onClick }: { canvas: Canvas; index: number; active: boolean; onClick: () => void }) {
  const isPlan = canvas.source === 'task-plan'
  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      onClick={onClick}
      className={`glass rounded-xl p-4 text-left transition-all group ${active ? 'ring-1 ring-[#ff4d00]/60 bg-[#ff4d00]/5' : 'hover:bg-white/10'}`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-1.5 min-w-0">
          {isPlan
            ? <ListTodo className="w-3.5 h-3.5 text-[#ff4d00] flex-shrink-0" />
            : <Sparkles className="w-3.5 h-3.5 text-[#ff4d00] flex-shrink-0" />
          }
          <p className="font-medium text-sm text-[#eee8de] truncate">{canvas.layoutSpec.title}</p>
        </div>
        {canvas.pinned && <Pin className="w-3 h-3 text-[#ff4d00] flex-shrink-0 ml-2" />}
      </div>
      <p className="text-xs text-[#eee8de]/40 italic truncate">&ldquo;{canvas.intent}&rdquo;</p>
      <div className="flex items-center gap-2 mt-2">
        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${isPlan ? 'bg-[#ff4d00]/15 text-[#ff4d00]' : 'bg-white/10 text-[#eee8de]/40'}`}>
          {isPlan ? `${canvas.taskIds.length} tasks` : `${canvas.layoutSpec.layout.length} component${canvas.layoutSpec.layout.length !== 1 ? 's' : ''}`}
        </span>
        <span className="text-[10px] text-[#eee8de]/20">{isPlan ? 'Task Plan' : 'UI Canvas'}</span>
      </div>
    </motion.button>
  )
}
