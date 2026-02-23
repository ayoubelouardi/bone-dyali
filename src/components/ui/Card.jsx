export default function Card({
  children,
  className = '',
  hover = false,
  padding = 'md',
  onClick,
}) {
  const paddingStyles = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  }

  const paddingInline = {
    none: '',
    sm: 'padding: 0.75rem',
    md: 'padding: 1rem',
    lg: 'padding: 1.5rem',
  }

  return (
    <div
      className={`
        bg-white rounded-xl border border-gray-100
        shadow-sm
        ${hover ? 'card-hover cursor-pointer' : ''}
        ${paddingStyles[padding]}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
      style={{
        backgroundColor: '#ffffff',
        borderRadius: 12,
        border: '1px solid #f3f4f6',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        ...(paddingInline[padding] ? { padding: padding === 'sm' ? '0.75rem' : padding === 'md' ? '1rem' : '1.5rem' } : {}),
      }}
      onClick={onClick}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className = '' }) {
  return (
    <div className={`mb-4 ${className}`} style={{ marginBottom: '1rem' }}>
      {children}
    </div>
  )
}

export function CardTitle({ children, className = '' }) {
  return (
    <h3 className={`text-lg font-semibold text-gray-900 ${className}`} style={{ fontSize: '1.125rem', fontWeight: 600, color: '#111827' }}>
      {children}
    </h3>
  )
}

export function CardDescription({ children, className = '' }) {
  return (
    <p className={`text-sm text-gray-500 mt-1 ${className}`} style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>
      {children}
    </p>
  )
}

export function CardContent({ children, className = '' }) {
  return (
    <div className={className}>
      {children}
    </div>
  )
}

export function CardFooter({ children, className = '' }) {
  return (
    <div className={`mt-4 pt-4 border-t border-gray-100 ${className}`} style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #f3f4f6' }}>
      {children}
    </div>
  )
}
