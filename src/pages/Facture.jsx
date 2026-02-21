import { useParams, Link } from 'react-router-dom'
import { getBook, getPurchaseOrder } from '../lib/storage'
import FactureView from '../components/FactureView'

export default function Facture() {
  const { bookId, poId } = useParams()
  const book = getBook(bookId)
  const po = getPurchaseOrder(bookId, poId)

  if (!book || !po) {
    return <p>Invoice not found.</p>
  }

  return (
    <>
      <div className="no-print" style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <Link to={`/book/${bookId}`} style={{ color: '#64748b' }}>← Back to archive</Link>
      </div>
      <FactureView book={book} po={po} />
    </>
  )
}
