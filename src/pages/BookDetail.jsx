import { Link, useParams, useNavigate } from 'react-router-dom'
import { useBooks } from '../hooks/useBooks'
import { usePurchaseOrders } from '../hooks/usePurchaseOrders'
import { getBook } from '../lib/storage'

export default function BookDetail() {
  const { bookId } = useParams()
  const navigate = useNavigate()
  const { books, removeBook } = useBooks()
  const { orders } = usePurchaseOrders(bookId)
  const book = bookId === 'new' ? null : getBook(bookId)

  if (bookId === 'new') {
    navigate('/book/new', { replace: true })
    return null
  }

  if (!book) {
    return (
      <div>
        <p>Book not found.</p>
        <Link to="/">Back to dashboard</Link>
      </div>
    )
  }

  const handleDelete = () => {
    if (confirm('Delete this book and all its purchase orders?')) {
      removeBook(book.id)
      navigate('/')
    }
  }

  return (
    <div>
      <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <Link to="/" style={{ color: '#64748b' }}>← Back</Link>
        <div
          style={{
            flex: 1,
            padding: '1rem',
            background: '#fff',
            borderRadius: 8,
            borderLeft: `4px solid ${book.color}`,
          }}
        >
          <strong>{book.name}</strong>
          {book.ownerName && <span style={{ color: '#64748b', marginLeft: '0.5rem' }}>— {book.ownerName}</span>}
        </div>
        <Link
          to={`/book/${bookId}/po/new`}
          style={{
            padding: '0.5rem 1rem',
            background: book.color,
            color: '#fff',
            borderRadius: 6,
            textDecoration: 'none',
            fontWeight: 600,
            minHeight: 44,
            display: 'inline-flex',
            alignItems: 'center',
          }}
        >
          New PO
        </Link>
        <button type="button" onClick={handleDelete} style={{ padding: '0.5rem 1rem', background: '#fef2f2', color: '#b91c1c', border: 0, borderRadius: 6, minHeight: 44 }}>
          Delete book
        </button>
      </div>
      <h2 style={{ marginTop: 0 }}>Purchase orders</h2>
      {orders.length === 0 ? (
        <p style={{ color: '#64748b' }}>No purchase orders yet.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {orders.map((po) => (
            <li key={po.id}>
              <Link
                to={`/book/${bookId}/po/${po.id}`}
                style={{
                  display: 'block',
                  padding: '0.75rem 1rem',
                  background: '#fff',
                  borderRadius: 6,
                  textDecoration: 'none',
                  color: 'inherit',
                  border: '1px solid #e2e8f0',
                  borderLeft: `4px solid ${book.color}`,
                }}
              >
                PO #{po.poNumber} — {po.date} — {po.client?.name || 'No client'}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
