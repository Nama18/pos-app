'use client'

import { useState, useRef, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Barcode, Loader2 } from 'lucide-react'
import { get } from '@/lib/api'
import type { ApiResponse, Product } from '@/types'

interface BarcodeInputProps {
  onProductFound: (product: Product) => void
  disabled?: boolean
}

export function BarcodeInput({ onProductFound, disabled }: BarcodeInputProps) {
  const [value, setValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleLookup = async (barcode: string) => {
    if (!barcode.trim()) return
    setLoading(true)
    setError('')
    try {
      const res = await get<ApiResponse<Product>>(`/products/barcode/${barcode}`)
      onProductFound(res.data)
      setValue('')
    } catch {
      setError('Product not found')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleLookup(value)
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <form onSubmit={handleSubmit} className="relative">
      <Barcode className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        ref={inputRef}
        placeholder="Scan barcode... (Ctrl+K)"
        value={value}
        onChange={(e) => {
          setValue(e.target.value)
          setError('')
        }}
        disabled={disabled}
        className="h-10 rounded-xl border-border bg-muted/30 pl-9 pr-10 font-mono"
      />
      <Button
        type="submit"
        variant="ghost"
        size="icon"
        className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2"
        disabled={loading || !value.trim()}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Barcode className="h-4 w-4" />}
      </Button>
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </form>
  )
}
