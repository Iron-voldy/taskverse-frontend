'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Settings, User, Bell, Shield, Loader2, Mail, Flame, Sparkles, Check } from 'lucide-react'
import { toast } from 'sonner'
import { useSession } from 'next-auth/react'
import { useUserStore } from '@/store/useUserStore'
import { usersApi } from '@/lib/api'
import { getLevelTitle, getXpProgress } from '@/lib/utils'
import type { NotificationPrefs } from '@/types'

// ── Toggle switch component ──────────────────────────────────────────────────
function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      style={{
        position: 'relative', display: 'inline-flex', alignItems: 'center',
        width: '2.75rem', height: '1.5rem', borderRadius: '99px', flexShrink: 0,
        background: checked ? '#ff4d00' : 'rgba(255,255,255,0.1)',
        border: `1px solid ${checked ? 'rgba(255,77,0,0.5)' : 'rgba(255,255,255,0.12)'}`,
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'background 0.2s, border-color 0.2s',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <span style={{
        position: 'absolute',
        left: checked ? 'calc(100% - 1.2rem)' : '0.15rem',
        width: '1.1rem', height: '1.1rem', borderRadius: '50%',
        background: '#fff',
        boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
        transition: 'left 0.2s',
      }} />
    </button>
  )
}

// ── Notification row ─────────────────────────────────────────────────────────
function NotifRow({
  icon, title, description, checked, onChange, saving,
}: {
  icon: React.ReactNode
  title: string
  description: string
  checked: boolean
  onChange: (v: boolean) => void
  saving: boolean
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem',
      padding: '1rem 0',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
    }}>
      <div style={{ display: 'flex', gap: '0.875rem', alignItems: 'flex-start', flex: 1 }}>
        <div style={{
          width: '2.25rem', height: '2.25rem', borderRadius: '0.6rem', flexShrink: 0,
          background: checked ? 'rgba(255,77,0,0.12)' : 'rgba(255,255,255,0.05)',
          border: `1px solid ${checked ? 'rgba(255,77,0,0.25)' : 'rgba(255,255,255,0.08)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.2s',
          color: checked ? '#ff4d00' : 'rgba(238,232,222,0.35)',
        }}>
          {icon}
        </div>
        <div>
          <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#eee8de', marginBottom: '0.2rem' }}>{title}</p>
          <p style={{ fontSize: '0.75rem', color: 'rgba(238,232,222,0.4)', lineHeight: 1.5 }}>{description}</p>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0, marginTop: '0.15rem' }}>
        {saving && <Loader2 style={{ width: '0.85rem', height: '0.85rem', color: '#ff4d00', animation: 'spin 1s linear infinite' }} />}
        <Toggle checked={checked} onChange={onChange} disabled={saving} />
      </div>
    </div>
  )
}

export function SettingsPage() {
  const { user, fetchMe } = useUserStore()
  const { data: session } = useSession()
  const [name, setName] = useState(user?.name ?? session?.user?.name ?? '')
  const [loading, setLoading] = useState(false)

  // Sync name field when user loads from backend
  useEffect(() => {
    if (user?.name) setName(user.name)
  }, [user?.name])

  const defaultPrefs: NotificationPrefs = { dailyDigest: true, streakReminder: true, planCreated: true }
  const [prefs, setPrefs] = useState<NotificationPrefs>(user?.notificationPrefs ?? defaultPrefs)
  const [savingPref, setSavingPref] = useState<keyof NotificationPrefs | null>(null)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await usersApi.updateProfile({ name })
      await fetchMe()
      toast.success('Profile updated')
    } catch {
      toast.error('Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  async function handleToggle(key: keyof NotificationPrefs, value: boolean) {
    setPrefs((p) => ({ ...p, [key]: value }))
    setSavingPref(key)
    try {
      await usersApi.updateNotifications({ [key]: value })
      await fetchMe()
      toast.success(value ? 'Notification enabled' : 'Notification disabled')
    } catch {
      // Revert on failure
      setPrefs((p) => ({ ...p, [key]: !value }))
      toast.error('Failed to update notification setting')
    } finally {
      setSavingPref(null)
    }
  }

  const xpPct = user ? getXpProgress(user.xp, user.level) : 0

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Settings className="w-6 h-6 text-white/60" />
          Settings
        </h1>
        <p className="text-white/40 text-sm mt-1">Manage your account and preferences</p>
      </div>

      {/* Profile */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-6">
          <User className="w-4 h-4 text-violet-400" />
          <h2 className="font-bold">Profile</h2>
        </div>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="text-xs text-white/40 block mb-1.5">Display Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="input-field" required />
          </div>
          <div>
            <label className="text-xs text-white/40 block mb-1.5">Email</label>
            <input value={user?.email ?? session?.user?.email ?? ''} disabled className="input-field opacity-50 cursor-not-allowed" />
          </div>
          <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Save Changes
          </button>
        </form>
      </motion.div>

      {/* XP & Level */}
      {user && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <Shield className="w-4 h-4 text-amber-400" />
            <h2 className="font-bold">Progress</h2>
          </div>
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              { label: 'Level', value: user.level, color: 'text-violet-400' },
              { label: 'XP', value: user.xp.toLocaleString(), color: 'text-amber-400' },
              { label: 'Streak', value: `${user.streak}d`, color: 'text-orange-400' },
            ].map((s) => (
              <div key={s.label} className="glass rounded-xl p-4 text-center">
                <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                <div className="text-xs text-white/40 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
          <div>
            <div className="flex justify-between text-xs text-white/40 mb-2">
              <span>Level {user.level} — {getLevelTitle(user.level)}</span>
              <span>{xpPct}% to next level</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-violet-500 to-amber-400 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${xpPct}%` }}
                transition={{ duration: 1 }}
              />
            </div>
          </div>
        </motion.div>
      )}

      {/* Email Notifications */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass rounded-2xl p-6">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
          <Bell style={{ width: '1rem', height: '1rem', color: '#ff4d00' }} />
          <h2 className="font-bold">Email Notifications</h2>
          <span style={{
            marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
            fontSize: '0.68rem', color: '#4ade80', background: 'rgba(74,222,128,0.1)',
            padding: '0.15rem 0.6rem', borderRadius: '99px', border: '1px solid rgba(74,222,128,0.2)',
          }}>
            <Check style={{ width: '0.65rem', height: '0.65rem' }} /> Active
          </span>
        </div>
        <p style={{ fontSize: '0.78rem', color: 'rgba(238,232,222,0.38)', marginBottom: '0.25rem' }}>
          Emails are sent to <strong style={{ color: '#eee8de' }}>{user?.email ?? session?.user?.email}</strong>
        </p>

        <div style={{ marginTop: '0.5rem' }}>
          <NotifRow
            icon={<Mail style={{ width: '1rem', height: '1rem' }} />}
            title="Daily Task Digest"
            description="Receive tomorrow's task list every night at midnight so you can plan ahead."
            checked={prefs.dailyDigest}
            onChange={(v) => handleToggle('dailyDigest', v)}
            saving={savingPref === 'dailyDigest'}
          />
          <NotifRow
            icon={<Flame style={{ width: '1rem', height: '1rem' }} />}
            title="Streak-at-Risk Reminder"
            description="Get an alert at midnight if you haven't completed any task today and your streak is active."
            checked={prefs.streakReminder}
            onChange={(v) => handleToggle('streakReminder', v)}
            saving={savingPref === 'streakReminder'}
          />
          <div style={{ borderBottom: 'none' }}>
            <NotifRow
              icon={<Sparkles style={{ width: '1rem', height: '1rem' }} />}
              title="Task Plan Created"
              description="Receive a confirmation email with the full task list whenever you save an AI-generated plan."
              checked={prefs.planCreated}
              onChange={(v) => handleToggle('planCreated', v)}
              saving={savingPref === 'planCreated'}
            />
          </div>
        </div>
      </motion.div>
    </div>
  )
}
