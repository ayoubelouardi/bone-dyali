import { useParams, Link, useNavigate } from 'react-router-dom'
import { getBook, getPurchaseOrder } from '../lib/storage'
import { usePurchaseOrders } from '../hooks/usePurchaseOrders'
import FactureView from '../components/FactureView'
import { useState, useEffect } from 'react'

export default function Facture() {
  const { bookId, poId } = useParams()
  const navigate = useNavigate()
  const book = getBook(bookId)
  const { toggleLock, getOrder } = usePurchaseOrders(bookId)
  const [po, setPO] = useState(getPurchaseOrder(bookId, poId))
  const [message, setMessage] = useState('')

  // Refresh PO data when it changes
  useEffect(() => {
    setPO(getPurchaseOrder(bookId, poId))
  }, [bookId, poId])

  if (!book || !po) {
    return <p>Invoice not found.</p>
  }

  const handleToggleLock = () => {
    const confirmMessage = po.locked 
      ? 'Unlock this purchase order? It will become editable.' 
      : 'Lock this purchase order? It cannot be edited while locked.'

    const updated = toggleLock(poId)
    if (updated) {
      setPO(updated)
      setMessage(`PO #${po.poNumber} ${updated.locked ? 'locked' : 'unlocked'} successfully.`)
    } else {
      setMessage(confirmMessage)
    }
  }

  const handleEdit = () => {
    if (po.locked) {
      setMessage('This purchase order is locked. Please unlock it first to edit.')
      return
    }
    navigate(`/book/${bookId}/po/${poId}/edit`)
  }

  return (
    <>
      {message && (
        <div className="no-print" style={{ marginBottom: '0.75rem', padding: '0.75rem 1rem', border: '1px solid #e2e8f0', background: '#fff', color: '#334155', borderRadius: 6 }}>
          {message}
        </div>
      )}
      <div className="no-print" style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <Link to={`/book/${bookId}`} style={{ color: '#64748b' }}>← Back to archive</Link>
        {po.locked && (
          <span style={{ 
            padding: '0.25rem 0.5rem', 
            background: '#fef3c7', 
            color: '#92400e', 
            borderRadius: 4, 
            fontSize: '0.875rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem'
          }}>
            🔒 Locked
          </span>
        )}
        <div style={{ flex: 1 }}></div>
        <button
          type="button"
          onClick={handleEdit}
          style={{
            padding: '0.5rem 1rem',
            background: po.locked ? '#e5e7eb' : book.color,
            color: po.locked ? '#9ca3af' : '#fff',
            border: 0,
            borderRadius: 6,
            minHeight: 44,
            cursor: po.locked ? 'not-allowed' : 'pointer',
            fontWeight: 600,
          }}
          disabled={po.locked}
          title={po.locked ? 'Unlock to edit' : 'Edit this purchase order'}
        >
          Edit
        </button>
        <button
          type="button"
          onClick={handleToggleLock}
          style={{
            padding: '0.5rem 1rem',
            background: po.locked ? '#dcfce7' : '#fef2f2',
            color: po.locked ? '#166534' : '#991b1b',
            border: 0,
            borderRadius: 6,
            minHeight: 44,
            fontWeight: 600,
          }}
        >
          {po.locked ? '🔓 Unlock' : '🔒 Lock'}
        </button>
      </div>
      <FactureView book={book} po={po} />
    </>
  )
}
