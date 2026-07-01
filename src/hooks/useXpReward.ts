'use client'

import { useCallback } from 'react'
import { toast } from 'sonner'
import confetti from 'canvas-confetti'
import { useUserStore } from '@/store/useUserStore'
import { getLevelTitle, getXpForNextLevel } from '@/lib/utils'

export function useXpReward() {
  const { user, awardXp } = useUserStore()

  const reward = useCallback(
    (amount: number, message = `+${amount} XP`) => {
      awardXp(amount)

      toast.success(message, {
        description: user ? `${user.xp + amount} / ${getXpForNextLevel(user.level)} XP` : undefined,
        duration: 2500,
      })

      // Level-up check
      if (user) {
        const oldLevel = user.level
        const newLevel = Math.floor((user.xp + amount) / 500) + 1
        if (newLevel > oldLevel) {
          confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 }, colors: ['#8b5cf6', '#38bdf8', '#f59e0b'] })
          toast.success(`Level Up! You're now ${getLevelTitle(newLevel)}`, {
            description: `Reached level ${newLevel}`,
            duration: 4000,
          })
        }
      }
    },
    [user, awardXp],
  )

  return { reward }
}
