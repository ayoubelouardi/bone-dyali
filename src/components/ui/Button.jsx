import { forwardRef } from 'react'
import { Loader2 } from 'lucide-react'

const variants = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
  secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-400',
  danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
  ghost: 'bg-transparent text-gray-600 hover:bg-gray-100 focus:ring-gray-400',
  success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500',
}

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
}

const Button = forwardRef(function Button(
  {
    children,
    variant = 'primary',
    size = 'md',
    disabled = false,
    loading = false,
    className = '',
    icon: Icon,
    iconPosition = 'left',
    style = {},
    ...props
  },
  ref
) {
  const variantStyles = variants[variant] || variants.primary
  const sizeStyles = sizes[size] || sizes.md

  const baseStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    fontWeight: 500,
    borderRadius: 8,
    transition: 'all 150ms ease-in-out',
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    opacity: disabled || loading ? 0.5 : 1,
    border: 'none',
    ...(size === 'sm' ? { padding: '0.375rem 0.75rem', fontSize: '0.875rem' } : 
        size === 'lg' ? { padding: '0.75rem 1.5rem', fontSize: '1.125rem' } : 
        { padding: '0.5rem 1rem', fontSize: '1rem' }),
    ...(variant === 'primary' ? { backgroundColor: '#2563eb', color: '#ffffff' } :
        variant === 'secondary' ? { backgroundColor: '#f3f4f6', color: '#374151' } :
        variant === 'danger' ? { backgroundColor: '#dc2626', color: '#ffffff' } :
        variant === 'ghost' ? { backgroundColor: 'transparent', color: '#4b5563' } :
        variant === 'success' ? { backgroundColor: '#16a34a', color: '#ffffff' } :
        { backgroundColor: '#2563eb', color: '#ffffff' }),
    ...style,
  }

  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center gap-2
        font-medium rounded-lg
        transition-all duration-150 ease-in-out
        focus:outline-none focus:ring-2 focus:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
        active:scale-[0.98]
        ${variantStyles}
        ${sizeStyles}
        ${className}
      `}
      style={baseStyle}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : Icon && iconPosition === 'left' ? (
        <Icon className="w-4 h-4" />
      ) : null}
      {children}
      {!loading && Icon && iconPosition === 'right' ? (
        <Icon className="w-4 h-4" />
      ) : null}
    </button>
  )
})

export default Button
