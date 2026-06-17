'use client'

import { useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Printer, X } from 'lucide-react'
import type { ReceiptData } from '@/types'

interface ReceiptPreviewProps {
  data: ReceiptData
  paperSize?: '58mm' | '80mm'
  onClose: () => void
  storeName?: string
  storeAddress?: string
  storePhone?: string
}

export function ReceiptPreview({ data, paperSize = '80mm', onClose, storeName = 'PrimePOS', storeAddress = 'Jl. Example No. 123', storePhone = '021-12345678' }: ReceiptPreviewProps) {
  const receiptRef = useRef<HTMLDivElement>(null)

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v)

  const formatDate = (d: string | Date) =>
    new Date(d).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })

  const handlePrint = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const style = paperSize === '58mm'
      ? 'width: 58mm; font-size: 10px; padding: 4mm 2mm;'
      : 'width: 80mm; font-size: 12px; padding: 6mm 4mm;'

    printWindow.document.write(`
      <html>
        <head>
          <title>Receipt - ${data.invoiceNo}</title>
          <style>
            @page { margin: 0; }
            body { margin: 0; font-family: 'Courier New', monospace; }
            .receipt { ${style} margin: 0 auto; }
            .header { text-align: center; margin-bottom: 8px; }
            .header h1 { margin: 0; font-size: 16px; }
            .header p { margin: 2px 0; }
            .items { width: 100%; border-collapse: collapse; margin: 8px 0; }
            .items th, .items td { padding: 2px 0; text-align: left; }
            .items th { border-bottom: 1px dashed #000; }
            .items td:last-child, .items th:last-child { text-align: right; }
            .totals { width: 100%; margin: 4px 0; }
            .totals td { padding: 2px 0; }
            .totals td:last-child { text-align: right; }
            .grand-total { font-size: 14px; font-weight: bold; }
            .footer { text-align: center; margin-top: 12px; font-size: 10px; }
            .line { border-top: 1px dashed #000; margin: 8px 0; }
          </style>
        </head>
        <body>
          <div class="receipt">
            <div class="header">
              <h1>{storeName}</h1>
              <p>{storeAddress}</p>
              <p>Telp: {storePhone}</p>
              <div class="line"></div>
              <p>${formatDate(data.date)}</p>
              <p>Invoice: ${data.invoiceNo}</p>
              ${data.customerName ? `<p>Customer: ${data.customerName}</p>` : ''}
              <div class="line"></div>
            </div>
            <table class="items">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Qty</th>
                  <th>Price</th>
                  <th>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                ${data.items.map(item => `
                  <tr>
                    <td>${item.productName}</td>
                    <td>${item.quantity}</td>
                    <td>${formatCurrency(item.unitPrice)}</td>
                    <td>${formatCurrency(item.subtotal)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            <div class="line"></div>
            <table class="totals">
              <tr><td>Subtotal</td><td>${formatCurrency(data.subtotal)}</td></tr>
              ${data.discountAmount > 0 ? `<tr><td>Discount</td><td>-${formatCurrency(data.discountAmount)}</td></tr>` : ''}
              ${data.taxAmount > 0 ? `<tr><td>Tax</td><td>${formatCurrency(data.taxAmount)}</td></tr>` : ''}
              <tr class="grand-total"><td>Total</td><td>${formatCurrency(data.total)}</td></tr>
            </table>
            <div class="line"></div>
            <table class="totals">
              <tr><td>Payment</td><td>${data.paymentMethod.toUpperCase()}</td></tr>
              <tr><td>Status</td><td>${data.paymentStatus.toUpperCase()}</td></tr>
            </table>
            <div class="footer">
              <p>Thank you for your purchase!</p>
              <p>Items sold are non-returnable</p>
            </div>
          </div>
          <script>
            window.onload = function() { window.print(); setTimeout(window.close, 500); }
          </script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="flex max-h-[90vh] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-semibold text-foreground">Receipt Preview</h3>
            <Badge variant="secondary" className="font-mono text-[10px]">
              {paperSize === '58mm' ? '58mm' : '80mm'}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handlePrint} className="gap-2">
              <Printer className="h-3.5 w-3.5" />
              Print
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div
          ref={receiptRef}
          className="overflow-auto p-4"
          style={{ maxWidth: paperSize === '58mm' ? '320px' : '400px' }}
        >
          <div className="space-y-3 font-mono text-xs leading-relaxed text-foreground">
            <div className="text-center">
              <p className="text-sm font-bold">{storeName}</p>
              <p className="text-muted-foreground">{storeAddress}</p>
              <p className="text-muted-foreground">Telp: {storePhone}</p>
            </div>

            <Separator className="border-dashed" />

            <div className="flex justify-between text-muted-foreground">
              <span>{formatDate(data.date)}</span>
            </div>
            <div className="flex justify-between">
              <span>Invoice:</span>
              <span className="font-semibold">{data.invoiceNo}</span>
            </div>
            {data.customerName && (
              <div className="flex justify-between">
                <span>Customer:</span>
                <span>{data.customerName}</span>
              </div>
            )}

            <Separator className="border-dashed" />

            <div className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-1 font-semibold text-muted-foreground">
              <span>Item</span>
              <span className="text-right">Qty</span>
              <span className="text-right">Price</span>
              <span className="text-right">Sub</span>
            </div>
            <Separator className="border-dashed" />

            <div className="space-y-1">
              {data.items.map((item) => (
                <div key={item.id} className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-1">
                  <span className="truncate">{item.productName}</span>
                  <span className="text-right">{item.quantity}</span>
                  <span className="text-right">{formatCurrency(item.unitPrice)}</span>
                  <span className="text-right">{formatCurrency(item.subtotal)}</span>
                </div>
              ))}
            </div>

            <Separator className="border-dashed" />

            <div className="space-y-1">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatCurrency(data.subtotal)}</span>
              </div>
              {data.discountAmount > 0 && (
                <div className="flex justify-between text-destructive">
                  <span>Discount</span>
                  <span>-{formatCurrency(data.discountAmount)}</span>
                </div>
              )}
              {data.taxAmount > 0 && (
                <div className="flex justify-between">
                  <span>Tax</span>
                  <span>{formatCurrency(data.taxAmount)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between text-sm font-bold">
                <span>Total</span>
                <span>{formatCurrency(data.total)}</span>
              </div>
            </div>

            <Separator className="border-dashed" />

            <div className="flex justify-between">
              <span>Payment:</span>
              <span className="uppercase">{data.paymentMethod}</span>
            </div>
            <div className="flex justify-between">
              <span>Status:</span>
              <span className="uppercase">{data.paymentStatus}</span>
            </div>

            <div className="pt-2 text-center text-muted-foreground">
              <p>Thank you for your purchase!</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
