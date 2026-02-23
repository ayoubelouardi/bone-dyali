import { useState, useMemo, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getBook } from '../lib/storage'
import { usePurchaseOrders } from '../hooks/usePurchaseOrders'

const emptyLine = () => ({ description: '', quantity: 0, unitPrice: 0, code: '' })

export default function PurchaseOrder() {
  const { bookId, poId } = useParams()
  const navigate = useNavigate()
  const book = getBook(bookId)
  const { addOrder, getOrder, updateOrder } = usePurchaseOrders(bookId)
  const [client, setClient] = useState({ name: '', address: '', extra: '' })
  const [lineItems, setLineItems] = useState([emptyLine()])
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [isInitialized, setIsInitialized] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const isNew = !poId || poId === 'new'
  const existingPO = isNew ? null : getOrder(poId)

  // Load existing PO data when editing
  useEffect(() => {
    if (isNew) {
      setIsInitialized(true)
      return
    }

    if (!existingPO || isInitialized) return

    if (existingPO.locked) {
      setErrorMessage('This purchase order is locked and cannot be edited. Please unlock it first.')
      navigate(`/book/${bookId}/po/${poId}`)
      return
    }

    setClient(existingPO.client || { name: '', address: '', extra: '' })
    setLineItems(existingPO.lineItems && existingPO.lineItems.length > 0 ? existingPO.lineItems : [emptyLine()])
    setDate(existingPO.date || new Date().toISOString().slice(0, 10))
    setIsInitialized(true)
  }, [existingPO, bookId, poId, navigate, isInitialized, isNew])

  const orderTotal = useMemo(
    () =>
      lineItems.reduce(
        (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0),
        0
      ),
    [lineItems]
  )

  const updateLine = (index, field, value) => {
    setLineItems((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], [field]: value }
      return next
    })
  }

  const addLine = () => setLineItems((prev) => [...prev, emptyLine()])
  const removeLine = (index) => {
    if (lineItems.length <= 1) return
    setLineItems((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!book) return
    
    if (isNew) {
      addOrder({ client, lineItems, date })
    } else {
      const success = updateOrder(poId, { client, lineItems, date })
      if (!success) {
        setErrorMessage('Unable to update this purchase order. It might be locked.')
        return
      }
    }
    
    navigate(`/book/${bookId}`)
  }

  if (!book) {
    return (
      <div>
        <p>Book not found.</p>
        <button type="button" onClick={() => navigate('/')}>Back</button>
      </div>
    )
  }

  return (
    <div className="no-print">
      {errorMessage && (
        <div style={{ marginBottom: '1rem', padding: '0.75rem 1rem', border: '1px solid #fecaca', background: '#fef2f2', color: '#991b1b', borderRadius: 6 }}>
          {errorMessage}
        </div>
      )}
      <div style={{ marginBottom: '1rem' }}>
        <button type="button" onClick={() => navigate(isNew ? `/book/${bookId}` : `/book/${bookId}/po/${poId}`)} style={{ background: 'none', border: 0, color: '#64748b' }}>← Back</button>
      </div>
      <h1 style={{ marginTop: 0 }}>
        {isNew ? `New Purchase Order — ${book.name}` : `Edit Purchase Order #${existingPO?.poNumber} — ${book.name}`}
      </h1>
      <form onSubmit={handleSubmit}>
        <section style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ marginTop: 0 }}>Client</h3>
          <label style={labelStyle}>Name <input type="text" value={client.name} onChange={(e) => setClient((c) => ({ ...c, name: e.target.value }))} style={inputStyle} /></label>
          <label style={labelStyle}>Address <input type="text" value={client.address} onChange={(e) => setClient((c) => ({ ...c, address: e.target.value }))} style={inputStyle} /></label>
          <label style={labelStyle}>Date <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={inputStyle} /></label>
        </section>
        <section style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h3 style={{ margin: 0 }}>Line items</h3>
            <button type="button" onClick={addLine} style={secondaryBtn}>+ Add line</button>
          </div>
          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', marginTop: '0.5rem' }}>
            <table style={{ width: '100%', minWidth: 600, borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={thStyle}>Qty</th>
                  <th style={thStyle}>Description</th>
                  <th style={thStyle}>Code</th>
                  <th style={thStyle}>Unit price</th>
                  <th style={thStyle}>Amount</th>
                  <th style={thStyle}></th>
                </tr>
              </thead>
              <tbody>
                {lineItems.map((item, i) => (
                  <tr key={i}>
                    <td><input type="number" min={0} value={item.quantity} onChange={(e) => updateLine(i, 'quantity', e.target.value)} style={cellInput} /></td>
                    <td><input type="text" value={item.description} onChange={(e) => updateLine(i, 'description', e.target.value)} style={cellInput} /></td>
                    <td><input type="text" value={item.code} onChange={(e) => updateLine(i, 'code', e.target.value)} style={cellInput} /></td>
                    <td><input type="number" min={0} step="0.01" value={item.unitPrice} onChange={(e) => updateLine(i, 'unitPrice', e.target.value)} style={cellInput} /></td>
                    <td>{((Number(item.quantity) || 0) * (Number(item.unitPrice) || 0)).toFixed(2)}</td>
                    <td><button type="button" onClick={() => removeLine(i)} style={removeBtn}>Remove</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ fontWeight: 600, marginTop: '0.5rem' }}>Order total: {orderTotal.toFixed(2)} MAD</p>
        </section>
        <button type="submit" style={{ ...primaryBtn, background: book.color }}>
          {isNew ? 'Save' : 'Update'}
        </button>
      </form>
    </div>
  )
}

const labelStyle = { display: 'block', marginBottom: '0.5rem' }
const inputStyle = { display: 'block', padding: '0.5rem', width: '100%', maxWidth: 400, minHeight: 44 }
const thStyle = { textAlign: 'left', padding: '0.5rem', borderBottom: '1px solid #e2e8f0' }
const cellInput = { width: '100%', padding: '0.5rem', minHeight: 44 }
const primaryBtn = { padding: '0.5rem 1rem', background: '#2563eb', color: '#fff', border: 0, borderRadius: 6, minHeight: 44 }
const secondaryBtn = { padding: '0.5rem 0.75rem', background: '#e2e8f0', border: 0, borderRadius: 6, minHeight: 44 }
const removeBtn = { background: 'none', border: 0, color: '#b91c1c', padding: '0.5rem', minWidth: 44, minHeight: 44 }
