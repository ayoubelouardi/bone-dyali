import { forwardRef } from 'react'

const Input = forwardRef(function Input(
  {
    label,
    error,
    helpText,
    className = '',
    containerClassName = '',
    type = 'text',
    style = {},
    ...props
  },
  ref
) {
  const inputStyles = `
    w-full px-4 py-2.5
    bg-white border rounded-lg
    text-gray-900 placeholder-gray-400
    transition-all duration-150
    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
    disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
    ${error ? 'border-red-500 focus:ring-red-500' : 'border-gray-200'}
    ${className}
  `

  const inlineStyle = {
    width: '100%',
    padding: '0.625rem 1rem',
    backgroundColor: '#ffffff',
    border: error ? '1px solid #ef4444' : '1px solid #e5e7eb',
    borderRadius: 8,
    fontSize: '1rem',
    color: '#111827',
    ...style,
  }

  return (
    <div className={`space-y-1.5 ${containerClassName}`} style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
      {label && (
        <label className="block text-sm font-medium text-gray-700" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151' }}>
          {label}
        </label>
      )}
      <input
        ref={ref}
        type={type}
        className={inputStyles}
        style={inlineStyle}
        {...props}
      />
      {error && (
        <p className="text-sm text-red-600" style={{ fontSize: '0.875rem', color: '#dc2626' }}>{error}</p>
      )}
      {helpText && !error && (
        <p className="text-sm text-gray-500" style={{ fontSize: '0.875rem', color: '#6b7280' }}>{helpText}</p>
      )}
    </div>
  )
})

export default Input
