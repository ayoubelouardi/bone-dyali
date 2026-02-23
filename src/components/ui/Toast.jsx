import { createContext, useContext, useState, useCallback } from 'react'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'

const ToastContext = createContext(null)

const toastTypes = {
  success: {
    icon: CheckCircle,
    className: 'bg-green-50 text-green-800 border-green-200',
    iconClassName: 'text-green-500',
  },
  error: {
    icon: AlertCircle,
    className: 'bg-red-50 text-red-800 border-red-200',
    iconClassName: 'text-red-500',
  },
  warning: {
    icon: AlertTriangle,
    className: 'bg-amber-50 text-amber-800 border-amber-200',
    iconClassName: 'text-amber-500',
  },
  info: {
    icon: Info,
    className: 'bg-blue-50 text-blue-800 border-blue-200',
    iconClassName: 'text-blue-500',
  },
}

function Toast({ toast, onRemove }) {
  const { icon: Icon, className, iconClassName } = toastTypes[toast.type] || toastTypes.info

  return (
    <div
      className={`
        flex items-start gap-3 p-4
        border rounded-lg shadow-lg
        ${className}
        animate-fade-in-up
      `}
    >
      <Icon className={`w-5 h-5 flex-shrink-0 ${iconClassName}`} />
      <div className="flex-1 min-w-0">
        {toast.title && (
          <p className="font-medium">{toast.title}</p>
        )}
        <p className="text-sm opacity-90">{toast.message}</p>
      </div>
      <button
        onClick={() => onRemove(toast.id)}
        className="p-1 hover:bg-black/5 rounded transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((toast) => {
    const id = Date.now()
    setToasts((prev) => [...prev, { id, ...toast }])
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 5000)
  }, [])

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const toast = {
    success: (message, title) => addToast({ type: 'success', message, title }),
    error: (message, title) => addToast({ type: 'error', message, title }),
    warning: (message, title) => addToast({ type: 'warning', message, title }),
    info: (message, title) => addToast({ type: 'info', message, title }),
  }

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed bottom-4 right-4 z-[400] space-y-2 max-w-sm w-full">
        {toasts.map((t) => (
          <Toast key={t.id} toast={t} onRemove={removeToast} />
        ))}
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
