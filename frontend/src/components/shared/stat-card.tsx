'use client'

import type { LucideIcon } from 'lucide-react'
import { TrendingUp, TrendingDown } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/card'

interface StatCardProps {
  title: string
  value: string | number
  description?: string
  icon: LucideIcon
  trend?: number
  trendUp?: boolean
}

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  trendUp,
}: StatCardProps) {
  return (
    <Card className="glass-panel paper-card rounded-2xl p-5 transition-all duration-200 hover:shadow-md">
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <span className="micro-label text-muted-foreground">{title}</span>
          <span className="font-display text-3xl tracking-tight text-foreground">
            {value}
          </span>
          {description && (
            <span className="text-xs text-muted-foreground">{description}</span>
          )}
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <Icon className="h-5 w-5 text-primary" />
        </div>
      </div>

      {trend !== undefined && (
        <div className="mt-3 flex items-center gap-1.5">
          <span
            className={cn(
              'flex items-center gap-0.5 text-xs font-medium',
              trendUp ? 'text-accent' : 'text-destructive'
            )}
          >
            {trendUp ? (
              <TrendingUp className="h-3.5 w-3.5" />
            ) : (
              <TrendingDown className="h-3.5 w-3.5" />
            )}
            {Math.abs(trend)}%
          </span>
          <span className="text-xs text-muted-foreground">vs last month</span>
        </div>
      )}
    </Card>
  )
}
