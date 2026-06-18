export type Role = 'Admin' | 'Cashier' | 'Warehouse'
export type PaymentMethod = 'cash' | 'card' | 'qris' | 'ewallet' | 'transfer'
export type PaymentStatus = 'paid' | 'pending' | 'cancelled'
export type DiscountType = 'percentage' | 'fixed'
export type InventoryType = 'in' | 'out' | 'adjustment'

export interface User {
  id: string
  email: string
  name: string
  role: Role
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Category {
  id: string
  name: string
  slug: string
  description?: string
  isActive: boolean
  productCount?: number
  createdAt: string
  updatedAt: string
}

export interface Product {
  id: string
  sku: string
  barcode?: string
  name: string
  slug: string
  description?: string
  purchasePrice: number
  sellingPrice: number
  stock: number
  minStock: number
  image?: string
  isActive: boolean
  category: { id: string; name: string }
  categoryId: string
  createdAt: string
  updatedAt: string
}

export interface Customer {
  id: string
  name: string
  email?: string
  phone?: string
  address?: string
  loyaltyPoints: number
  createdAt: string
  updatedAt: string
}

export interface CartItem {
  productId: string
  name: string
  sku: string
  price: number
  quantity: number
  subtotal: number
  image?: string
  stock: number
}

export interface Transaction {
  id: string
  invoiceNo: string
  subtotal: number
  discountType?: DiscountType
  discountValue: number
  discountAmount: number
  taxRate: number
  taxAmount: number
  total: number
  paymentMethod: PaymentMethod
  paymentStatus: PaymentStatus
  customer?: { id: string; name: string }
  user: { id: string; name: string }
  items: TransactionItem[]
  notes?: string
  createdAt: string
}

export interface TransactionItem {
  id: string
  productId: string
  productName: string
  productSku: string
  quantity: number
  unitPrice: number
  subtotal: number
}

export interface InventoryLog {
  id: string
  productId: string
  productName: string
  productSku: string
  type: InventoryType
  quantity: number
  reference?: string
  notes?: string
  user: { name: string }
  createdAt: string
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface ReceiptItem {
  id: string
  productId: string
  productName: string
  productSku: string
  quantity: number
  unitPrice: number
  subtotal: number
}

export interface ReceiptData {
  invoiceNo: string
  date: string | Date
  customerName: string | null
  items: ReceiptItem[]
  subtotal: number
  discountAmount: number
  taxAmount: number
  total: number
  paymentMethod: string
  paymentStatus: string
}

export interface Settings {
  storeName: string
  storeAddress: string
  storePhone: string
  [key: string]: string
}

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNextPage?: boolean
  hasPreviousPage?: boolean
}

export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
  meta?: PaginationMeta
}
