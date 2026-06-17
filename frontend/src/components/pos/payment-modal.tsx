'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import type { PaymentMethod } from '@/types'

interface PaymentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  total: number
  paymentMethod: PaymentMethod
  onPaymentMethodChange: (method: PaymentMethod) => void
  onConfirm: (amountTendered: number) => void
  isProcessing: boolean
}

const paymentMethods: { value: PaymentMethod; label: string }[] = [
  { value: 'cash', label: 'Cash' },
  { value: 'card', label: 'Card' },
  { value: 'qris', label: 'QRIS' },
  { value: 'ewallet', label: 'E-Wallet' },
  { value: 'transfer', label: 'Transfer' },
]

export function PaymentModal({
  open,
  onOpenChange,
  total,
  paymentMethod,
  onPaymentMethodChange,
  onConfirm,
  isProcessing,
}: PaymentModalProps) {
  const [amountTendered, setAmountTendered] = useState('')

  const parsedAmount = parseFloat(amountTendered) || 0
  const change = parsedAmount - total
  const isExact = Math.abs(parsedAmount - total) < 0.01
  const enoughAmount = parsedAmount >= total

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v)

  const quickAmounts = isNaN(total) ? [] : [
    Math.ceil(total / 10000) * 10000,
    Math.ceil(total / 20000) * 20000,
    Math.ceil(total / 50000) * 50000,
    Math.ceil(total / 100000) * 100000,
  ]

  const handleSubmit = () => {
    if (paymentMethod === 'cash') {
      if (!enoughAmount) return
      onConfirm(parsedAmount)
    } else {
      onConfirm(total)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg">Process Payment</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-xl bg-muted/20 p-4 text-center">
            <p className="text-xs text-muted-foreground">Total Amount</p>
            <p className="mt-1 text-3xl font-bold text-foreground">{formatCurrency(total)}</p>
          </div>

          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">Payment Method</p>
            <div className="grid grid-cols-5 gap-2">
              {paymentMethods.map((pm) => (
                <Button
                  key={pm.value}
                  variant={paymentMethod === pm.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onPaymentMethodChange(pm.value)}
                  className="text-xs"
                >
                  {pm.label}
                </Button>
              ))}
            </div>
          </div>

          {paymentMethod === 'cash' && (
            <>
              <Separator />

              <div>
                <p className="mb-2 text-xs font-medium text-muted-foreground">Amount Tendered</p>
                <Input
                  type="number"
                  placeholder="Enter amount received..."
                  value={amountTendered}
                  onChange={(e) => setAmountTendered(e.target.value)}
                  className="h-12 text-lg font-semibold"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                {[...new Set(quickAmounts)].map((amount) => (
                  <Button
                    key={amount}
                    variant="outline"
                    size="sm"
                    onClick={() => setAmountTendered(String(amount))}
                    className="text-xs"
                  >
                    {formatCurrency(amount)}
                  </Button>
                ))}
              </div>

              {amountTendered && (
                <>
                  <Separator />
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Total</span>
                      <span>{formatCurrency(total)}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Tendered</span>
                      <span>{formatCurrency(parsedAmount)}</span>
                    </div>
                    <Separator />
                    <div className={`flex justify-between text-lg font-bold ${change >= 0 ? 'text-accent' : 'text-destructive'}`}>
                      <span>{change >= 0 ? 'Change' : 'Short'}</span>
                      <span>{formatCurrency(Math.abs(change))}</span>
                    </div>
                  </div>
                </>
              )}
            </>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={handleSubmit}
              disabled={
                isProcessing ||
                (paymentMethod === 'cash' && (!amountTendered || !enoughAmount))
              }
            >
              {isProcessing ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                  Processing...
                </span>
              ) : (
                `Pay ${formatCurrency(paymentMethod === 'cash' ? parsedAmount : total)}`
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
