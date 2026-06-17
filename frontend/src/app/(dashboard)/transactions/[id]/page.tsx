'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Printer } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ReceiptPreview } from '@/components/pos/receipt-preview'
import { get } from '@/lib/api'
import type { ApiResponse, Transaction, ReceiptData } from '@/types'

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
    month: 'long',
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

export default function TransactionDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const [showReceipt, setShowReceipt] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['transaction', id],
    queryFn: () => get<ApiResponse<Transaction>>(`/pos/transactions/${id}`),
  })

  const { data: receiptRes } = useQuery({
    queryKey: ['receipt', id],
    queryFn: () => get<ApiResponse<ReceiptData>>(`/pos/transactions/${id}/receipt`),
    enabled: showReceipt,
  })

  const transaction = data?.data
  const receiptData = receiptRes?.data

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    )
  }

  if (!transaction) {
    return (
      <div className="flex flex-col items-center gap-4 py-16">
        <p className="text-lg text-muted-foreground">Transaction not found</p>
        <Button variant="outline" onClick={() => router.back()}>
          Go Back
        </Button>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="font-display text-2xl tracking-tight text-foreground">
                {transaction.invoiceNo}
              </h1>
              <p className="text-sm text-muted-foreground">
                {formatDate(transaction.createdAt)}
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={() => setShowReceipt(true)} className="gap-2">
            <Printer className="h-4 w-4" />
            Print Receipt
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Invoice Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Invoice No</span>
                <span className="font-mono text-sm font-medium text-foreground">
                  {transaction.invoiceNo}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date</span>
                <span className="text-sm text-foreground">
                  {formatDate(transaction.createdAt)}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cashier</span>
                <span className="text-sm font-medium text-foreground">
                  {transaction.user.name}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Customer</span>
                <span className="text-sm font-medium text-foreground">
                  {transaction.customer?.name ?? 'Walk-in'}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payment Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Payment Method</span>
                <Badge variant="secondary">
                  {paymentMethodLabels[transaction.paymentMethod] ?? transaction.paymentMethod}
                </Badge>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <Badge
                  variant={
                    transaction.paymentStatus === 'paid'
                      ? 'default'
                      : transaction.paymentStatus === 'pending'
                        ? 'secondary'
                        : 'destructive'
                  }
                >
                  {transaction.paymentStatus}
                </Badge>
              </div>
              {transaction.notes && (
                <>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Notes</span>
                    <span className="text-sm text-foreground">{transaction.notes}</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Items</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Subtotal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transaction.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium text-foreground">
                      {item.productName}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {item.productSku}
                    </TableCell>
                    <TableCell className="text-right">{item.quantity}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(item.unitPrice)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(item.subtotal)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <Separator className="my-4" />

            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>{formatCurrency(transaction.subtotal)}</span>
              </div>
              {transaction.discountAmount > 0 && (
                <div className="flex justify-between text-destructive">
                  <span>
                    Discount
                    {transaction.discountType === 'percentage' &&
                      ` (${transaction.discountValue}%)`}
                  </span>
                  <span>-{formatCurrency(transaction.discountAmount)}</span>
                </div>
              )}
              {transaction.taxAmount > 0 && (
                <div className="flex justify-between text-muted-foreground">
                  <span>Tax ({transaction.taxRate}%)</span>
                  <span>{formatCurrency(transaction.taxAmount)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between text-lg font-bold text-foreground">
                <span>Total</span>
                <span>{formatCurrency(transaction.total)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {showReceipt && receiptData && (
        <ReceiptPreview
          data={receiptData}
          paperSize="80mm"
          onClose={() => setShowReceipt(false)}
        />
      )}
    </>
  )
}
