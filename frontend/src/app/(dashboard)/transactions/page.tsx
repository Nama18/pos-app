'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { Eye } from 'lucide-react'

import { PageHeader } from '@/components/shared/page-header'
import { DataTable, type Column } from '@/components/shared/data-table'
import { FilterBar } from '@/components/shared/filter-bar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { get } from '@/lib/api'
import type { Transaction } from '@/types'

function formatCurrency(value: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(value)
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const paymentMethodLabels: Record<string, string> = {
  cash: 'Cash',
  card: 'Card',
  qris: 'QRIS',
  ewallet: 'E-Wallet',
  transfer: 'Transfer',
}

export default function TransactionsPage() {
  const router = useRouter()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['transactions', page, search, paymentMethod, startDate, endDate],
    queryFn: () =>
      get<{ success: boolean; data: Transaction[]; meta: { page: number; limit: number; total: number; totalPages: number; hasNextPage?: boolean; hasPreviousPage?: boolean } }>('/transactions', {
        params: {
          page,
          limit: 10,
          paymentMethod,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        },
      }),
  })

  const columns: Column<Transaction>[] = [
    {
      key: 'invoiceNo',
      header: 'Invoice #',
      sortable: true,
      render: (t) => (
        <span className="font-mono text-xs font-medium text-foreground">
          {t.invoiceNo}
        </span>
      ),
    },
    {
      key: 'customer',
      header: 'Customer',
      render: (t) => t.customer?.name ?? <span className="text-muted-foreground">Walk-in</span>,
    },
    {
      key: 'total',
      header: 'Total',
      sortable: true,
      render: (t) => (
        <span className="font-medium text-foreground">{formatCurrency(t.total)}</span>
      ),
    },
    {
      key: 'paymentMethod',
      header: 'Payment',
      render: (t) => (
        <Badge variant="secondary">{paymentMethodLabels[t.paymentMethod] ?? t.paymentMethod}</Badge>
      ),
    },
    {
      key: 'paymentStatus',
      header: 'Status',
      render: (t) => (
        <Badge
          variant={
            t.paymentStatus === 'paid'
              ? 'default'
              : t.paymentStatus === 'pending'
                ? 'secondary'
                : 'destructive'
          }
        >
          {t.paymentStatus}
        </Badge>
      ),
    },
    {
      key: 'createdAt',
      header: 'Date',
      sortable: true,
      render: (t) => (
        <span className="text-muted-foreground">{formatDate(t.createdAt)}</span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (t) => (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => router.push(`/transactions/${t.id}`)}
        >
          <Eye className="h-3.5 w-3.5" />
        </Button>
      ),
    },
  ]

  const transactions = data?.data ?? []
  const meta = data?.meta

  return (
    <div className="space-y-6">
      <PageHeader
        title="Transactions"
        description="View all sales transactions"
      />

      <FilterBar>
        <div className="flex items-end gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">From</Label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setPage(1) }}
              className="h-9 w-36 text-xs"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">To</Label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setPage(1) }}
              className="h-9 w-36 text-xs"
            />
          </div>
          <Select
            value={paymentMethod ?? 'all'}
            onValueChange={(v) => {
              setPaymentMethod(v === 'all' ? null : v)
              setPage(1)
            }}
          >
            <SelectTrigger className="h-9 w-40">
              <SelectValue placeholder="Payment Method" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Methods</SelectItem>
              <SelectItem value="cash">Cash</SelectItem>
              <SelectItem value="card">Card</SelectItem>
              <SelectItem value="qris">QRIS</SelectItem>
              <SelectItem value="ewallet">E-Wallet</SelectItem>
              <SelectItem value="transfer">Transfer</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </FilterBar>

      <DataTable<Transaction>
        columns={columns}
        data={transactions}
        meta={meta ? { ...meta } : undefined}
        isLoading={isLoading}
        onPageChange={setPage}
        onSearch={setSearch}
        searchPlaceholder="Search by invoice or customer..."
        keyExtractor={(t) => t.id}
      />
    </div>
  )
}
