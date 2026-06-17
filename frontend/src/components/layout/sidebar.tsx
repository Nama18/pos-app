'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  FolderTree,
  Users,
  Receipt,
  Warehouse,
  BarChart3,
  UserCog,
  Settings,
  ChevronLeft,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { useAuthStore } from '@/stores/auth-store'
import { useUIStore } from '@/stores/ui-store'
import {
  Sheet,
  SheetContent,
  SheetClose,
} from '@/components/ui/sheet'

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
  adminOnly?: boolean
  warehouseOnly?: boolean
}

const fullNav: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard size={18} /> },
  { label: 'POS', href: '/pos', icon: <ShoppingCart size={18} /> },
  { label: 'Products', href: '/products', icon: <Package size={18} /> },
  { label: 'Categories', href: '/categories', icon: <FolderTree size={18} /> },
  { label: 'Customers', href: '/customers', icon: <Users size={18} /> },
  { label: 'Transactions', href: '/transactions', icon: <Receipt size={18} /> },
  { label: 'Inventory', href: '/inventory', icon: <Warehouse size={18} /> },
  { label: 'Reports', href: '/reports', icon: <BarChart3 size={18} /> },
  { label: 'Users', href: '/users', icon: <UserCog size={18} />, adminOnly: true },
  { label: 'Settings', href: '/settings', icon: <Settings size={18} /> },
]

const warehouseNav: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard size={18} /> },
  { label: 'Inventory', href: '/inventory', icon: <Warehouse size={18} /> },
  { label: 'Settings', href: '/settings', icon: <Settings size={18} /> },
]

function SidebarContent({ onNavClick }: { onNavClick?: () => void }) {
  const pathname = usePathname()
  const user = useAuthStore((s) => s.user)
  const sidebarOpen = useUIStore((s) => s.sidebarOpen)
  const setSidebarOpen = useUIStore((s) => s.setSidebarOpen)

  const isWarehouse = user?.role === 'Warehouse'
  const navItems = isWarehouse ? warehouseNav : fullNav

  return (
    <div className="flex h-full flex-col">
      <div className={cn('flex items-center gap-3 px-6 py-5', !sidebarOpen && 'justify-center px-2')}>
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground">
          P
        </div>
        {sidebarOpen && (
          <span className="font-display text-lg tracking-tight text-foreground">
            PrimePOS
          </span>
        )}
      </div>

      <Button
        variant="ghost"
        size="icon"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="ml-4 hidden h-7 w-7 lg:flex"
      >
        <ChevronLeft className={cn('h-4 w-4 transition-transform', !sidebarOpen && 'rotate-180')} />
      </Button>

      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => {
            if (item.adminOnly && user?.role !== 'Admin') return null

            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavClick}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-primary/10 text-primary shadow-sm'
                    : 'text-muted-foreground hover:bg-muted/30 hover:text-foreground'
                )}
              >
                <span className={cn(isActive ? 'text-primary' : 'text-muted-foreground')}>
                  {item.icon}
                </span>
                {sidebarOpen && <span>{item.label}</span>}
              </Link>
            )
          })}
        </nav>
      </ScrollArea>

      <div className="border-t border-border px-4 py-4">
        <div className={cn('flex items-center gap-3', !sidebarOpen && 'justify-center')}>
          <Badge variant={user?.role === 'Admin' ? 'default' : 'secondary'} className="h-6">
            {user?.role === 'Admin' ? 'Admin' : 'Cashier'}
          </Badge>
        </div>
      </div>
    </div>
  )
}

export function Sidebar() {
  const sidebarOpen = useUIStore((s) => s.sidebarOpen)

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-30 hidden h-screen flex-col border-r border-border bg-card backdrop-blur-xl transition-all duration-300 lg:flex',
        sidebarOpen ? 'w-60' : 'w-16'
      )}
    >
      <SidebarContent />
    </aside>
  )
}

export function MobileSidebar() {
  const sidebarOpen = useUIStore((s) => s.sidebarOpen)
  const setSidebarOpen = useUIStore((s) => s.setSidebarOpen)

  return (
    <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
      <SheetContent side="left" className="w-60 p-0">
        <SheetClose className="absolute right-4 top-4 z-50 rounded-lg opacity-70 ring-offset-background transition-opacity hover:opacity-100" />
        <SidebarContent onNavClick={() => setSidebarOpen(false)} />
      </SheetContent>
    </Sheet>
  )
}
