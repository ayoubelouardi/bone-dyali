import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getBook } from '../lib/storage'
import { usePurchaseOrders } from '../hooks/usePurchaseOrders'

const emptyLine = () => ({ description: '', quantity: 0, unitPrice: 0, code: '' })

export default function PurchaseOrder() {
  const { bookId, poId } = useParams()
  const navigate = useNavigate()
  const book = getBook(bookId)
  const { addOrder } = usePurchaseOrders(bookId)
  const [client, setClient] = useState({ name: '', address: '', extra: '' })
  const [lineItems, setLineItems] = useState([emptyLine()])
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))

  const isNew = poId === 'new'
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
    if (!isNew || !book) return
    const po = addOrder({ client, lineItems, date })
    if (po) navigate(`/book/${bookId}/po/${po.id}/print`)
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
      <div style={{ marginBottom: '1rem' }}>
        <button type="button" onClick={() => navigate(`/book/${bookId}`)} style={{ background: 'none', border: 0, color: '#64748b' }}>← Back</button>
      </div>
      <h1 style={{ marginTop: 0 }}>New Purchase Order — {book.name}</h1>
      <form onSubmit={handleSubmit}>
        <section style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ marginTop: 0 }}>Client</h3>
          <label style={labelStyle}>Name <input type="text" value={client.name} onChange={(e) => setClient((c) => ({ ...c, name: e.target.value }))} style={inputStyle} /></label>
          <label style={labelStyle}>Address <input type="text" value={client.address} onChange={(e) => setClient((c) => ({ ...c, address: e.target.value }))} style={inputStyle} /></label>
          <label style={labelStyle}>Date <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={inputStyle} /></label>
        </section>
        <section style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0 }}>Line items</h3>
            <button type="button" onClick={addLine} style={secondaryBtn}>+ Add line</button>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '0.5rem' }}>
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
                  <td><button type="button" onClick={() => removeLine(i)} style={{ background: 'none', border: 0, color: '#b91c1c' }}>Remove</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          <p style={{ fontWeight: 600, marginTop: '0.5rem' }}>Order total: {orderTotal.toFixed(2)}</p>
        </section>
        <button type="submit" style={primaryBtn}>Save & open print view</button>
      </form>
    </div>
  )
}

const labelStyle = { display: 'block', marginBottom: '0.5rem' }
const inputStyle = { display: 'block', padding: '0.5rem', width: '100%', maxWidth: 400 }
const thStyle = { textAlign: 'left', padding: '0.5rem', borderBottom: '1px solid #e2e8f0' }
const cellInput = { width: '100%', padding: '0.35rem' }
const primaryBtn = { padding: '0.5rem 1rem', background: '#2563eb', color: '#fff', border: 0, borderRadius: 6 }
const secondaryBtn = { padding: '0.35rem 0.75rem', background: '#e2e8f0', border: 0, borderRadius: 6 }
