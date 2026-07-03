import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { Sidebar } from '@/components/layout/Sidebar'
import { AppInit } from '@/components/layout/AppInit'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect('/login')

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-surface-950">
        <AppInit />
        {/* pt-14 on mobile for the fixed top bar, none on md+ */}
        <div className="max-w-6xl mx-auto p-4 pt-16 md:pt-6 md:p-6">
          {children}
        </div>
      </main>
    </div>
  )
}
