import { Link } from 'react-router-dom'
import { ChevronRight, Home } from 'lucide-react'

export default function Breadcrumbs({ items }) {
  if (!items || items.length === 0) return null

  return (
    <nav className="flex items-center gap-1 text-sm text-gray-500 mb-4" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.875rem', color: '#6b7280', marginBottom: '1rem' }}>
      <Link
        to="/"
        className="flex items-center gap-1 hover:text-gray-700 transition-colors"
        style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#6b7280', textDecoration: 'none' }}
      >
        <Home className="w-4 h-4" style={{ width: 16, height: 16 }} />
      </Link>
      {items.map((item, index) => {
        const isLast = index === items.length - 1
        
        return (
          <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <ChevronRight className="w-4 h-4" style={{ width: 16, height: 16, color: '#9ca3af' }} />
            {isLast || !item.href ? (
              <span style={{ color: '#111827', fontWeight: 500 }}>{item.label}</span>
            ) : (
              <Link
                to={item.href}
                style={{ color: '#6b7280', textDecoration: 'none' }}
              >
                {item.label}
              </Link>
            )}
          </div>
        )
      })}
    </nav>
  )
}
