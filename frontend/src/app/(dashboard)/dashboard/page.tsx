'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  DollarSign,
  Receipt,
  Package,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

import { PageHeader } from '@/components/shared/page-header'
import { StatCard } from '@/components/shared/stat-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { get } from '@/lib/api'
import type { ApiResponse, Product, Transaction } from '@/types'

interface DashboardStats {
  todaySales: number
  todayTransactions: number
  totalProducts: number
  lowStockCount: number
  salesTrend: number
  transactionsTrend: number
  productsTrend: number
  lowStockTrend: number
}

interface SalesChartData {
  date: string
  total: number
  count: number
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(value)
}

const periods = [
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'This Week' },
  { key: 'month', label: 'This Month' },
  { key: 'year', label: 'This Year' },
  { key: 'all', label: 'All Time' },
] as const

type Period = (typeof periods)[number]['key']

function getDateRange(period: Period): { startDate?: string; endDate?: string } {
  const now = new Date()
  const endDate = now.toISOString()

  switch (period) {
    case 'today': {
      const start = new Date(now)
      start.setHours(0, 0, 0, 0)
      return { startDate: start.toISOString(), endDate }
    }
    case 'week': {
      const start = new Date(now)
      start.setDate(start.getDate() - start.getDay())
      start.setHours(0, 0, 0, 0)
      return { startDate: start.toISOString(), endDate }
    }
    case 'month': {
      const start = new Date(now.getFullYear(), now.getMonth(), 1)
      return { startDate: start.toISOString(), endDate }
    }
    case 'year': {
      const start = new Date(now.getFullYear(), 0, 1)
      return { startDate: start.toISOString(), endDate }
    }
    default:
      return { endDate }
  }
}

export default function DashboardPage() {
  const [period, setPeriod] = useState<Period>('month')

  const { data: statsRes, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => get<ApiResponse<DashboardStats>>('/dashboard/stats'),
  })

  const { data: chartRes, isLoading: chartLoading } = useQuery({
    queryKey: ['dashboard-sales-chart', period],
    queryFn: () =>
      get<ApiResponse<SalesChartData[]>>('/dashboard/sales-chart', {
        params: getDateRange(period),
      }),
  })

  const { data: transactionsRes, isLoading: transactionsLoading } = useQuery({
    queryKey: ['dashboard-recent-transactions'],
    queryFn: () =>
      get<ApiResponse<Transaction[]>>('/dashboard/recent-transactions'),
  })

  const { data: lowStockRes, isLoading: lowStockLoading } = useQuery({
    queryKey: ['dashboard-low-stock'],
    queryFn: () => get<ApiResponse<Product[]>>('/dashboard/low-stock'),
  })

  const stats = statsRes?.data
  const chartData = chartRes?.data
  const recentTransactions = transactionsRes?.data
  const lowStockProducts = lowStockRes?.data

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Overview of your business"
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statsLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))
        ) : (
          <>
            <StatCard
              title="Today's Sales"
              value={formatCurrency(stats?.todaySales ?? 0)}
              icon={DollarSign}
              trend={stats?.salesTrend}
              trendUp={(stats?.salesTrend ?? 0) >= 0}
            />
            <StatCard
              title="Transactions"
              value={stats?.todayTransactions ?? 0}
              icon={Receipt}
              trend={stats?.transactionsTrend}
              trendUp={(stats?.transactionsTrend ?? 0) >= 0}
            />
            <StatCard
              title="Products"
              value={stats?.totalProducts ?? 0}
              icon={Package}
              trend={stats?.productsTrend}
              trendUp={(stats?.productsTrend ?? 0) >= 0}
            />
            <StatCard
              title="Low Stock"
              value={stats?.lowStockCount ?? 0}
              icon={AlertTriangle}
              trend={stats?.lowStockTrend}
              trendUp={false}
            />
          </>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between gap-4">
            <CardTitle>Sales Overview</CardTitle>
            <div className="flex gap-1">
              {periods.map((p) => (
                <Button
                  key={p.key}
                  variant={period === p.key ? 'default' : 'ghost'}
                  size="sm"
                  className="h-7 px-2.5 text-xs"
                  onClick={() => setPeriod(p.key)}
                >
                  {p.label}
                </Button>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            {chartLoading ? (
              <Skeleton className="h-72 w-full rounded-xl" />
            ) : !chartData || chartData.length === 0 ? (
              <div className="flex h-72 items-center justify-center text-sm text-muted-foreground">
                No sales data for this period
              </div>
            ) : (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 12, fill: 'var(--color-foreground)' }}
                      stroke="var(--color-border)"
                    />
                    <YAxis
                      tick={{ fontSize: 12, fill: 'var(--color-foreground)' }}
                      stroke="var(--color-border)"
                    />
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
                    <Bar
                      dataKey="total"
                      fill="oklch(0.72 0.18 162)"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            {transactionsLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full rounded-xl" />
                ))}
              </div>
            ) : !recentTransactions || recentTransactions.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No recent transactions
              </p>
            ) : (
              <div className="space-y-3">
                {recentTransactions.slice(0, 5).map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between rounded-xl bg-muted/20 px-3 py-2"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {t.invoiceNo}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t.customer?.name ?? 'Walk-in'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-foreground">
                        {formatCurrency(t.total)}
                      </p>
                      <Badge
                        variant={
                          t.paymentStatus === 'paid'
                            ? 'default'
                            : t.paymentStatus === 'pending'
                              ? 'secondary'
                              : 'destructive'
                        }
                        className="text-[10px]"
                      >
                        {t.paymentStatus}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Low Stock Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          {lowStockLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-xl" />
              ))}
            </div>
          ) : !lowStockProducts || lowStockProducts.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8">
              <Package className="h-10 w-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                All products are well stocked
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Min Stock</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lowStockProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{product.sku}</TableCell>
                    <TableCell>{product.stock}</TableCell>
                    <TableCell>{product.minStock}</TableCell>
                    <TableCell>
                      <Badge variant="destructive">Low Stock</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
