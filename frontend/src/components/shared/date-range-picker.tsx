'use client'

import { useState } from 'react'
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays } from 'date-fns'
import { CalendarIcon, ChevronDown, X } from 'lucide-react'
import { type DateRange } from 'react-day-picker'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'

interface DateRangePickerProps {
  value: DateRange
  onChange: (range: DateRange) => void
}

type Mode = 'single' | 'range'

const presets = [
  {
    label: 'Today',
    getValue: (): DateRange => {
      const today = new Date()
      return { from: today, to: today }
    },
  },
  {
    label: 'This Week',
    getValue: (): DateRange => {
      const today = new Date()
      return { from: startOfWeek(today, { weekStartsOn: 1 }), to: endOfWeek(today, { weekStartsOn: 1 }) }
    },
  },
  {
    label: 'This Month',
    getValue: (): DateRange => {
      const today = new Date()
      return { from: startOfMonth(today), to: endOfMonth(today) }
    },
  },
  {
    label: 'Last 7 Days',
    getValue: (): DateRange => {
      const today = new Date()
      return { from: subDays(today, 6), to: today }
    },
  },
  {
    label: 'Last 30 Days',
    getValue: (): DateRange => {
      const today = new Date()
      return { from: subDays(today, 29), to: today }
    },
  },
]

function formatDateRange(range: DateRange): string {
  if (!range.from) return 'Select dates...'
  if (!range.to || range.from.getTime() === range.to.getTime()) {
    return format(range.from, 'MMM d, yyyy')
  }
  return `${format(range.from, 'MMM d')} - ${format(range.to, 'MMM d, yyyy')}`
}

export function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<Mode>('range')

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            'h-9 w-[240px] justify-start gap-2 text-xs font-normal',
            !value.from && 'text-muted-foreground'
          )}
        >
          <CalendarIcon className="h-3.5 w-3.5 shrink-0" />
          <span className="flex-1 truncate text-left">
            {formatDateRange(value)}
          </span>
          {value.from && (
            <X
              className="h-3.5 w-3.5 shrink-0 text-muted-foreground hover:text-foreground"
              onClick={(e) => {
                e.stopPropagation()
                onChange({ from: undefined })
                setOpen(false)
              }}
            />
          )}
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="p-1"
        align="start"
        sideOffset={4}
        style={{ width: 'auto', minWidth: 0 }}
      >
        <div className="flex flex-col gap-1">
          <div className="flex rounded-md bg-muted/50 p-0.5">
            <button
              type="button"
              onClick={() => setMode('single')}
              className={cn(
                'flex-1 rounded px-2 py-0.5 text-[11px] font-medium transition-colors',
                mode === 'single'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Single
            </button>
            <button
              type="button"
              onClick={() => setMode('range')}
              className={cn(
                'flex-1 rounded px-2 py-0.5 text-[11px] font-medium transition-colors',
                mode === 'range'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Range
            </button>
          </div>

          {mode === 'single' ? (
            <Calendar
              mode="single"
              selected={value.from}
              onSelect={(date) => {
                onChange({ from: date, to: date })
                if (date) setOpen(false)
              }}
              showOutsideDays
            />
          ) : (
            <Calendar
              mode="range"
              selected={value}
              onSelect={(range) => {
                onChange(range ?? { from: undefined })
                if (range?.from && range?.to) setOpen(false)
              }}
              numberOfMonths={2}
              showOutsideDays
            />
          )}

          <Separator />

          <div className="flex flex-wrap gap-0.5">
            {presets.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => {
                  onChange(preset.getValue())
                  setOpen(false)
                }}
                className="rounded border border-border px-1.5 py-0.5 text-[11px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
