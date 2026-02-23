import { useMemo, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2, Lock, Unlock, Edit3, FileText, Calendar } from 'lucide-react'
import { useBooks } from '../hooks/useBooks'
import { usePurchaseOrders } from '../hooks/usePurchaseOrders'
import { getBook } from '../lib/storage'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Breadcrumbs from '../components/ui/Breadcrumbs'
import { ConfirmDialog } from '../components/ui/Modal'
import { useToast } from '../components/ui/Toast'

export default function BookDetail() {
  const { bookId } = useParams()
  const navigate = useNavigate()
  const { removeBook } = useBooks()
  const { orders } = usePurchaseOrders(bookId)
  const book = bookId === 'new' ? null : getBook(bookId)
  const toast = useToast()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

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
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">Book not found.</p>
        <Link to="/" className="text-blue-600 hover:text-blue-700">Back to dashboard</Link>
      </div>
    )
  }

  const handleDelete = () => {
    setShowDeleteDialog(true)
  }

  const confirmDelete = () => {
    removeBook(book.id)
    navigate('/')
    toast.success('Book deleted successfully')
  }

  const breadcrumbs = [
    { label: 'Dashboard', href: '/' },
    { label: book.name },
  ]

  return (
    <div>
      <Breadcrumbs items={breadcrumbs} />

      {/* Header */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }} className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div 
            className="w-3 h-12 rounded-full"
            style={{ width: 12, borderRadius: 9999, backgroundColor: book.color }}
          />
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827', margin: 0 }} className="text-2xl font-bold text-gray-900">{book.name}</h1>
            {book.ownerName && (
              <p style={{ color: '#6b7280' }} className="text-gray-500">{book.ownerName}</p>
            )}
          </div>
        </div>
        
        <div style={{ flex: 1 }} />
        
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          <Link to={`/book/${bookId}/po/new`}>
            <Button variant="primary" icon={Plus}>
              New PO
            </Button>
          </Link>
          <Button variant="danger" icon={Trash2} onClick={handleDelete}>
            Delete
          </Button>
        </div>
      </div>

      {/* Analytics */}
      {orders.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          <Card className="text-center">
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827' }}>
              {analytics.totalRevenue.toFixed(2)} MAD
            </div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>Total Revenue</div>
          </Card>
          <Card className="text-center">
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827' }}>
              {analytics.totalQuantity.toLocaleString()}
            </div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>Total Quantity Sold</div>
          </Card>
        </div>
      )}

      {/* PO List */}
      <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#111827', marginTop: 0, marginBottom: '1rem' }} className="text-lg font-semibold text-gray-900 mb-4">Purchase Orders</h2>
      
      {orders.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: '3rem' }} className="text-center py-12">
          <div style={{ color: '#9ca3af', marginBottom: '1rem' }}>
            <FileText style={{ width: 48, height: 48, margin: '0 auto' }} className="w-12 h-12 mx-auto" />
          </div>
          <h3 style={{ color: '#111827', fontWeight: 500, marginBottom: '0.5rem' }} className="text-gray-900 font-medium mb-2">No purchase orders yet</h3>
          <p style={{ color: '#6b7280', marginBottom: '1.5rem' }} className="text-gray-500 mb-6">Create your first purchase order for this book</p>
          <Link to={`/book/${bookId}/po/new`}>
            <Button icon={Plus}>Create Purchase Order</Button>
          </Link>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }} className="space-y-3 stagger-children">
          {orders.map((po) => (
            <Link
              key={po.id}
              to={`/book/${bookId}/po/${po.id}`}
              style={{ display: 'block', textDecoration: 'none' }}
              className="block group"
            >
              <Card 
                hover 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '1rem',
                  opacity: po.locked ? 0.75 : 1,
                }}
                className={`
                  flex items-center gap-4
                  ${po.locked ? 'opacity-75' : ''}
                `}
              >
                <div 
                  style={{ width: 4, borderRadius: 9999, flexShrink: 0, minHeight: 48, backgroundColor: book.color }}
                  className="w-1 h-12 rounded-full flex-shrink-0"
                />
                
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontWeight: 600, color: '#111827' }}>
                      PO #{po.poNumber}
                    </span>
                    {po.locked && (
                      <Badge variant="locked" size="sm" icon={Lock}>Locked</Badge>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Calendar style={{ width: 14, height: 14 }} className="w-3.5 h-3.5" />
                      {po.date}
                    </span>
                    <span>{po.client?.name || 'No client'}</span>
                  </div>
                </div>

                {!po.locked && (
                  <Link
                    to={`/book/${bookId}/po/${po.id}/edit`}
                    onClick={(e) => e.stopPropagation()}
                    style={{ padding: '0.5rem', color: '#9ca3af' }}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit3 style={{ width: 16, height: 16 }} className="w-4 h-4" />
                  </Link>
                )}
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={confirmDelete}
        title="Delete Book"
        message={`Are you sure you want to delete "${book.name}"? This will also delete all ${orders.length} purchase orders. This action cannot be undone.`}
        confirmText="Delete Book"
        variant="danger"
      />
    </div>
  )
}
