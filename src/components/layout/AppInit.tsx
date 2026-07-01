'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useTaskStore } from '@/store/useTaskStore'
import { useUserStore } from '@/store/useUserStore'

// Bootstraps client-side stores after session is available
export function AppInit() {
  const { data: session } = useSession()
  const { fetchTasks, fetchLists } = useTaskStore()
  const { fetchMe } = useUserStore()

  useEffect(() => {
    if (!session) return
    fetchMe()
    fetchTasks()
    fetchLists()
  }, [session, fetchMe, fetchTasks, fetchLists])

  return null
}
