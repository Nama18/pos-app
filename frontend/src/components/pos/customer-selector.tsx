'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Check, ChevronsUpDown, User as UserIcon, Search } from 'lucide-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { get } from '@/lib/api'
import type { ApiResponse, Customer } from '@/types'

interface CustomerSelectorProps {
  value: Customer | null
  onChange: (customer: Customer | null) => void
}

export function CustomerSelector({ value, onChange }: CustomerSelectorProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['pos-customers', search],
    queryFn: () =>
      get<ApiResponse<Customer[]>>('/customers', {
        params: { search, limit: 20 },
      }),
    enabled: open,
  })

  const customers = data?.data ?? []

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="h-9 w-full justify-between gap-2 rounded-xl text-xs"
        >
          {value ? (
            <div className="flex items-center gap-2 overflow-hidden">
              <Avatar className="h-5 w-5">
                <AvatarFallback className="text-[8px]">
                  {value.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <span className="truncate">{value.name}</span>
            </div>
          ) : (
            <span className="text-muted-foreground">Walk-in Customer</span>
          )}
          <ChevronsUpDown className="h-3 w-3 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="start">
        <div className="border-b border-border p-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search customers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 rounded-lg pl-8 text-xs"
            />
          </div>
        </div>
        <ScrollArea className="max-h-56">
          <div className="p-1">
            <button
              onClick={() => {
                onChange(null)
                setOpen(false)
              }}
              className={cn(
                'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-xs transition-colors hover:bg-muted/40',
                !value && 'bg-muted/30'
              )}
            >
              <UserIcon className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Walk-in Customer</span>
              {!value && <Check className="ml-auto h-3.5 w-3.5 text-primary" />}
            </button>
            {customers.map((customer) => (
              <button
                key={customer.id}
                onClick={() => {
                  onChange(customer)
                  setOpen(false)
                }}
                className={cn(
                  'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-xs transition-colors hover:bg-muted/40',
                  value?.id === customer.id && 'bg-muted/30'
                )}
              >
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="text-[10px]">
                    {customer.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 overflow-hidden">
                  <p className="truncate font-medium text-foreground">{customer.name}</p>
                  {customer.phone && (
                    <p className="truncate text-muted-foreground">{customer.phone}</p>
                  )}
                </div>
                {customer.loyaltyPoints > 0 && (
                  <Badge variant="secondary" className="text-[9px]">
                    {customer.loyaltyPoints} pts
                  </Badge>
                )}
                {value?.id === customer.id && (
                  <Check className="h-3.5 w-3.5 shrink-0 text-primary" />
                )}
              </button>
            ))}
            {!isLoading && customers.length === 0 && (
              <p className="px-3 py-6 text-center text-xs text-muted-foreground">
                No customers found
              </p>
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
