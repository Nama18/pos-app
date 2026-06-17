import { create } from 'zustand'
import type { CartItem, Customer, DiscountType, PaymentMethod, Product } from '@/types'

interface CartState {
  items: CartItem[]
  customer: Customer | null
  discountType: DiscountType | null
  discountValue: number
  taxRate: number
  notes: string
  paymentMethod: PaymentMethod

  addItem: (product: Product, quantity: number) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  setCustomer: (customer: Customer | null) => void
  setDiscount: (type: DiscountType | null, value: number) => void
  setTaxRate: (rate: number) => void
  setPaymentMethod: (method: PaymentMethod) => void
  setNotes: (notes: string) => void

  subtotal: () => number
  discountAmount: () => number
  taxAmount: () => number
  total: () => number
  itemCount: () => number
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  customer: null,
  discountType: null,
  discountValue: 0,
  taxRate: 0,
  notes: '',
  paymentMethod: 'cash',

  addItem: (product: Product, quantity: number) => {
    set((state) => {
      const existing = state.items.find((item) => item.productId === product.id)

      if (existing) {
        return {
          items: state.items.map((item) =>
            item.productId === product.id
              ? {
                  ...item,
                  quantity: item.quantity + quantity,
                  subtotal: (item.quantity + quantity) * item.price,
                }
              : item
          ),
        }
      }

      return {
        items: [
          ...state.items,
          {
            productId: product.id,
            name: product.name,
            sku: product.sku,
            price: product.sellingPrice,
            quantity,
            subtotal: product.sellingPrice * quantity,
            image: product.image,
            stock: product.stock,
          },
        ],
      }
    })
  },

  removeItem: (productId: string) => {
    set((state) => ({
      items: state.items.filter((item) => item.productId !== productId),
    }))
  },

  updateQuantity: (productId: string, quantity: number) => {
    if (quantity <= 0) {
      get().removeItem(productId)
      return
    }

    set((state) => ({
      items: state.items.map((item) =>
        item.productId === productId
          ? { ...item, quantity, subtotal: item.price * quantity }
          : item
      ),
    }))
  },

  clearCart: () => {
    set({
      items: [],
      customer: null,
      discountType: null,
      discountValue: 0,
      taxRate: 0,
      notes: '',
      paymentMethod: 'cash',
    })
  },

  setCustomer: (customer: Customer | null) => {
    set({ customer })
  },

  setDiscount: (type: DiscountType | null, value: number) => {
    set({ discountType: type, discountValue: value })
  },

  setTaxRate: (rate: number) => {
    set({ taxRate: rate })
  },

  setPaymentMethod: (method: PaymentMethod) => {
    set({ paymentMethod: method })
  },

  setNotes: (notes: string) => {
    set({ notes })
  },

  subtotal: () => {
    return get().items.reduce((sum, item) => sum + item.subtotal, 0)
  },

  discountAmount: () => {
    const { discountType, discountValue, subtotal } = get()
    if (!discountType || discountValue <= 0) return 0

    if (discountType === 'percentage') {
      return subtotal() * (discountValue / 100)
    }

    return Math.min(discountValue, subtotal())
  },

  taxAmount: () => {
    const { taxRate } = get()
    const afterDiscount = get().subtotal() - get().discountAmount()
    return afterDiscount * (taxRate / 100)
  },

  total: () => {
    return get().subtotal() - get().discountAmount() + get().taxAmount()
  },

  itemCount: () => {
    return get().items.reduce((sum, item) => sum + item.quantity, 0)
  },
}))
