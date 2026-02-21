import { Link } from 'react-router-dom'

export default function BookCard({ book }) {
  return (
    <Link
      to={`/book/${book.id}`}
      style={{
        display: 'block',
        padding: '1rem 1.25rem',
        background: '#fff',
        borderRadius: 8,
        borderLeft: `4px solid ${book.color || '#6366f1'}`,
        color: 'inherit',
        textDecoration: 'none',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
      }}
    >
      <strong>{book.name}</strong>
      {book.ownerName && (
        <span style={{ color: '#64748b', marginLeft: '0.5rem' }}>— {book.ownerName}</span>
      )}
    </Link>
  )
}
