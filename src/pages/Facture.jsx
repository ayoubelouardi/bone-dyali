import { useParams } from 'react-router-dom'
import { getBook, getPurchaseOrder } from '../lib/storage'
import FactureView from '../components/FactureView'

export default function Facture() {
  const { bookId, poId } = useParams()
  const book = getBook(bookId)
  const po = getPurchaseOrder(bookId, poId)

  if (!book || !po) {
    return <p>Invoice not found.</p>
  }

  return <FactureView book={book} po={po} />
}
