'use client'

import { ThemeProvider } from 'next-themes'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { useState } from 'react'

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: 'oklch(0.205 0.044 252 / 78%)',
              color: 'oklch(0.94 0.034 88)',
              border: '1px solid oklch(0.98 0.02 88 / 14%)',
              backdropFilter: 'blur(12px)',
            },
          }}
        />
      </ThemeProvider>
    </QueryClientProvider>
  )
}
