import { create } from 'zustand'
import type { User } from '@/types'

function setCookie(name: string, value: string, days = 7) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString()
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/`
}

function removeCookie(name: string) {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  setUser: (user: User) => void
  loadFromStorage: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,

  login: async (email: string, password: string) => {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1'}/auth/login`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      }
    )

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Login failed')
    }

    const json = await response.json()
    const { user, accessToken, refreshToken } = json.data

    localStorage.setItem('token', accessToken)
    localStorage.setItem('refreshToken', refreshToken)
    localStorage.setItem('user', JSON.stringify(user))
    setCookie('token', accessToken)

    set({ user, token: accessToken, isAuthenticated: true })
  },

  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
    removeCookie('token')
    set({ user: null, token: null, isAuthenticated: false })
  },

  setUser: (user: User) => {
    localStorage.setItem('user', JSON.stringify(user))
    set({ user })
  },

  loadFromStorage: () => {
    if (typeof window === 'undefined') return

    const token = localStorage.getItem('token')
    const userStr = localStorage.getItem('user')

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr) as User
        set({ user, token, isAuthenticated: true })
      } catch {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      }
    }
  },
}))
