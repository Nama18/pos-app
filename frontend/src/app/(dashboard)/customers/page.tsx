'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Plus, Edit, Trash2 } from 'lucide-react'

import { PageHeader } from '@/components/shared/page-header'
import { DataTable, type Column } from '@/components/shared/data-table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { get } from '@/lib/api'
import type { ApiResponse, Customer } from '@/types'

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export default function CustomersPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['customers', page, search],
    queryFn: () =>
      get<ApiResponse<Customer[]>>('/customers', {
        params: { page, limit: 10, search },
      }),
  })

  const columns: Column<Customer>[] = [
    {
      key: 'name',
      header: 'Name',
      sortable: true,
      render: (customer) => (
        <span className="font-medium text-foreground">{customer.name}</span>
      ),
    },
    { key: 'email', header: 'Email', sortable: true },
    { key: 'phone', header: 'Phone' },
    {
      key: 'loyaltyPoints',
      header: 'Loyalty Points',
      sortable: true,
      render: (customer) => (
        <Badge variant="secondary">{customer.loyaltyPoints} pts</Badge>
      ),
    },
    {
      key: 'createdAt',
      header: 'Created',
      sortable: true,
      render: (customer) => (
        <span className="text-muted-foreground">{formatDate(customer.createdAt)}</span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: () => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Edit className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ]

  const customers = data?.data ?? []
  const meta = data?.meta

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customers"
        description="Manage your customer database"
        action={
          <Button>
            <Plus className="h-4 w-4" />
            Add Customer
          </Button>
        }
      />

      <DataTable<Customer>
        columns={columns}
        data={customers}
        meta={meta ? { ...meta } : undefined}
        isLoading={isLoading}
        onPageChange={setPage}
        onSearch={setSearch}
        searchPlaceholder="Search by name, email or phone..."
        keyExtractor={(c) => c.id}
      />
    </div>
  )
}
