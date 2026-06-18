import axios, { AxiosError, type AxiosRequestConfig, type AxiosResponse } from 'axios'
import toast from 'react-hot-toast'

let isRefreshing = false
let refreshPromise: Promise<boolean> | null = null
let failedQueue: Array<{
  resolve: (token: string) => void
  reject: (error: unknown) => void
}> = []

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error)
    } else {
      resolve(token!)
    }
  })
  failedQueue = []
}

function clearAuth() {
  if (typeof window === 'undefined') return
  localStorage.removeItem('token')
  localStorage.removeItem('refreshToken')
  localStorage.removeItem('user')
  document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/'
}

async function attemptRefresh(): Promise<boolean> {
  const refreshToken = localStorage.getItem('refreshToken')
  if (!refreshToken) return false

  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1'
    const response = await fetch(`${baseUrl}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    })

    if (!response.ok) return false

    const json = await response.json()
    const { accessToken, refreshToken: newRefreshToken } = json.data

    localStorage.setItem('token', accessToken)
    localStorage.setItem('refreshToken', newRefreshToken)
    document.cookie = `token=${encodeURIComponent(accessToken)}; path=/`

    return true
  } catch {
    return false
  }
}

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  }
  return config
})

api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError<{ message?: string }>) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean }

    if (error.response?.status !== 401 || originalRequest._retry) {
      const message = error.response?.data?.message || error.message || 'An unexpected error occurred'
      toast.error(message)
      return Promise.reject(error)
    }

    if (isRefreshing) {
      try {
        const token = await refreshPromise!
        originalRequest.headers = originalRequest.headers || {}
        originalRequest.headers.Authorization = `Bearer ${token}`
        return api(originalRequest)
      } catch {
        return Promise.reject(error)
      }
    }

    originalRequest._retry = true
    isRefreshing = true
    refreshPromise = attemptRefresh()

    try {
      const success = await refreshPromise
      if (!success) {
        clearAuth()
        window.location.href = '/login'
        return Promise.reject(error)
      }

      const newToken = localStorage.getItem('token')!
      processQueue(null, newToken)

      originalRequest.headers = originalRequest.headers || {}
      originalRequest.headers.Authorization = `Bearer ${newToken}`
      return api(originalRequest)
    } finally {
      isRefreshing = false
      refreshPromise = null
    }
  }
)

export async function get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const response = await api.get<T>(url, config)
  return response.data
}

export async function post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
  const response = await api.post<T>(url, data, config)
  return response.data
}

export async function patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
  const response = await api.patch<T>(url, data, config)
  return response.data
}

export async function del<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const response = await api.delete<T>(url, config)
  return response.data
}

export default api
