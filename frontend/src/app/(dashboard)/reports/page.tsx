'use client'

import { useRouter } from 'next/navigation'
import { BarChart3, Package } from 'lucide-react'

import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

const reportCards = [
  {
    title: 'Sales Report',
    description: 'View sales performance, revenue trends, and transaction data',
    icon: BarChart3,
    href: '/reports/sales',
    color: 'text-accent',
    bgColor: 'bg-accent/10',
  },
  {
    title: 'Inventory Report',
    description: 'Stock levels, inventory value, and product distribution',
    icon: Package,
    href: '/reports/inventory',
    color: 'text-primary',
    bgColor: 'bg-primary/10',
  },
]

export default function ReportsPage() {
  const router = useRouter()

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="Analytics and business insights"
      />

      <div className="grid gap-6 sm:grid-cols-2">
        {reportCards.map((card) => (
            <button
              key={card.title}
              type="button"
              onClick={() => router.push(card.href)}
              className="group cursor-pointer text-left"
            >
            <Card className="transition-all duration-200 hover:shadow-md hover:border-primary/30">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{card.title}</CardTitle>
                    <CardDescription>{card.description}</CardDescription>
                  </div>
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-2xl ${card.bgColor} ${card.color}`}
                  >
                    <card.icon className="h-6 w-6" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <span className="inline-flex items-center gap-1 text-sm font-medium text-primary group-hover:gap-2 transition-all">
                  View Report &rarr;
                </span>
              </CardContent>
            </Card>
          </button>
        ))}
      </div>
    </div>
  )
}
