import { useState, useCallback } from 'react'

export interface ToastMessage {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  message: string
  description?: string
  duration?: number
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const showToast = useCallback(
    (
      type: ToastMessage['type'],
      message: string,
      description?: string,
      duration = 5000
    ) => {
      const id = `toast-${Date.now()}-${Math.random()}`
      const toast: ToastMessage = { id, type, message, description, duration }

      setToasts((prev) => [...prev, toast])

      if (duration > 0) {
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== id))
        }, duration)
      }

      return id
    },
    []
  )

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const success = useCallback(
    (message: string, description?: string, duration?: number) =>
      showToast('success', message, description, duration),
    [showToast]
  )

  const error = useCallback(
    (message: string, description?: string, duration?: number) =>
      showToast('error', message, description, duration),
    [showToast]
  )

  const warning = useCallback(
    (message: string, description?: string, duration?: number) =>
      showToast('warning', message, description, duration),
    [showToast]
  )

  const info = useCallback(
    (message: string, description?: string, duration?: number) =>
      showToast('info', message, description, duration),
    [showToast]
  )

  return {
    toasts,
    showToast,
    dismissToast,
    success,
    error,
    warning,
    info,
  }
}
