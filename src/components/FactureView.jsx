import { useRef, useEffect } from 'react'

export default function FactureView({ book, po }) {
  const containerRef = useRef(null)

  useEffect(() => {
    if (containerRef.current) containerRef.current.focus?.()
  }, [])

  const orderTotal = (po?.lineItems || []).reduce(
    (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0),
    0
  )

  const handlePrint = () => window.print()

  if (!book || !po) return <p>Loading…</p>

  return (
    <>
    <div className="no-print" style={{ marginBottom: '1rem' }}>
      <button type="button" onClick={handlePrint} style={{ padding: '0.5rem 1rem', background: '#2563eb', color: '#fff', border: 0, borderRadius: 6 }}>Print</button>
    </div>
    <div ref={containerRef} className="facture-print" style={{ background: '#fff', padding: '2rem', maxWidth: 800 }} dir="rtl">
      <header style={{ marginBottom: '1.5rem', textAlign: 'right' }}>
        <p style={{ margin: 0 }}>Invoice Number / رقم الفاتورة: {po.poNumber}</p>
        <p style={{ margin: 0 }}>Date / التاريخ: {po.date}</p>
        <div style={{ border: '2px solid #1a1a1a', padding: '0.75rem', marginTop: '1rem', textAlign: 'center', fontWeight: 700 }}>
          {book.ownerName || book.name}
        </div>
        <p style={{ marginTop: '1rem', margin: 0 }}>Messrs. / المطلوب من السادة: {po.client?.name || '—'}</p>
        {po.client?.address && <p style={{ margin: 0 }}>{po.client.address}</p>}
      </header>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={thStyle}>QTY / العدد</th>
            <th style={thStyle}>DESCRIPTION / نوع البضاعة</th>
            <th style={thStyle}>CODE / كود البضاعة</th>
            <th style={thStyle}>UNIT PRICE / الثمن</th>
            <th style={thStyle}>AMOUNT / الثمن الكلي</th>
          </tr>
        </thead>
        <tbody>
          {(po.lineItems || []).map((item, i) => (
            <tr key={i}>
              <td style={tdStyle}>{item.quantity}</td>
              <td style={tdStyle}>{item.description}</td>
              <td style={tdStyle}>{item.code}</td>
              <td style={tdStyle}>{Number(item.unitPrice).toFixed(2)}</td>
              <td style={tdStyle}>{((Number(item.quantity) || 0) * (Number(item.unitPrice) || 0)).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={4} style={{ ...tdStyle, fontWeight: 700, textAlign: 'right' }}>TOTAL / المجموع</td>
            <td style={{ ...tdStyle, fontWeight: 700 }}>{orderTotal.toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
    </>
  )
}

const thStyle = { border: '1px solid #333', padding: '0.5rem', textAlign: 'right' }
const tdStyle = { border: '1px solid #333', padding: '0.5rem', textAlign: 'right' }
