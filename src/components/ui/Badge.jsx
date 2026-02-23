const variants = {
  default: 'bg-gray-100 text-gray-700',
  primary: 'bg-blue-100 text-blue-700',
  success: 'bg-green-100 text-green-700',
  warning: 'bg-amber-100 text-amber-700',
  danger: 'bg-red-100 text-red-700',
  info: 'bg-sky-100 text-sky-700',
  locked: 'bg-amber-100 text-amber-700',
}

const sizes = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
  lg: 'px-3 py-1.5 text-sm',
}

const sizeInline = {
  sm: { padding: '0.125rem 0.5rem', fontSize: '0.75rem' },
  md: { padding: '0.25rem 0.625rem', fontSize: '0.875rem' },
  lg: { padding: '0.375rem 0.75rem', fontSize: '0.875rem' },
}

const variantColors = {
  default: { backgroundColor: '#f3f4f6', color: '#374151' },
  primary: { backgroundColor: '#dbeafe', color: '#1d4ed8' },
  success: { backgroundColor: '#dcfce7', color: '#16a34a' },
  warning: { backgroundColor: '#fef3c7', color: '#b45309' },
  danger: { backgroundColor: '#fee2e2', color: '#dc2626' },
  info: { backgroundColor: '#e0f2fe', color: '#0369a1' },
  locked: { backgroundColor: '#fef3c7', color: '#b45309' },
}

export default function Badge({
  children,
  variant = 'default',
  size = 'md',
  className = '',
  icon: Icon,
}) {
  const variantStyles = variants[variant] || variants.default
  const sizeStyles = sizes[size] || sizes.md

  return (
    <span
      className={`
        inline-flex items-center gap-1
        font-medium rounded-full
        ${variantStyles}
        ${sizeStyles}
        ${className}
      `}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.25rem',
        fontWeight: 500,
        borderRadius: 9999,
        ...variantColors[variant],
        ...sizeInline[size],
      }}
    >
      {Icon && <Icon className="w-3.5 h-3.5" />}
      {children}
    </span>
  )
}
