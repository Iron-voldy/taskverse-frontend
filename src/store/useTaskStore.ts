'use client'

import { create } from 'zustand'
import { tasksApi, listsApi } from '@/lib/api'
import type { Task, TaskList } from '@/types'

interface TaskStore {
  tasks: Task[]
  lists: TaskList[]
  loading: boolean
  error: string | null

  fetchTasks: (filters?: Record<string, string>) => Promise<void>
  fetchLists: () => Promise<void>
  createTask: (data: Partial<Task>) => Promise<Task>
  updateTask: (id: string, data: Partial<Task>) => Promise<void>
  completeTask: (id: string) => Promise<{ xpAwarded: number }>
  deleteTask: (id: string) => Promise<void>
  createList: (data: Partial<TaskList>) => Promise<void>
}

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: [],
  lists: [],
  loading: false,
  error: null,

  fetchTasks: async (filters) => {
    set({ loading: true, error: null })
    try {
      const tasks = await tasksApi.getAll(filters)
      set({ tasks, loading: false })
    } catch {
      set({ error: 'Failed to load tasks', loading: false })
    }
  },

  fetchLists: async () => {
    try {
      const lists = await listsApi.getAll()
      set({ lists, error: null })
    } catch {
      set({ error: 'Failed to load lists' })
    }
  },

  createTask: async (data) => {
    try {
      const task = await tasksApi.create(data)
      set((s) => ({ tasks: [task, ...s.tasks] }))
      return task
    } catch (err) {
      set({ error: 'Failed to create task' })
      throw err
    }
  },

  updateTask: async (id, data) => {
    const previous = get().tasks
    set((s) => ({ tasks: s.tasks.map((t) => (t._id === id ? { ...t, ...data } : t)) }))
    try {
      const updated = await tasksApi.update(id, data)
      set((s) => ({ tasks: s.tasks.map((t) => (t._id === id ? updated : t)) }))
    } catch (err) {
      set({ tasks: previous, error: 'Failed to update task' })
      throw err
    }
  },

  completeTask: async (id) => {
    const previous = get().tasks
    try {
      const { task, xpAwarded } = await tasksApi.complete(id)
      set((s) => ({ tasks: s.tasks.map((t) => (t._id === id ? task : t)) }))
      return { xpAwarded }
    } catch (err) {
      set({ tasks: previous, error: 'Failed to complete task' })
      throw err
    }
  },

  deleteTask: async (id) => {
    const previous = get().tasks
    set((s) => ({ tasks: s.tasks.filter((t) => t._id !== id) }))
    try {
      await tasksApi.delete(id)
    } catch (err) {
      set({ tasks: previous, error: 'Failed to delete task' })
      throw err
    }
  },

  createList: async (data) => {
    const list = await listsApi.create(data)
    set((s) => ({ lists: [...s.lists, list] }))
  },
}))
