import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'
import { Separator } from '@/components/ui/separator'

interface FilterBarProps {
  children: ReactNode
  className?: string
}

export function FilterBar({ children, className }: FilterBarProps) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card/60 backdrop-blur-xl p-3',
        className
      )}
    >
      {children}
    </div>
  )
}

interface FilterChipProps {
  label: string
  active?: boolean
  onClick?: () => void
}

export function FilterChip({ label, active, onClick }: FilterChipProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center rounded-xl px-3 py-1.5 font-mono text-xs font-semibold uppercase tracking-widest transition-all duration-200',
        active
          ? 'bg-primary/10 text-primary shadow-sm'
          : 'bg-muted/30 text-muted-foreground hover:bg-muted/50 hover:text-foreground'
      )}
    >
      {label}
    </button>
  )
}
