import { useMemo } from 'react'
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

  // Analytics
  const analytics = useMemo(() => {
    if (!orders.length) return { totalRevenue: 0, totalQuantity: 0 }
    
    return orders.reduce((acc, po) => {
      const poTotal = po.lineItems.reduce((sum, item) => {
        const qty = Number(item.quantity) || 0
        const price = Number(item.unitPrice) || 0
        return sum + qty * price
      }, 0)
      
      const poQty = po.lineItems.reduce((sum, item) => {
        return sum + (Number(item.quantity) || 0)
      }, 0)
      
      return {
        totalRevenue: acc.totalRevenue + poTotal,
        totalQuantity: acc.totalQuantity + poQty,
      }
    }, { totalRevenue: 0, totalQuantity: 0 })
  }, [orders])

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

      {orders.length > 0 && (
        <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#f9fafb', borderRadius: 6, display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 600, color: '#374151' }}>
              {analytics.totalRevenue.toFixed(2)} MAD
            </div>
            <div style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '0.25rem' }}>
              Total Revenue
            </div>
          </div>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 600, color: '#374151' }}>
              {analytics.totalQuantity.toLocaleString()}
            </div>
            <div style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '0.25rem' }}>
              Total Quantity Sold
            </div>
          </div>
        </div>
      )}
      <h2 style={{ marginTop: 0 }}>Purchase orders</h2>
      {orders.length === 0 ? (
        <p style={{ color: '#64748b' }}>No purchase orders yet.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {orders.map((po) => (
            <li key={po.id} style={{ display: 'flex', gap: '0.5rem', alignItems: 'stretch' }}>
              <Link
                to={`/book/${bookId}/po/${po.id}`}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1rem',
                  background: po.locked ? '#f9fafb' : '#fff',
                  borderRadius: 6,
                  textDecoration: 'none',
                  color: po.locked ? '#6b7280' : 'inherit',
                  border: '1px solid #e2e8f0',
                  borderLeft: `4px solid ${book.color}`,
                }}
              >
                {po.locked && <span style={{ fontSize: '1rem' }}>🔒</span>}
                <span>PO #{po.poNumber} — {po.date} — {po.client?.name || 'No client'}</span>
              </Link>
              <Link
                to={`/book/${bookId}/po/${po.id}/edit`}
                style={{
                  padding: '0.5rem 0.75rem',
                  background: po.locked ? '#e5e7eb' : '#f3f4f6',
                  color: po.locked ? '#9ca3af' : '#374151',
                  borderRadius: 6,
                  textDecoration: 'none',
                  minHeight: 44,
                  display: 'flex',
                  alignItems: 'center',
                  fontWeight: 500,
                  fontSize: '0.875rem',
                  cursor: po.locked ? 'not-allowed' : 'pointer',
                  pointerEvents: po.locked ? 'none' : 'auto',
                }}
                title={po.locked ? 'Unlock to edit' : 'Edit this purchase order'}
              >
                Edit
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
