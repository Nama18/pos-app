'use client'

import { useQuery } from '@tanstack/react-query'
import { Package, DollarSign, AlertTriangle, Download } from 'lucide-react'
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'

import { PageHeader } from '@/components/shared/page-header'
import { StatCard } from '@/components/shared/stat-card'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import type { ApiResponse } from '@/types'

interface InventorySummary {
  totalProducts: number
  totalStockValue: number
  lowStockItems: number
}



function formatCurrency(value: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(value)
}

const COLORS = [
  'oklch(0.72 0.18 162)',
  'oklch(0.62 0.22 252)',
  'oklch(0.65 0.2 40)',
  'oklch(0.7 0.15 320)',
  'oklch(0.6 0.15 180)',
  'oklch(0.55 0.2 10)',
]

export default function InventoryReportPage() {
  const { data: summaryRes, isLoading: summaryLoading } = useQuery({
    queryKey: ['inventory-report-summary'],
    queryFn: () =>
      get<ApiResponse<InventorySummary>>('/reports/inventory'),
  })

  const { data: topRes, isLoading: topLoading } = useQuery({
    queryKey: ['inventory-top-products'],
    queryFn: () =>
      get<ApiResponse<{ productName: string; productSku: string; totalQuantity: number; totalRevenue: number }[]>>('/reports/top-products', {
        params: { limit: 10 },
      }),
  })

  const summaryData = summaryRes?.data as InventorySummary & { categoryDistribution?: { categoryName: string; productCount: number; totalStock: number }[] } | undefined
  const distribution = (summaryData?.categoryDistribution ?? []).map((c) => ({
    name: c.categoryName,
    count: c.productCount,
    value: c.totalStock,
  }))
  const topProducts = topRes?.data ?? []

  const exportCSV = () => {
    if (!topProducts || topProducts.length === 0) return
    const header = 'Product,SKU,Total Quantity,Total Revenue'
    const rows = topProducts.map((r: any) =>
      `${r.productName},${r.productSku},${r.totalQuantity},${r.totalRevenue}`
    )
    const csv = [header, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'inventory-report.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <PageHeader
          title="Inventory Report"
          description="Stock levels, value, and product analysis"
        />
        <Button variant="outline" size="sm" onClick={exportCSV} disabled={!topProducts || topProducts.length === 0} className="gap-2">
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
              title="Total Products"
              value={summaryData?.totalProducts ?? 0}
              icon={Package}
            />
            <StatCard
              title="Total Stock Value"
              value={formatCurrency(summaryData?.totalStockValue ?? 0)}
              icon={DollarSign}
            />
            <StatCard
              title="Low Stock Items"
              value={summaryData?.lowStockItems ?? 0}
              icon={AlertTriangle}
            />
          </>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Stock Distribution by Category</CardTitle>
          </CardHeader>
          <CardContent>
            {summaryLoading ? (
              <Skeleton className="h-72 w-full rounded-xl" />
            ) : distribution.length === 0 ? (
              <p className="py-16 text-center text-sm text-muted-foreground">
                No category data available
              </p>
            ) : (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={distribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={4}
                      dataKey="count"
                      nameKey="name"
                    >
                      {distribution.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
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
                    <Legend
                      wrapperStyle={{ fontSize: '12px', color: 'var(--color-foreground)' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Selling Products</CardTitle>
          </CardHeader>
          <CardContent>
            {topLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full rounded-xl" />
                ))}
              </div>
            ) : topProducts.length === 0 ? (
              <p className="py-16 text-center text-sm text-muted-foreground">
                No product data available
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Total Sold</TableHead>
                    <TableHead>Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topProducts.map((product: any, index: number) => (
                    <TableRow key={product.productId ?? index}>
                      <TableCell className="font-medium text-foreground">
                        <span className="mr-2 text-muted-foreground">
                          #{index + 1}
                        </span>
                        {product.productName}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {product.productSku}
                      </TableCell>
                      <TableCell>{product.totalQuantity} sold</TableCell>
                      <TableCell>{formatCurrency(product.totalRevenue)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
