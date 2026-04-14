'use client'

import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import { CheckCircle2, CircleAlert, X } from 'lucide-react'
import { cn } from '@/lib/utils'

type ToastVariant = 'success' | 'error'

interface ToastItem {
  id: number
  title: string
  variant: ToastVariant
}

interface ToastContextValue {
  showToast: (title: string, variant: ToastVariant) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const nextId = useRef(0)

  const removeToast = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const showToast = useCallback(
    (title: string, variant: ToastVariant) => {
      const id = nextId.current++

      setToasts((current) => [...current, { id, title, variant }])

      window.setTimeout(() => {
        removeToast(id)
      }, 3500)
    },
    [removeToast]
  )

  const value = useMemo(
    () => ({
      showToast,
    }),
    [showToast]
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-[100] flex w-full max-w-sm flex-col gap-3">
        {toasts.map((toast) => {
          const isSuccess = toast.variant === 'success'

          return (
            <div
              key={toast.id}
              className={cn(
                'pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3 shadow-lg backdrop-blur-sm',
                isSuccess
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-950'
                  : 'border-red-200 bg-red-50 text-red-950'
              )}
            >
              {isSuccess ? (
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
              ) : (
                <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
              )}
              <p className="flex-1 text-sm font-medium">{toast.title}</p>
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="rounded-md p-1 text-current/60 transition hover:bg-black/5 hover:text-current"
                aria-label="Dismiss notification"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)

  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }

  return context
}
