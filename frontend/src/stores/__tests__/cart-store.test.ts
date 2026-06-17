import { describe, it, expect, beforeEach } from 'vitest'
import { useCartStore } from '@/stores/cart-store'
import type { Product } from '@/types'

const mockProduct: Product = {
  id: '1',
  sku: 'SKU-001',
  name: 'Test Product',
  slug: 'test-product',
  sellingPrice: 10000,
  purchasePrice: 5000,
  stock: 50,
  minStock: 5,
  isActive: true,
  categoryId: 'cat-1',
  category: { id: 'cat-1', name: 'Test Category' },
  createdAt: '2025-01-01',
  updatedAt: '2025-01-01',
}

const mockProduct2: Product = {
  id: '2',
  sku: 'SKU-002',
  name: 'Test Product 2',
  slug: 'test-product-2',
  sellingPrice: 25000,
  purchasePrice: 15000,
  stock: 30,
  minStock: 3,
  isActive: true,
  categoryId: 'cat-1',
  category: { id: 'cat-1', name: 'Test Category' },
  createdAt: '2025-01-01',
  updatedAt: '2025-01-01',
}

beforeEach(() => {
  useCartStore.setState({
    items: [],
    customer: null,
    discountType: null,
    discountValue: 0,
    taxRate: 0,
    notes: '',
    paymentMethod: 'cash',
  })
})

describe('Cart Store', () => {
  describe('addItem', () => {
    it('adds a new product to the cart', () => {
      const store = useCartStore.getState()
      store.addItem(mockProduct, 2)
      const items = useCartStore.getState().items
      expect(items).toHaveLength(1)
      expect(items[0]).toMatchObject({
        productId: '1',
        name: 'Test Product',
        price: 10000,
        quantity: 2,
        subtotal: 20000,
      })
    })

    it('increments quantity for an existing product', () => {
      const store = useCartStore.getState()
      store.addItem(mockProduct, 2)
      store.addItem(mockProduct, 3)
      const items = useCartStore.getState().items
      expect(items).toHaveLength(1)
      expect(items[0].quantity).toBe(5)
      expect(items[0].subtotal).toBe(50000)
    })
  })

  describe('removeItem', () => {
    it('removes a product from the cart', () => {
      const store = useCartStore.getState()
      store.addItem(mockProduct, 1)
      store.addItem(mockProduct2, 1)
      expect(useCartStore.getState().items).toHaveLength(2)
      useCartStore.getState().removeItem('1')
      const items = useCartStore.getState().items
      expect(items).toHaveLength(1)
      expect(items[0].productId).toBe('2')
    })
  })

  describe('clearCart', () => {
    it('empties the cart and resets all values', () => {
      const store = useCartStore.getState()
      store.addItem(mockProduct, 1)
      store.setDiscount('percentage', 10)
      store.setTaxRate(11)
      store.clearCart()
      const state = useCartStore.getState()
      expect(state.items).toHaveLength(0)
      expect(state.discountType).toBeNull()
      expect(state.discountValue).toBe(0)
      expect(state.taxRate).toBe(0)
      expect(state.customer).toBeNull()
      expect(state.notes).toBe('')
      expect(state.paymentMethod).toBe('cash')
    })
  })

  describe('subtotal', () => {
    it('calculates the subtotal correctly', () => {
      const store = useCartStore.getState()
      store.addItem(mockProduct, 2)
      store.addItem(mockProduct2, 1)
      const subtotal = useCartStore.getState().subtotal()
      expect(subtotal).toBe(45000)
    })

    it('returns 0 when cart is empty', () => {
      expect(useCartStore.getState().subtotal()).toBe(0)
    })
  })

  describe('discountAmount', () => {
    it('calculates percentage discount correctly', () => {
      const store = useCartStore.getState()
      store.addItem(mockProduct, 2)
      store.setDiscount('percentage', 10)
      const discount = useCartStore.getState().discountAmount()
      expect(discount).toBe(2000)
    })

    it('returns 0 when no discount is set', () => {
      const store = useCartStore.getState()
      store.addItem(mockProduct, 2)
      expect(useCartStore.getState().discountAmount()).toBe(0)
    })
  })

  describe('total', () => {
    it('calculates total with tax correctly', () => {
      const store = useCartStore.getState()
      store.addItem(mockProduct, 2)
      store.setTaxRate(11)
      const total = useCartStore.getState().total()
      expect(total).toBe(22200)
    })

    it('calculates total with discount and tax', () => {
      const store = useCartStore.getState()
      store.addItem(mockProduct, 2)
      store.setDiscount('percentage', 10)
      store.setTaxRate(11)
      const total = useCartStore.getState().total()
      expect(total).toBe(19980)
    })
  })
})
