import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit3, Lock, Unlock } from 'lucide-react'
import { getBook, getPurchaseOrder } from '../lib/storage'
import { usePurchaseOrders } from '../hooks/usePurchaseOrders'
import FactureView from '../components/FactureView'
import { useState, useEffect } from 'react'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import Breadcrumbs from '../components/ui/Breadcrumbs'
import Card from '../components/ui/Card'
import { useToast } from '../components/ui/Toast'

export default function Facture() {
  const { bookId, poId } = useParams()
  const navigate = useNavigate()
  const book = getBook(bookId)
  const { toggleLock, getOrder } = usePurchaseOrders(bookId)
  const [po, setPO] = useState(getPurchaseOrder(bookId, poId))
  const toast = useToast()
  const orderType = po?.type === 'OR' ? 'OR' : po?.type === 'P' ? 'P' : 'PO'

  // Refresh PO data when it changes
  useEffect(() => {
    setPO(getPurchaseOrder(bookId, poId))
  }, [bookId, poId])

  if (!book || !po) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">Invoice not found.</p>
        <Link to="/" className="text-blue-600 hover:text-blue-700">Back to Dashboard</Link>
      </div>
    )
  }

  const handleToggleLock = () => {
    const updated = toggleLock(poId)
    if (updated) {
      setPO(updated)
      toast.success(`${orderType} #${po.poNumber} ${updated.locked ? 'locked' : 'unlocked'} successfully`)
    }
  }

  const handleEdit = () => {
    if (po.locked) {
      toast.warning('This purchase order is locked. Please unlock it first to edit.')
      return
    }
    navigate(`/book/${bookId}/po/${poId}/edit`)
  }

  const breadcrumbs = [
    { label: 'Dashboard', href: '/' },
    { label: book.name, href: `/book/${bookId}` },
    { label: `${orderType} #${po.poNumber}` },
  ]

  return (
    <>
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <Breadcrumbs items={breadcrumbs} />

        {/* Actions Bar */}
        <div className="no-print flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
          <Link 
            to={`/book/${bookId}`} 
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Archive
          </Link>
          
          <div className="flex-1" />
          
          {po.locked && (
            <Badge variant="locked" size="md" icon={Lock}>Locked</Badge>
          )}
          
          <div className="flex gap-2">
            <Button 
              variant={po.locked ? 'secondary' : 'primary'}
              icon={Edit3} 
              onClick={handleEdit}
              disabled={po.locked}
              style={!po.locked ? { backgroundColor: book.color } : {}}
            >
              Edit
            </Button>
            <Button 
              variant={po.locked ? 'success' : 'secondary'}
              icon={po.locked ? Unlock : Lock} 
              onClick={handleToggleLock}
            >
              {po.locked ? 'Unlock' : 'Lock'}
            </Button>
          </div>
        </div>
      </div>

      {/* Invoice View */}
      <FactureView book={book} po={po} />
    </>
  )
}
