'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Package, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'

import { PageHeader } from '@/components/shared/page-header'
import { StatCard } from '@/components/shared/stat-card'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { get, post } from '@/lib/api'
import type {
  ApiResponse,
  Product,
  InventoryLog,
  InventoryType,
} from '@/types'

const stockInSchema = z.object({
  productId: z.string().min(1, 'Product is required'),
  quantity: z.coerce.number().int().min(1, 'Must be at least 1'),
  reference: z.string().optional(),
  notes: z.string().optional(),
})

const stockOutSchema = z.object({
  productId: z.string().min(1, 'Product is required'),
  quantity: z.coerce.number().int().min(1, 'Must be at least 1'),
  reference: z.string().optional(),
  notes: z.string().optional(),
})

const adjustmentSchema = z.object({
  productId: z.string().min(1, 'Product is required'),
  quantity: z.coerce.number().int(),
  reason: z.string().min(1, 'Reason is required'),
  notes: z.string().optional(),
})

type StockInForm = z.infer<typeof stockInSchema>
type StockOutForm = z.infer<typeof stockOutSchema>
type AdjustmentForm = z.infer<typeof adjustmentSchema>

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function InventoryPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)

  const { data: lowStockRes, isLoading: lowStockLoading } = useQuery({
    queryKey: ['inventory-low-stock'],
    queryFn: () =>
      get<ApiResponse<Product[]>>('/inventory/low-stock'),
  })

  const { data: productsRes } = useQuery({
    queryKey: ['inventory-products'],
    queryFn: () =>
      get<ApiResponse<Product[]>>('/products', { params: { limit: 200 } }),
  })

  const { data: historyRes, isLoading: historyLoading } = useQuery({
    queryKey: ['inventory-history', page],
    queryFn: () =>
      get<ApiResponse<InventoryLog[]>>('/inventory', {
        params: { page, limit: 10 },
      }),
  })

  const products = productsRes?.data ?? []
  const lowStockProducts = lowStockRes?.data ?? []
  const history = historyRes?.data ?? []
  const historyMeta = historyRes?.meta

  const stockInForm = useForm<StockInForm>({
    resolver: zodResolver(stockInSchema),
  })

  const stockOutForm = useForm<StockOutForm>({
    resolver: zodResolver(stockOutSchema),
  })

  const adjustmentForm = useForm<AdjustmentForm>({
    resolver: zodResolver(adjustmentSchema),
  })

  const stockInMutation = useMutation({
    mutationFn: (data: StockInForm) =>
      post('/inventory/stock-in', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      toast.success('Stock added')
      stockInForm.reset()
    },
  })

  const stockOutMutation = useMutation({
    mutationFn: (data: StockOutForm) =>
      post('/inventory/stock-out', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      toast.success('Stock removed')
      stockOutForm.reset()
    },
  })

  const adjustmentMutation = useMutation({
    mutationFn: (data: AdjustmentForm) =>
      post('/inventory/adjust', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      toast.success('Stock adjusted')
      adjustmentForm.reset()
    },
  })

  const typeLabels: Record<InventoryType, string> = {
    in: 'Stock In',
    out: 'Stock Out',
    adjustment: 'Adjustment',
  }

  const typeVariants: Record<InventoryType, 'default' | 'destructive' | 'secondary'> = {
    in: 'default',
    out: 'destructive',
    adjustment: 'secondary',
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventory Management"
        description="Track and manage stock levels"
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Total Products"
          value={products.length}
          icon={Package}
        />
        <StatCard
          title="Low Stock Items"
          value={lowStockProducts.length}
          icon={AlertTriangle}
        />
      </div>

      {lowStockProducts.length > 0 && (
        <Card className="border-destructive/30">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Low Stock Alerts
            </CardTitle>
            <CardDescription>
              These products are running low and need restocking
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Current Stock</TableHead>
                  <TableHead>Min Stock</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lowStockProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium text-foreground">
                      {product.name}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{product.sku}</TableCell>
                    <TableCell>{product.stock}</TableCell>
                    <TableCell>{product.minStock}</TableCell>
                    <TableCell>
                      <Badge variant="destructive">Low Stock</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="stock-in">
        <TabsList>
          <TabsTrigger value="stock-in">Stock In</TabsTrigger>
          <TabsTrigger value="stock-out">Stock Out</TabsTrigger>
          <TabsTrigger value="adjustment">Adjustment</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="stock-in">
          <Card>
            <CardHeader>
              <CardTitle>Stock In</CardTitle>
              <CardDescription>Add stock to inventory</CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={stockInForm.handleSubmit((data) =>
                  stockInMutation.mutate(data)
                )}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="stockInProduct">Product</Label>
                  <Select
                    value={stockInForm.watch('productId')}
                    onValueChange={(v) =>
                      stockInForm.setValue('productId', v, { shouldValidate: true })
                    }
                  >
                    <SelectTrigger id="stockInProduct">
                      <SelectValue placeholder="Select product" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name} (Stock: {p.stock})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="stockInQty">Quantity</Label>
                    <Input
                      id="stockInQty"
                      type="number"
                      placeholder="0"
                      {...stockInForm.register('quantity')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stockInRef">Reference</Label>
                    <Input
                      id="stockInRef"
                      placeholder="PO-001"
                      {...stockInForm.register('reference')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stockInNotes">Notes</Label>
                    <Input
                      id="stockInNotes"
                      placeholder="Optional"
                      {...stockInForm.register('notes')}
                    />
                  </div>
                </div>
                <Button type="submit" disabled={stockInMutation.isPending}>
                  {stockInMutation.isPending ? 'Processing...' : 'Add Stock'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stock-out">
          <Card>
            <CardHeader>
              <CardTitle>Stock Out</CardTitle>
              <CardDescription>Remove stock from inventory</CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={stockOutForm.handleSubmit((data) =>
                  stockOutMutation.mutate(data)
                )}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="stockOutProduct">Product</Label>
                  <Select
                    value={stockOutForm.watch('productId')}
                    onValueChange={(v) =>
                      stockOutForm.setValue('productId', v, { shouldValidate: true })
                    }
                  >
                    <SelectTrigger id="stockOutProduct">
                      <SelectValue placeholder="Select product" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name} (Stock: {p.stock})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="stockOutQty">Quantity</Label>
                    <Input
                      id="stockOutQty"
                      type="number"
                      placeholder="0"
                      {...stockOutForm.register('quantity')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stockOutRef">Reference</Label>
                    <Input
                      id="stockOutRef"
                      placeholder="WASTE-001"
                      {...stockOutForm.register('reference')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stockOutNotes">Notes</Label>
                    <Input
                      id="stockOutNotes"
                      placeholder="Optional"
                      {...stockOutForm.register('notes')}
                    />
                  </div>
                </div>
                <Button type="submit" disabled={stockOutMutation.isPending}>
                  {stockOutMutation.isPending ? 'Processing...' : 'Remove Stock'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="adjustment">
          <Card>
            <CardHeader>
              <CardTitle>Stock Adjustment</CardTitle>
              <CardDescription>
                Adjust stock levels (positive or negative)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={adjustmentForm.handleSubmit((data) =>
                  adjustmentMutation.mutate(data)
                )}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="adjProduct">Product</Label>
                  <Select
                    value={adjustmentForm.watch('productId')}
                    onValueChange={(v) =>
                      adjustmentForm.setValue('productId', v, { shouldValidate: true })
                    }
                  >
                    <SelectTrigger id="adjProduct">
                      <SelectValue placeholder="Select product" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name} (Stock: {p.stock})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="adjQty">Quantity Change</Label>
                    <Input
                      id="adjQty"
                      type="number"
                      placeholder="Use positive or negative"
                      {...adjustmentForm.register('quantity')}
                    />
                    <p className="text-xs text-muted-foreground">
                      Use positive to increase, negative to decrease
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="adjReason">Reason</Label>
                    <Input
                      id="adjReason"
                      placeholder="Required"
                      {...adjustmentForm.register('reason')}
                    />
                    {adjustmentForm.formState.errors.reason && (
                      <p className="text-xs text-destructive">
                        {adjustmentForm.formState.errors.reason.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="adjNotes">Notes</Label>
                    <Input
                      id="adjNotes"
                      placeholder="Optional"
                      {...adjustmentForm.register('notes')}
                    />
                  </div>
                </div>
                <Button type="submit" disabled={adjustmentMutation.isPending}>
                  {adjustmentMutation.isPending ? 'Processing...' : 'Apply Adjustment'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Inventory History</CardTitle>
            </CardHeader>
            <CardContent>
              {historyLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full rounded-xl" />
                  ))}
                </div>
              ) : history.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No inventory history yet
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead>User</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="text-muted-foreground">
                          {formatDate(log.createdAt)}
                        </TableCell>
                        <TableCell className="font-medium text-foreground">
                          {log.productName}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {log.productSku}
                        </TableCell>
                        <TableCell>
                          <Badge variant={typeVariants[log.type]}>
                            {typeLabels[log.type]}
                          </Badge>
                        </TableCell>
                        <TableCell
                          className={
                            log.type === 'in'
                              ? 'text-accent'
                              : log.type === 'out'
                                ? 'text-destructive'
                                : ''
                          }
                        >
                          {log.type === 'in' ? '+' : log.type === 'out' ? '-' : ''}
                          {log.quantity}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {log.reference ?? '-'}
                        </TableCell>
                        <TableCell>{log.user.name}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}

              {historyMeta && historyMeta.totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Page {historyMeta.page} of {historyMeta.totalPages}
                  </p>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={historyMeta.page <= 1}
                      onClick={() => setPage((p) => p - 1)}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={historyMeta.page >= historyMeta.totalPages}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
