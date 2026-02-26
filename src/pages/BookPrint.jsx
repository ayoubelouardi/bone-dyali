import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { getBook } from '../lib/db'
import { usePurchaseOrders } from '../hooks/usePurchaseOrders'
import Breadcrumbs from '../components/ui/Breadcrumbs'
import BookPrintView from '../components/BookPrintView'

export default function BookPrint() {
  const { bookId } = useParams()
  const [book, setBook] = useState(null)
  const [loading, setLoading] = useState(true)
  const { orders } = usePurchaseOrders(bookId)

  useEffect(() => {
    async function loadBook() {
      setLoading(true)
      const data = await getBook(bookId)
      setBook(data)
      setLoading(false)
    }
    loadBook()
  }, [bookId])

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Loading...</p>
      </div>
    )
  }

  if (!book) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">Book not found.</p>
        <Link to="/" className="text-blue-600 hover:text-blue-700">Back to Dashboard</Link>
      </div>
    )
  }

  const breadcrumbs = [
    { label: 'Dashboard', href: '/' },
    { label: book.name, href: `/book/${bookId}` },
    { label: 'Print Book' },
  ]

  return (
    <>
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <Breadcrumbs items={breadcrumbs} />

        <div className="no-print flex items-center gap-4 mb-6">
          <Link
            to={`/book/${bookId}`}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Book
          </Link>
          <div className="flex-1" />
          <span className="text-sm text-gray-500">{orders.length} purchase orders</span>
        </div>
      </div>

      <BookPrintView book={book} orders={orders} />
    </>
  )
}
