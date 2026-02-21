import { useRef, useEffect, useCallback } from 'react'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import './FactureView.css'

export default function FactureView({ book, po }) {
  const pageRef = useRef(null)

  useEffect(() => {
    if (pageRef.current) pageRef.current.focus?.()
  }, [])

  const orderTotal = (po?.lineItems || []).reduce(
    (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0),
    0
  )

  const handleDownloadPDF = useCallback(async () => {
    const node = pageRef.current
    if (!node || !po) return
    try {
      const canvas = await html2canvas(node, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#faf8f5',
      })
      const pdf = new jsPDF({ unit: 'mm', format: 'a4' })
      const pageW = 210
      const pageH = 297
      const canvasRatio = canvas.height / canvas.width
      const pageRatio = pageH / pageW
      const imgW = canvasRatio <= pageRatio ? pageW : pageH / canvasRatio
      const imgH = canvasRatio <= pageRatio ? pageW * canvasRatio : pageH
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, imgW, imgH)
      pdf.save(`po-${po.poNumber}.pdf`)
    } catch (err) {
      console.error('PDF export failed:', err)
    }
  }, [po])

  if (!book || !po) return <p>Loading…</p>

  return (
    <>
      <div className="no-print" style={{ marginBottom: '1rem' }}>
        <button
          type="button"
          onClick={handleDownloadPDF}
          style={{ padding: '0.5rem 1rem', background: '#2563eb', color: '#fff', border: 0, borderRadius: 6 }}
        >
          Download PDF
        </button>
      </div>
      <div ref={pageRef} className="facture-print po-book-page" dir="rtl">
        <div className="po-book-page__inner">
          <header className="po-book-page__header">
            <div className="po-book-page__header-left">
              <p className="po-book-page__facture-title">Facture</p>
              <p className="po-book-page__facture-meta">
                <span className="po-book-page__n-label">N°</span> {po.poNumber}
              </p>
              <p className="po-book-page__facture-meta">Date {po.date}</p>
            </div>
            <div className="po-book-page__owner-box">
              {book.ownerName || book.name}
              {book.ownerPhone && (
                <span className="po-book-page__owner-phone">{book.ownerPhone}</span>
              )}
            </div>
          </header>

          <div className="po-book-page__client-block">
            <span className="po-book-page__client-label">Messrs. / المطلوب من </span>
            <span className="po-book-page__client-name">{po.client?.name || '—'}</span>
          </div>
          {po.client?.address && (
            <p className="po-book-page__facture-meta" style={{ marginBottom: 8 }}>{po.client.address}</p>
          )}

          <div className="po-book-page__content">
            <table>
              <thead>
                <tr>
                  <th>الكمية<br />QTY</th>
                  <th>الشرح<br />DESCRIPTION</th>
                  <th>كود البضاعة<br />CODE</th>
                  <th>السعر الافرادي<br />Unit. Price</th>
                  <th>المجموع<br />Amount</th>
                </tr>
              </thead>
              <tbody>
                {(po.lineItems || []).map((item, i) => (
                  <tr key={i}>
                    <td>{item.quantity}</td>
                    <td>{item.description}</td>
                    <td>{item.code}</td>
                    <td>{Number(item.unitPrice).toFixed(2)}</td>
                    <td>{((Number(item.quantity) || 0) * (Number(item.unitPrice) || 0)).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <footer className="po-book-page__footer">
            <span className="po-book-page__total-label">المجموع</span>
            <span className="po-book-page__total-amount">{orderTotal.toFixed(2)} $</span>
          </footer>
        </div>
      </div>
    </>
  )
}
