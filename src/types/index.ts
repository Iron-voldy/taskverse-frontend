export type Priority = 'low' | 'medium' | 'high' | 'urgent'
export type TaskStatus = 'todo' | 'in_progress' | 'done' | 'archived'

export interface Subtask {
  _id: string
  title: string
  done: boolean
}

export interface Task {
  _id: string
  title: string
  description?: string
  status: TaskStatus
  priority: Priority
  dueDate?: string
  estimatedMinutes?: number
  tags: string[]
  subtasks: Subtask[]
  listId?: string
  userId: string
  completedAt?: string
  createdAt: string
  updatedAt: string
}

export interface TaskList {
  _id: string
  name: string
  color: string
  icon: string
  userId: string
  createdAt: string
}

export interface NotificationPrefs {
  dailyDigest: boolean
  streakReminder: boolean
  planCreated: boolean
}

export interface User {
  _id: string
  name: string
  email: string
  image?: string
  xp: number
  level: number
  streak: number
  lastActiveDate?: string
  createdAt: string
  notificationPrefs?: NotificationPrefs
}

// GenUI types
export type CatalogComponentName =
  | 'TaskCard'
  | 'TaskList'
  | 'KanbanBoard'
  | 'Timeline'
  | 'HabitGrid'
  | 'CalendarView'
  | 'CountdownRing'
  | 'BudgetTracker'
  | 'ProgressDashboard'
  | 'ChecklistGroup'
  | 'FocusTimer'

export interface LayoutNode {
  id: string
  component: CatalogComponentName
  props: Record<string, unknown>
  children?: LayoutNode[]
}

export interface LayoutSpec {
  version: '1'
  title: string
  description?: string
  layout: LayoutNode[]
}

export interface Canvas {
  _id: string
  intent: string
  layoutSpec: LayoutSpec
  taskIds: string[]
  source: 'ui' | 'task-plan'
  pinned: boolean
  createdAt: string
  updatedAt: string
}
