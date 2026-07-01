'use client'

import { create } from 'zustand'
import { usersApi } from '@/lib/api'
import type { User } from '@/types'

interface UserStore {
  user: User | null
  loading: boolean
  fetchMe: () => Promise<void>
  awardXp: (amount: number) => void
}

export const useUserStore = create<UserStore>((set) => ({
  user: null,
  loading: false,

  fetchMe: async () => {
    set({ loading: true })
    try {
      const user = await usersApi.getMe()
      set({ user, loading: false })
    } catch {
      set({ loading: false })
    }
  },

  awardXp: (amount) => {
    set((s) => {
      if (!s.user) return s
      const newXp = s.user.xp + amount
      const newLevel = Math.floor(newXp / 500) + 1
      return { user: { ...s.user, xp: newXp, level: newLevel } }
    })
  },
}))
