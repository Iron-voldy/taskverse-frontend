import type { ComponentType } from 'react'
import { TaskCard } from '../catalog/TaskCard'
import { TaskList } from '../catalog/TaskList'
import { KanbanBoard } from '../catalog/KanbanBoard'
import { Timeline } from '../catalog/Timeline'
import { HabitGrid } from '../catalog/HabitGrid'
import { CalendarView } from '../catalog/CalendarView'
import { CountdownRing } from '../catalog/CountdownRing'
import { BudgetTracker } from '../catalog/BudgetTracker'
import { ProgressDashboard } from '../catalog/ProgressDashboard'
import { ChecklistGroup } from '../catalog/ChecklistGroup'
import { FocusTimer } from '../catalog/FocusTimer'
import type { CatalogComponentName } from '@/types'

// The registry is the security boundary.
// The AI can only reference names that exist here.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const CATALOG_REGISTRY: Record<CatalogComponentName, ComponentType<any>> = {
  TaskCard,
  TaskList,
  KanbanBoard,
  Timeline,
  HabitGrid,
  CalendarView,
  CountdownRing,
  BudgetTracker,
  ProgressDashboard,
  ChecklistGroup,
  FocusTimer,
}

export function resolveComponent(name: string): ComponentType<Record<string, unknown>> | null {
  if (name in CATALOG_REGISTRY) {
    return CATALOG_REGISTRY[name as CatalogComponentName]
  }
  return null
}
