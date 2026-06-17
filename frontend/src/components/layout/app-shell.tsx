'use client'

import { useEffect } from 'react'
import { clsx } from 'clsx'

import { Sidebar, MobileSidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { useUIStore } from '@/stores/ui-store'

interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const sidebarOpen = useUIStore((s) => s.sidebarOpen)
  const setIsMobile = useUIStore((s) => s.setIsMobile)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024)
      if (window.innerWidth >= 1024) {
        useUIStore.getState().setSidebarOpen(true)
      }
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [setIsMobile])

  return (
    <div className="min-h-screen planner-bg">
      <Sidebar />
      <MobileSidebar />

      <div
        className={clsx(
          'flex min-h-screen flex-col transition-all duration-300',
          sidebarOpen ? 'lg:pl-60' : 'lg:pl-16'
        )}
      >
        <Header />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
