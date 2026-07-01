'use client'

import { useState, useEffect, useRef } from 'react'

const SUGGESTIONS: Record<string, string[]> = {
  'plan ': ['my week', 'the project', 'a trip to', 'a meeting'],
  'buy ': ['groceries', 'new laptop', 'birthday gift for'],
  'finish ': ['the report', 'reading chapter', 'the presentation'],
  'review ': ['pull request', 'the budget', 'meeting notes'],
  'call ': ['the team', 'client about', 'dentist for appointment'],
  'write ': ['blog post about', 'email to', 'the documentation for'],
  'study ': ['for exam', 'JavaScript', 'the notes on'],
  'fix ': ['the bug in', 'the broken', 'issue with'],
}

export function useGhostAutocomplete(value: string) {
  const [ghost, setGhost] = useState('')
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => {
    clearTimeout(timerRef.current)
    if (!value || value.length < 3) { setGhost(''); return }

    timerRef.current = setTimeout(() => {
      const lower = value.toLowerCase()
      for (const [trigger, options] of Object.entries(SUGGESTIONS)) {
        if (lower.endsWith(trigger.trimEnd()) || lower.includes(trigger)) {
          const suggestion = options[Math.floor(Math.random() * options.length)]
          const completion = value + suggestion.slice(Math.max(0, lower.length - lower.lastIndexOf(trigger) - trigger.length))
          setGhost(completion)
          return
        }
      }
      setGhost('')
    }, 400)

    return () => clearTimeout(timerRef.current)
  }, [value])

  const accept = () => ghost

  return { ghost, accept }
}
