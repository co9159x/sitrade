import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

type ToastTone = 'info' | 'success' | 'error'

type ToastItem = {
  id: string
  tone: ToastTone
  title: string
  description?: string
}

type ToastInput = Omit<ToastItem, 'id'>

type ToastContextValue = {
  push: (toast: ToastInput) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const push = useCallback(
    (toast: ToastInput) => {
      const id = crypto.randomUUID()
      setToasts((current) => [...current, { ...toast, id }])
      window.setTimeout(() => dismiss(id), 5200)
    },
    [dismiss],
  )

  const value = useMemo(() => ({ push }), [push])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed right-3 bottom-24 z-50 flex w-[min(22rem,calc(100vw-1.5rem))] flex-col gap-2 lg:right-4 lg:bottom-4"
        aria-live="polite"
      >
        {toasts.map((toast) => (
          <article
            key={toast.id}
            role="status"
            className={`pointer-events-auto rounded-lg border bg-panel px-3 py-3 shadow-none ${
              toast.tone === 'error'
                ? 'border-down'
                : toast.tone === 'success'
                  ? 'border-up'
                  : 'border-accent'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium">{toast.title}</p>
                {toast.description ? (
                  <p className="mt-1 text-xs text-muted">{toast.description}</p>
                ) : null}
              </div>
              <button
                type="button"
                className="text-xs text-muted hover:text-text"
                aria-label={`Dismiss ${toast.title}`}
                onClick={() => dismiss(toast.id)}
              >
                Close
              </button>
            </div>
          </article>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used within ToastProvider.')
  return context
}
