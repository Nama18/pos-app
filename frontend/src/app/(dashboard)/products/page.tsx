'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Edit, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

import { PageHeader } from '@/components/shared/page-header'
import { DataTable, type Column } from '@/components/shared/data-table'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { FilterBar, FilterChip } from '@/components/shared/filter-bar'
import { get, del } from '@/lib/api'
import type { ApiResponse, PaginatedResponse, Product, Category } from '@/types'

function formatCurrency(value: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(value)
}

export default function ProductsPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['products', page, search, categoryFilter],
    queryFn: () =>
      get<ApiResponse<PaginatedResponse<Product>>>('/products', {
        params: { page, limit: 10, search, categoryId: categoryFilter },
      }),
  })

  const { data: categoriesRes } = useQuery({
    queryKey: ['product-categories'],
    queryFn: () => get<ApiResponse<Category[]>>('/categories'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => del(`/products/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      toast.success('Product deleted')
      setDeleteId(null)
    },
  })

  const columns: Column<Product>[] = [
    { key: 'sku', header: 'SKU', sortable: true },
    {
      key: 'name',
      header: 'Name',
      sortable: true,
      render: (product) => (
        <span className="font-medium text-foreground">{product.name}</span>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      render: (product) => (
        <Badge variant="secondary">{product.category.name}</Badge>
      ),
    },
    {
      key: 'sellingPrice',
      header: 'Price',
      sortable: true,
      render: (product) => formatCurrency(product.sellingPrice),
    },
    { key: 'stock', header: 'Stock', sortable: true },
    {
      key: 'isActive',
      header: 'Status',
      render: (product) => (
        <Badge variant={product.isActive ? 'default' : 'secondary'}>
          {product.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (product) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => router.push(`/products/${product.id}`)}
          >
            <Edit className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive"
            onClick={() => setDeleteId(product.id)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ]

  const products = data?.data ?? []
  const meta = data?.meta
  const categories = categoriesRes?.data ?? []

  return (
    <div className="space-y-6">
      <PageHeader
        title="Products"
        description="Manage your product catalog"
        action={
          <Button onClick={() => router.push('/products/new')}>
            <Plus className="h-4 w-4" />
            Add Product
          </Button>
        }
      />

      <FilterBar>
        <Select
          value={categoryFilter ?? 'all'}
          onValueChange={(v) => {
            setCategoryFilter(v === 'all' ? null : v)
            setPage(1)
          }}
        >
          <SelectTrigger className="h-9 w-40">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FilterBar>

      <DataTable<Product>
        columns={columns}
        data={products}
        meta={meta ? { ...meta } : undefined}
        isLoading={isLoading}
        onPageChange={setPage}
        onSearch={setSearch}
        searchPlaceholder="Search products..."
        keyExtractor={(p) => p.id}
      />

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete Product"
        description="Are you sure you want to delete this product? This action cannot be undone."
        confirmText="Delete"
        variant="destructive"
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
      />
    </div>
  )
}
