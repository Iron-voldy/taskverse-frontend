import axios from 'axios'
import type { Task, TaskList, Canvas, User } from '@/types'

// In the browser, route through /backend (Vercel proxy) to avoid mixed-content blocks.
// Server-side (SSR) can reach the VPS directly, but client JS cannot (HTTP from HTTPS page).
const API_URL = typeof window === 'undefined'
  ? (process.env.BACKEND_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001')
  : '/backend'

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

/*
 * Token source: NextAuth session (httpOnly cookie) via /api/auth/session.
 * NEVER use localStorage for JWTs — any XSS can steal them instantly.
 * The session endpoint returns the accessToken that NextAuth stored in
 * its encrypted, httpOnly JWT cookie.
 */
let _sessionToken: string | null = null
let _sessionTokenPromise: Promise<string | null> | null = null

async function getSessionToken(): Promise<string | null> {
  if (_sessionToken) return _sessionToken
  if (_sessionTokenPromise) return _sessionTokenPromise
  _sessionTokenPromise = (async () => {
    try {
      const res = await fetch('/api/token')
      console.log('[getSessionToken] /api/token status:', res.status)
      if (!res.ok) return null
      const data = await res.json() as Record<string, unknown>
      console.log('[getSessionToken] /api/token response:', JSON.stringify(data))
      _sessionToken = (data?.accessToken as string) ?? null
      console.log('[getSessionToken] token set:', !!_sessionToken)
      return _sessionToken
    } catch (err) {
      console.error('[getSessionToken] error:', err)
      return null
    } finally {
      _sessionTokenPromise = null
    }
  })()
  return _sessionTokenPromise
}

export function clearSessionCache() {
  _sessionToken = null
  _sessionTokenPromise = null
}

api.interceptors.request.use(async (config) => {
  const token = await getSessionToken()
  console.log('[axios interceptor]', config.method?.toUpperCase(), config.url, '| token:', token ? token.slice(0, 20) + '...' : 'NONE')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      _sessionToken = null
      // Do NOT auto-redirect here — the app layout's auth() handles session expiry.
      // Redirecting without signOut() causes a loop: session cookie stays valid so
      // auth() renders the app, fetchMe() fires again, 401 again, redirect again.
    }
    return Promise.reject(err)
  },
)

export const tasksApi = {
  getAll: (params?: Record<string, string>) =>
    api.get<Task[]>('/tasks', { params }).then((r) => r.data),
  getById: (id: string) =>
    api.get<Task>(`/tasks/${id}`).then((r) => r.data),
  create: (data: Partial<Task>) =>
    api.post<Task>('/tasks', data).then((r) => r.data),
  update: (id: string, data: Partial<Task>) =>
    api.patch<Task>(`/tasks/${id}`, data).then((r) => r.data),
  complete: (id: string) =>
    api.patch<{ task: Task; xpAwarded: number }>(`/tasks/${id}/complete`).then((r) => r.data),
  delete: (id: string) =>
    api.delete(`/tasks/${id}`).then((r) => r.data),
  suggest: (title: string, description?: string, lists?: Array<{ _id: string; name: string }>) =>
    api.post<{ priority: string; estimatedMinutes: number; listId?: string; tags: string[] }>(
      '/tasks/suggest', { title, description, lists }
    ).then((r) => r.data),
}

export const listsApi = {
  getAll: () => api.get<TaskList[]>('/lists').then((r) => r.data),
  create: (data: Partial<TaskList>) =>
    api.post<TaskList>('/lists', data).then((r) => r.data),
  update: (id: string, data: Partial<TaskList>) =>
    api.patch<TaskList>(`/lists/${id}`, data).then((r) => r.data),
  delete: (id: string) => api.delete(`/lists/${id}`).then((r) => r.data),
}

export const genuiApi = {
  compose: async (
    intent: string,
    onChunk: (chunk: string) => void,
    onDone: (spec: unknown) => void,
    onError: (msg: string) => void,
  ) => {
    const token = await getSessionToken()
    const res = await fetch(`${API_URL}/genui/compose`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ intent }),
    })
    if (!res.ok) {
      onError(`Request failed: ${res.status}`)
      return
    }
    const reader = res.body?.getReader()
    const decoder = new TextDecoder()
    if (!reader) return
    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const text = decoder.decode(value, { stream: true })
        const lines = text.split('\n').filter((l) => l.startsWith('data: '))
        for (const line of lines) {
          try {
            const data = JSON.parse(line.slice(6)) as Record<string, unknown>
            if (data.chunk) onChunk(data.chunk as string)
            if (data.done && data.spec) onDone(data.spec)
            if (data.error) onError(data.error as string)
          } catch { /* skip malformed chunks */ }
        }
      }
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Stream error')
    } finally {
      reader.releaseLock()
    }
  },
  getCanvases: () => api.get<Canvas[]>('/genui/canvases').then((r) => r.data),
  saveCanvas: (intent: string, layoutSpec: unknown, taskIds: string[], source?: 'ui' | 'task-plan') =>
    api.post<Canvas>('/genui/canvases', { intent, layoutSpec, taskIds, source }).then((r) => r.data),
  togglePin: (id: string) =>
    api.patch<Canvas>(`/genui/canvases/${id}/pin`).then((r) => r.data),
  clarify: (intent: string) =>
    api.post<string[]>('/genui/clarify', { intent }).then((r) => r.data),
  suggestTasks: (intent: string, clarifications?: Record<string, string>) =>
    api.post<SuggestedTask[]>('/genui/suggest-tasks', { intent, clarifications }).then((r) => r.data),
}

export interface SuggestedTask {
  title: string
  description: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  estimatedMinutes: number
  tags: string[]
  dueDate?: string
}

export const mailApi = {
  sendPlan: (tasks: SuggestedTask[]) =>
    api.post<{ sent: boolean }>('/mail/send-plan', { tasks }).then((r) => r.data),
}

export const usersApi = {
  getMe: () => api.get<User>('/users/me').then((r) => r.data),
  updateProfile: (data: Partial<User>) =>
    api.patch<User>('/users/me', data).then((r) => r.data),
  updateNotifications: (prefs: Partial<import('@/types').NotificationPrefs>) =>
    api.patch<{ notificationPrefs: import('@/types').NotificationPrefs }>('/users/me/notifications', prefs).then((r) => r.data),
}
