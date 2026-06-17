'use client'

import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Minus, Trash2, ShoppingCart, Percent, Receipt } from 'lucide-react'
import toast from 'react-hot-toast'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { BarcodeInput } from '@/components/pos/barcode-input'
import { CustomerSelector } from '@/components/pos/customer-selector'
import { PaymentModal } from '@/components/pos/payment-modal'
import { ReceiptPreview } from '@/components/pos/receipt-preview'
import { get, post } from '@/lib/api'
import { useCartStore } from '@/stores/cart-store'
import type { ApiResponse, Product, Category, ReceiptData, Settings } from '@/types'

function formatCurrency(value: number) {
  if (isNaN(value) || value === null || value === undefined) return 'Rp0'
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(value)
}

export default function POSPage() {
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [discountInput, setDiscountInput] = useState('')
  const [taxInput, setTaxInput] = useState('')
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null)
  const [activeTab, setActiveTab] = useState('products')
  const queryClient = useQueryClient()

  const {
    items,
    customer,
    discountType,
    discountValue,
    taxRate,
    paymentMethod,
    notes,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    setCustomer,
    setDiscount,
    setTaxRate,
    setPaymentMethod,
    setNotes,
    subtotal,
    discountAmount,
    taxAmount,
    total,
    itemCount,
  } = useCartStore()

  const { data: productsRes, isLoading: productsLoading } = useQuery({
    queryKey: ['pos-products', search, selectedCategory],
    queryFn: () =>
      get<ApiResponse<Product[]>>('/pos/products', {
        params: { search, categoryId: selectedCategory, limit: 50 },
      }),
  })

  const { data: categoriesRes } = useQuery({
    queryKey: ['pos-categories'],
    queryFn: () => get<ApiResponse<Category[]>>('/categories'),
  })

  const { data: settingsRes } = useQuery({
    queryKey: ['pos-settings'],
    queryFn: () => get<ApiResponse<Settings>>('/settings'),
  })
  const storeSettings = settingsRes?.data

  const products = productsRes?.data ?? []
  const categories = categoriesRes?.data ?? []

  const filteredProducts = products.filter((p) => {
    if (selectedCategory && p.categoryId !== selectedCategory) return false
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const handleAddToCart = useCallback(
    (product: Product) => {
      addItem(product, 1)
      toast.success(`${product.name} added`, { position: 'bottom-right', duration: 1500 })
    },
    [addItem]
  )

  const handleBarcodeProduct = useCallback(
    (product: Product) => {
      addItem(product, 1)
      toast.success(`${product.name} added via barcode`, { position: 'bottom-right', duration: 1500 })
    },
    [addItem]
  )

  const handleCheckout = async (amountTendered: number) => {
    setIsProcessing(true)
    try {
      const res = await post<ApiResponse<ReceiptData>>('/pos/transactions', {
        items: items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
        })),
        customerId: customer?.id ?? null,
        discountType: discountValue > 0 ? discountType : null,
        discountValue: discountValue || 0,
        taxRate: taxRate || 0,
        paymentMethod,
        notes: notes || undefined,
      })

      setReceiptData(res.data)
      setPaymentOpen(false)
      clearCart()
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-sales-chart'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-recent-transactions'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-low-stock'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      toast.success('Payment successful!')
    } catch {
      toast.error('Transaction failed. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  const handlePaymentMethodChange = (method: string) => {
    setPaymentMethod(method as 'cash' | 'card' | 'qris' | 'ewallet' | 'transfer')
  }

  return (
    <>
      <div className="flex h-[calc(100vh-8rem)] gap-4">
        <div className="flex flex-1 flex-col gap-4 overflow-hidden">
          <div className="flex items-center gap-3">
            <BarcodeInput onProductFound={handleBarcodeProduct} />
            <div className="relative flex-1">
              <Input
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-10 rounded-xl border-border bg-muted/30 pl-3"
              />
            </div>
          </div>

          <ScrollArea className="flex gap-2 pb-2">
            <div className="flex gap-2">
              <Button
                variant={selectedCategory === null ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(null)}
                className="rounded-xl shrink-0"
              >
                All
              </Button>
              {categories.map((cat) => (
                <Button
                  key={cat.id}
                  variant={selectedCategory === cat.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() =>
                    setSelectedCategory(selectedCategory === cat.id ? null : cat.id)
                  }
                  className="rounded-xl shrink-0"
                >
                  {cat.name}
                </Button>
              ))}
            </div>
          </ScrollArea>

          <ScrollArea className="flex-1">
            {productsLoading ? (
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-36 rounded-2xl" />
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <ShoppingCart className="mb-3 h-12 w-12 text-muted-foreground" />
                <p className="text-muted-foreground">No products found</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
                {filteredProducts.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => handleAddToCart(product)}
                    disabled={product.stock <= 0}
                    className="group flex flex-col items-center justify-center rounded-2xl border border-border bg-card p-4 text-center transition-all duration-200 hover:border-primary/50 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <div className="mb-2 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-lg font-bold text-primary">
                      {product.name.charAt(0)}
                    </div>
                    <p className="line-clamp-1 text-sm font-medium text-foreground">{product.name}</p>
                    <p className="mt-0.5 text-sm font-semibold text-accent">{formatCurrency(product.sellingPrice)}</p>
                    <Badge
                      variant={product.stock <= product.minStock ? 'destructive' : 'secondary'}
                      className="mt-1 text-[10px]"
                    >
                      {product.stock <= 0 ? 'Out of stock' : `Stock: ${product.stock}`}
                    </Badge>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        <div className="flex w-96 flex-col rounded-2xl border border-border bg-card">
          <CardHeader className="border-b border-border px-4 py-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <ShoppingCart className="h-4 w-4" />
              Cart ({itemCount()})
            </CardTitle>
          </CardHeader>

          <div className="border-b border-border px-4 py-2">
            <CustomerSelector value={customer} onChange={setCustomer} />
          </div>

          <ScrollArea className="flex-1 px-4 py-3">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <ShoppingCart className="mb-2 h-10 w-10 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Cart is empty</p>
                <p className="text-xs text-muted-foreground">Click products or scan barcode to add</p>
              </div>
            ) : (
              <div className="space-y-2">
                {items.map((item) => (
                  <div
                    key={item.productId}
                    className="flex items-center gap-3 rounded-xl bg-muted/20 p-2.5"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{formatCurrency(item.price)}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="flex h-7 w-8 items-center justify-center text-sm font-medium">{item.quantity}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        disabled={item.quantity >= item.stock}
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <p className="w-20 text-right text-sm font-medium text-foreground">{formatCurrency(item.subtotal)}</p>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0 text-destructive"
                      onClick={() => removeItem(item.productId)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          <div className="space-y-3 border-t border-border px-4 py-4">
            <div className="space-y-2">
              <Select
                value={paymentMethod}
                onValueChange={(v) => setPaymentMethod(v as 'cash' | 'card' | 'qris' | 'ewallet' | 'transfer')}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="qris">QRIS</SelectItem>
                  <SelectItem value="ewallet">E-Wallet</SelectItem>
                  <SelectItem value="transfer">Transfer</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Percent className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Discount %"
                    value={discountInput}
                    onChange={(e) => {
                      setDiscountInput(e.target.value)
                      const val = parseFloat(e.target.value)
                      if (!isNaN(val) && val > 0) {
                        setDiscount('percentage', val)
                      } else {
                        setDiscount(null, 0)
                      }
                    }}
                    className="h-9 rounded-xl pl-9 text-xs"
                  />
                </div>
                <div className="relative w-24">
                  <Input
                    placeholder="Tax %"
                    value={taxInput}
                    onChange={(e) => {
                      setTaxInput(e.target.value)
                      const val = parseFloat(e.target.value)
                      setTaxRate(isNaN(val) ? 0 : val)
                    }}
                    className="h-9 rounded-xl text-xs"
                  />
                </div>
              </div>

              <Input
                placeholder="Notes (optional)..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="h-9 rounded-xl text-xs"
              />
            </div>

            <Separator />

            <div className="space-y-1 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal())}</span>
              </div>
              {discountAmount() > 0 && (
                <div className="flex justify-between text-destructive">
                  <span>Discount ({discountValue}%)</span>
                  <span>-{formatCurrency(discountAmount())}</span>
                </div>
              )}
              {taxAmount() > 0 && (
                <div className="flex justify-between text-muted-foreground">
                  <span>Tax ({taxRate}%)</span>
                  <span>{formatCurrency(taxAmount())}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between text-base font-bold text-foreground">
                <span>Total</span>
                <span>{formatCurrency(total())}</span>
              </div>
            </div>

            <Button
              className="w-full gap-2"
              size="lg"
              disabled={items.length === 0}
              onClick={() => setPaymentOpen(true)}
            >
              <Receipt className="h-4 w-4" />
              Process Payment
            </Button>
          </div>
        </div>
      </div>

      <PaymentModal
        open={paymentOpen}
        onOpenChange={setPaymentOpen}
        total={total()}
        paymentMethod={paymentMethod}
        onPaymentMethodChange={handlePaymentMethodChange}
        onConfirm={handleCheckout}
        isProcessing={isProcessing}
      />

      {receiptData && (
        <ReceiptPreview
          data={receiptData}
          paperSize="80mm"
          onClose={() => setReceiptData(null)}
          storeName={storeSettings?.storeName}
          storeAddress={storeSettings?.storeAddress}
          storePhone={storeSettings?.storePhone}
        />
      )}
    </>
  )
}
