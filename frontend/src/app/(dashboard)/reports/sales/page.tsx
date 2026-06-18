'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { DollarSign, Receipt, TrendingUp, Download } from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

import { PageHeader } from '@/components/shared/page-header'
import { StatCard } from '@/components/shared/stat-card'
import { DateRangePicker } from '@/components/shared/date-range-picker'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { get } from '@/lib/api'
import { type DateRange } from 'react-day-picker'
import type { ApiResponse } from '@/types'

interface SalesSummary {
  totalRevenue: number
  totalTransactions: number
  avgOrderValue: number
}

interface SalesReportRow {
  date: string
  total: number
  count: number
  average: number
}

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
  })
}

export default function SalesReportPage() {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const today = new Date()

  const [dateRange, setDateRange] = useState<DateRange>({
    from: sevenDaysAgo,
    to: today,
  })

  const startDate = dateRange.from?.toISOString()
  const endDate = dateRange.to?.toISOString()

  const { data: summaryRes, isLoading: summaryLoading } = useQuery({
    queryKey: ['sales-report-summary', startDate, endDate],
    queryFn: () =>
      get<ApiResponse<SalesSummary>>('/reports/sales/summary', {
        params: { startDate, endDate },
      }),
  })

  const { data: salesRes, isLoading: salesLoading } = useQuery({
    queryKey: ['sales-report', startDate, endDate],
    queryFn: () =>
      get<ApiResponse<SalesReportRow[]>>('/reports/sales', {
        params: { startDate, endDate },
      }),
  })

  const summary = summaryRes?.data
  const salesData = salesRes?.data

  const exportCSV = () => {
    if (!salesData || salesData.length === 0) return
    const header = 'Date,Revenue,Transactions,Avg Order Value'
    const rows = salesData.map((r) =>
      `${r.date},${r.total},${r.count},${r.average}`
    )
    const csv = [header, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `sales-report-${startDate}-to-${endDate}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sales Report"
        description="Analyze sales performance over time"
      />

      <div className="flex flex-wrap items-end gap-4">
        <DateRangePicker
          value={dateRange}
          onChange={setDateRange}
        />
        <Button variant="outline" size="sm" onClick={exportCSV} disabled={!salesData || salesData.length === 0} className="gap-2">
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {summaryLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))
        ) : (
          <>
            <StatCard
              title="Total Revenue"
              value={formatCurrency(summary?.totalRevenue ?? 0)}
              icon={DollarSign}
            />
            <StatCard
              title="Total Transactions"
              value={summary?.totalTransactions ?? 0}
              icon={Receipt}
            />
            <StatCard
              title="Avg Order Value"
              value={formatCurrency(summary?.avgOrderValue ?? 0)}
              icon={TrendingUp}
            />
          </>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Revenue Trend</CardTitle>
        </CardHeader>
        <CardContent>
          {salesLoading ? (
            <Skeleton className="h-72 w-full rounded-xl" />
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesData}>
                  <defs>
                    <linearGradient id="revGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-accent)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--color-accent)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12, fill: 'var(--color-foreground)' }}
                    stroke="var(--color-border)"
                    tickFormatter={(v) => formatDate(v)}
                  />
                  <YAxis tick={{ fontSize: 12, fill: 'var(--color-foreground)' }} stroke="var(--color-border)" />
                  <Tooltip
                    contentStyle={{
                      background: 'var(--color-card)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '12px',
                      backdropFilter: 'blur(12px)',
                    }}
                    labelStyle={{ color: 'var(--color-foreground)' }}
                    itemStyle={{ color: 'var(--color-foreground)' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="total"
                    stroke="var(--color-accent)"
                    fill="url(#revGradient)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Daily Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Revenue</TableHead>
                <TableHead>Transactions</TableHead>
                <TableHead>Avg Order Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {salesLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 4 }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-5 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : !salesData || salesData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                    No data for the selected period
                  </TableCell>
                </TableRow>
              ) : (
                salesData.map((row) => (
                  <TableRow key={row.date}>
                    <TableCell className="text-muted-foreground">{formatDate(row.date)}</TableCell>
                    <TableCell className="font-medium text-foreground">
                      {formatCurrency(row.total)}
                    </TableCell>
                    <TableCell>{row.count}</TableCell>
                    <TableCell>{formatCurrency(row.average)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
