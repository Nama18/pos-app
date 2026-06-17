import { describe, it, expect } from 'vitest'
import { cn } from '@/lib/utils'

describe('cn', () => {
  it('merges class names correctly', () => {
    expect(cn('px-4', 'py-2')).toBe('px-4 py-2')
  })

  it('handles conditional classes', () => {
    const condition = true
    expect(cn('base', condition && 'active')).toBe('base active')
    expect(cn('base', !condition && 'hidden')).toBe('base')
  })

  it('merges conflicting tailwind classes correctly', () => {
    expect(cn('px-4', 'px-6')).toBe('px-6')
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500')
    expect(cn('p-4', 'p-2')).toBe('p-2')
  })

  it('handles array arguments', () => {
    expect(cn(['px-4', 'py-2'])).toBe('px-4 py-2')
  })

  it('handles undefined and null values', () => {
    expect(cn('base', undefined, null)).toBe('base')
  })
})
