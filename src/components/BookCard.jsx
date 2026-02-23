import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'

export default function BookCard({ book }) {
  return (
    <Link
      to={`/book/${book.id}`}
      className="group block bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200"
      style={{ display: 'block', backgroundColor: '#ffffff', border: '1px solid #f3f4f6' }}
    >
      <div className="p-4 flex items-center gap-4" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {/* Color indicator */}
        <div 
          className="w-3 h-full min-h-[48px] rounded-full"
          style={{ width: 12, backgroundColor: book.color || '#6366f1', borderRadius: 9999, minHeight: 48 }}
        />
        
        {/* Content */}
        <div className="flex-1 min-w-0" style={{ flex: 1, minWidth: 0 }}>
          <h3 className="font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors" style={{ fontWeight: 600, color: '#111827' }}>
            {book.name}
          </h3>
          {book.ownerName && (
            <p className="text-sm text-gray-500 truncate" style={{ fontSize: '0.875rem', color: '#6b7280' }}>{book.ownerName}</p>
          )}
        </div>
        
        {/* Arrow */}
        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all" style={{ width: 20, height: 20, color: '#9ca3af' }} />
      </div>
    </Link>
  )
}
