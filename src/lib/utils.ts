import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, isToday, isTomorrow, isPast, formatDistanceToNow } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date): string {
  const d = new Date(date)
  if (isToday(d)) return 'Today'
  if (isTomorrow(d)) return 'Tomorrow'
  return format(d, 'MMM d, yyyy')
}

export function formatRelative(date: string | Date): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

export function isOverdue(date?: string): boolean {
  if (!date) return false
  return isPast(new Date(date))
}

export function getPriorityColor(priority: string): string {
  const map: Record<string, string> = {
    low: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
    medium: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
    high: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
    urgent: 'text-red-400 bg-red-400/10 border-red-400/20',
  }
  return map[priority] ?? map.medium
}

export function getLevelTitle(level: number): string {
  const titles = ['Beginner', 'Apprentice', 'Explorer', 'Achiever', 'Expert', 'Master', 'Legend', 'Grandmaster']
  return titles[Math.min(level - 1, titles.length - 1)] ?? 'Legend'
}

export function getXpForNextLevel(level: number): number {
  return level * 500
}

export function getXpProgress(xp: number, level: number): number {
  const levelStart = (level - 1) * 500
  const levelEnd = level * 500
  return Math.round(((xp - levelStart) / (levelEnd - levelStart)) * 100)
}
