'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { signOut, useSession } from 'next-auth/react'
import {
  Zap, CheckSquare, Sparkles, LayoutDashboard, Settings,
  LogOut, ChevronLeft, Flame, Star, Plus, Hash, Menu, X,
} from 'lucide-react'
import { cn, getLevelTitle, getXpProgress } from '@/lib/utils'
import { useUserStore } from '@/store/useUserStore'
import { useTaskStore } from '@/store/useTaskStore'

const NAV = [
  { href: '/app', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/app/tasks', icon: CheckSquare, label: 'Tasks' },
  { href: '/app/canvas', icon: Sparkles, label: 'AI Canvas' },
  { href: '/app/settings', icon: Settings, label: 'Settings' },
]

function SidebarContent({ collapsed, onClose }: { collapsed: boolean; onClose?: () => void }) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const { user } = useUserStore()
  const { lists } = useTaskStore()
  const xpPct = user ? getXpProgress(user.xp, user.level) : 0

  return (
    <>
      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto no-scrollbar">
        {NAV.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== '/app' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              prefetch={true}
              onClick={onClose}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all',
                active ? 'text-white' : 'hover:text-white hover:bg-white/5',
                collapsed && 'justify-center px-2',
              )}
              style={active ? { background: 'rgba(255,77,0,0.12)', borderLeft: '2px solid #ff4d00', color: '#eee8de' } : { color: 'rgba(238,232,222,0.45)' }}
              title={collapsed ? label : undefined}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {!collapsed && <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }}>{label}</motion.span>}
            </Link>
          )
        })}

        {/* Lists */}
        {!collapsed && lists.length > 0 && (
          <div className="pt-4">
            <p className="text-xs text-white/20 uppercase tracking-wider px-3 mb-2">Lists</p>
            {lists.map((list) => (
              <Link
                key={list._id}
                href={`/app/tasks?list=${list._id}`}
                onClick={onClose}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-white/50 hover:text-white hover:bg-white/5 transition-all"
              >
                <Hash className="w-3 h-3 flex-shrink-0" style={{ color: list.color }} />
                <span className="truncate">{list.name}</span>
              </Link>
            ))}
          </div>
        )}
      </nav>

      {/* User / XP */}
      <AnimatePresence>
        {!collapsed && user && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="p-4 border-t border-white/5"
          >
            <div className="glass rounded-xl p-3 mb-3">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <Star className="w-3 h-3 text-amber-400" />
                  <span className="text-xs font-medium text-white/70">Lv.{user.level} {getLevelTitle(user.level)}</span>
                </div>
                {user.streak > 0 && (
                  <div className="flex items-center gap-1">
                    <Flame className="w-3 h-3 text-orange-400 animate-streak" />
                    <span className="text-xs text-orange-400 font-bold">{user.streak}</span>
                  </div>
                )}
              </div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: 'linear-gradient(90deg, #ff4d00, #ff8c00)' }}
                  initial={{ width: 0 }}
                  animate={{ width: `${xpPct}%` }}
                  transition={{ duration: 0.8 }}
                />
              </div>
              <p className="text-[10px] text-white/30 mt-1">{user.xp} XP</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ background: '#ff4d00', color: '#050505' }}>
                {(session?.user?.name ?? 'U')[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{session?.user?.name ?? 'User'}</p>
                <p className="text-[10px] text-white/30 truncate">{session?.user?.email}</p>
              </div>
              <button onClick={() => signOut({ callbackUrl: '/login' })} className="btn-ghost p-1.5 rounded-lg" title="Sign out">
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      {/* ── Mobile top bar ── */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center gap-3 px-4 py-3 glass border-b border-white/5">
        <button onClick={() => setMobileOpen(true)} className="btn-ghost p-2 rounded-lg">
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 flex items-center justify-center" style={{ background: '#ff4d00' }}>
            <Zap className="w-3.5 h-3.5" style={{ color: '#050505' }} />
          </div>
          <span className="font-bold text-sm gradient-text" style={{ fontFamily: '"Courier New", Courier, monospace', letterSpacing: '0.1em' }}>TASKVERSE</span>
        </div>
      </div>

      {/* ── Mobile drawer overlay ── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="md:hidden fixed left-0 top-0 bottom-0 z-50 w-64 flex flex-col glass border-r border-white/5"
            >
              <div className="flex items-center justify-between gap-3 p-4 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 flex items-center justify-center shadow-glow" style={{ background: '#ff4d00' }}>
                    <Zap className="w-4 h-4" style={{ color: '#050505' }} />
                  </div>
                  <span className="font-bold text-sm gradient-text" style={{ fontFamily: '"Courier New", Courier, monospace', letterSpacing: '0.1em' }}>TASKVERSE</span>
                </div>
                <button onClick={() => setMobileOpen(false)} className="btn-ghost p-1.5 rounded-lg">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <SidebarContent collapsed={false} onClose={() => setMobileOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── Desktop sidebar ── */}
      <motion.aside
        animate={{ width: collapsed ? 64 : 240 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="hidden md:flex relative flex-col h-full glass border-r border-white/5 overflow-hidden"
      >
        <div className={cn('flex items-center p-4 border-b border-white/5', collapsed ? 'justify-center' : 'gap-3 justify-between')}>
          {!collapsed && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
              <div className="w-8 h-8 flex items-center justify-center shadow-glow flex-shrink-0" style={{ background: '#ff4d00' }}>
                <Zap className="w-4 h-4" style={{ color: '#050505' }} />
              </div>
              <span className="font-bold text-sm gradient-text" style={{ fontFamily: '"Courier New", Courier, monospace', letterSpacing: '0.1em' }}>TASKVERSE</span>
            </motion.div>
          )}
          {collapsed && (
            <div className="w-8 h-8 flex items-center justify-center" style={{ background: '#ff4d00' }}>
              <Zap className="w-4 h-4" style={{ color: '#050505' }} />
            </div>
          )}
          <button
            onClick={() => setCollapsed((c) => !c)}
            className={cn('btn-ghost p-1.5 rounded-lg', collapsed && 'absolute -right-3 top-5 glass border border-white/10 z-10')}
          >
            <ChevronLeft className={cn('w-4 h-4 transition-transform', collapsed && 'rotate-180')} />
          </button>
        </div>
        <SidebarContent collapsed={collapsed} />
      </motion.aside>
    </>
  )
}
