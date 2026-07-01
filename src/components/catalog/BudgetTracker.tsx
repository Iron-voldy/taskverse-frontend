'use client'

import { motion } from 'framer-motion'
import { DollarSign, TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LineItem {
  id: string
  label: string
  amount: number
  type: 'income' | 'expense'
  category?: string
}

interface Props {
  title?: string
  items?: LineItem[]
  currency?: string
  budget?: number
}

export function BudgetTracker({ title = 'Budget', items = [], currency = '$', budget }: Props) {
  const total = items.reduce((sum, i) => i.type === 'income' ? sum + i.amount : sum - i.amount, 0)
  const spent = items.filter((i) => i.type === 'expense').reduce((s, i) => s + i.amount, 0)
  const progress = budget ? Math.min(100, (spent / budget) * 100) : 0

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <DollarSign className="w-4 h-4 text-emerald-400" />
        <h3 className="font-semibold text-white/90">{title}</h3>
        <span className={cn('ml-auto text-lg font-bold', total >= 0 ? 'text-emerald-400' : 'text-red-400')}>
          {total >= 0 ? '+' : ''}{currency}{Math.abs(total).toLocaleString()}
        </span>
      </div>

      {budget && (
        <div className="mb-4">
          <div className="flex justify-between text-xs text-white/40 mb-1">
            <span>Spent: {currency}{spent.toLocaleString()}</span>
            <span>Budget: {currency}{budget.toLocaleString()}</span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className={cn('h-full rounded-full', progress > 90 ? 'bg-red-500' : progress > 70 ? 'bg-amber-500' : 'bg-emerald-500')}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
        </div>
      )}

      <div className="space-y-2">
        {items.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-center justify-between glass rounded-lg p-3"
          >
            <div className="flex items-center gap-2">
              {item.type === 'income'
                ? <TrendingUp className="w-3 h-3 text-emerald-400" />
                : <TrendingDown className="w-3 h-3 text-red-400" />
              }
              <span className="text-sm text-white/80">{item.label}</span>
              {item.category && (
                <span className="text-xs text-white/30 glass rounded-full px-2 py-0.5">{item.category}</span>
              )}
            </div>
            <span className={cn('text-sm font-medium', item.type === 'income' ? 'text-emerald-400' : 'text-red-400')}>
              {item.type === 'income' ? '+' : '-'}{currency}{item.amount.toLocaleString()}
            </span>
          </motion.div>
        ))}
        {items.length === 0 && (
          <p className="text-white/30 text-sm text-center py-4">No line items yet</p>
        )}
      </div>
    </div>
  )
}
