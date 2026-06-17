import * as React from "react"
import hotToast, { Toaster as HotToaster } from "react-hot-toast"

import { cn } from "@/lib/utils"

const Toaster = () => {
  return (
    <HotToaster
      position="bottom-right"
      toastOptions={{
        duration: 4000,
        style: {
          borderRadius: "1rem",
          background: "oklch(0.205 0.044 252 / 78%)",
          color: "oklch(0.94 0.034 88)",
          border: "1px solid oklch(0.98 0.02 88 / 14%)",
          backdropFilter: "blur(12px)",
          fontSize: "0.875rem",
          boxShadow: "0 4px 24px oklch(0 0 0 / 20%)",
        },
        success: {
          iconTheme: {
            primary: "oklch(0.77 0.134 178)",
            secondary: "oklch(0.15 0.038 252)",
          },
        },
        error: {
          iconTheme: {
            primary: "oklch(0.68 0.21 31)",
            secondary: "oklch(0.94 0.034 88)",
          },
        },
      }}
    />
  )
}

function useToast() {
  return {
    toast: hotToast,
    success: (message: string) => hotToast.success(message),
    error: (message: string) => hotToast.error(message),
    loading: (message: string) => hotToast.loading(message),
    dismiss: (toastId?: string) => hotToast.dismiss(toastId),
  }
}

export { Toaster, useToast }
