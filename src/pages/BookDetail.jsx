import { useMemo, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { Plus, Trash2, Lock, Edit3, FileText, Calendar, Printer } from 'lucide-react'
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

  const getOrderType = (order) => {
    if (order?.type === 'OR') return 'OR'
    if (order?.type === 'P') return 'P'
    return 'PO'
  }

  // Analytics
  const analytics = useMemo(() => {
    if (!orders.length) return { totalRevenue: 0, totalQuantity: 0 }
    
    return orders.reduce((acc, po) => {
      const type = getOrderType(po)
      const poTotal = po.lineItems.reduce((sum, item) => {
        if (type === 'P') {
          return sum + (Number(item.amount ?? item.unitPrice) || 0)
        }
        const qty = Number(item.quantity) || 0
        const price = Number(item.unitPrice) || 0
        return sum + qty * price
      }, 0)
      
      const poQty = type === 'P'
        ? 0
        : po.lineItems.reduce((sum, item) => {
            return sum + (Number(item.quantity) || 0)
          }, 0)

      const signedAmount = type === 'PO' ? poTotal : -poTotal
      const signedQty = type === 'OR' ? -poQty : poQty
      
      return {
        totalRevenue: acc.totalRevenue + signedAmount,
        totalQuantity: acc.totalQuantity + signedQty,
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
          <Link to={`/book/${bookId}/print`}>
            <Button variant="secondary" icon={Printer}>
              Print Book
            </Button>
          </Link>
          <Link to={`/book/${bookId}/po/new`}>
            <Button variant="primary" icon={Plus}>
              New PO
            </Button>
          </Link>
          <Link to={`/book/${bookId}/po/new?type=or`}>
            <Button variant="secondary" icon={Plus} style={{ backgroundColor: '#f59e0b', color: '#ffffff' }}>
              New OR
            </Button>
          </Link>
          <Link to={`/book/${bookId}/po/new?type=p`}>
            <Button variant="success" icon={Plus}>
              Add Payment
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
        <Card style={{ overflowX: 'auto', padding: 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                <th style={{ textAlign: 'left', padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.04em' }}>PO</th>
                <th style={{ textAlign: 'left', padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Date / Client</th>
                <th style={{ textAlign: 'right', padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Qty</th>
                <th style={{ textAlign: 'right', padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total</th>
                <th style={{ width: 56, padding: '0.75rem 1rem' }} />
              </tr>
            </thead>
            <tbody>
              {orders.map((po) => {
                const type = getOrderType(po)
                const poTotal = po.lineItems.reduce((sum, item) => {
                  if (type === 'P') {
                    return sum + (Number(item.amount ?? item.unitPrice) || 0)
                  }
                  const qty = Number(item.quantity) || 0
                  const price = Number(item.unitPrice) || 0
                  return sum + qty * price
                }, 0)
                const poQty = type === 'P'
                  ? 0
                  : po.lineItems.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0)

                const signedQty = type === 'OR' ? -poQty : poQty
                const signedTotal = type === 'PO' ? poTotal : -poTotal
                const orderColor = type === 'OR' ? '#d97706' : type === 'P' ? '#16a34a' : book.color
                const valueColor = type === 'OR' ? '#b45309' : type === 'P' ? '#15803d' : '#111827'

                const paymentBreakdown = type === 'P'
                  ? {
                      cash: po.lineItems.reduce((sum, item) => item.paymentType === 'Cash' ? sum + (Number(item.amount ?? item.unitPrice) || 0) : sum, 0),
                      check: po.lineItems.reduce((sum, item) => item.paymentType === 'Check' ? sum + (Number(item.amount ?? item.unitPrice) || 0) : sum, 0),
                      etra: po.lineItems.reduce((sum, item) => item.paymentType === 'Etra' ? sum + (Number(item.amount ?? item.unitPrice) || 0) : sum, 0),
                    }
                  : null

                return (
                  <tr
                    key={po.id}
                    style={{
                      borderBottom: '1px solid #f3f4f6',
                      opacity: po.locked ? 0.75 : 1,
                    }}
                    className="group"
                  >
                    <td style={{ padding: '0.875rem 1rem' }}>
                      <Link
                        to={`/book/${bookId}/po/${po.id}`}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: '#111827', textDecoration: 'none', fontWeight: 600 }}
                      >
                        <span
                          style={{ width: 4, height: 24, borderRadius: 9999, backgroundColor: orderColor }}
                        />
                        <span>{type} #{po.poNumber}</span>
                        {type === 'P' && (
                          <Badge variant="success" size="sm">Payment</Badge>
                        )}
                        {type === 'OR' && (
                          <Badge variant="warning" size="sm">Returned</Badge>
                        )}
                        {po.locked && (
                          <Badge variant="locked" size="sm" icon={Lock}>Locked</Badge>
                        )}
                      </Link>
                    </td>
                    <td style={{ padding: '0.875rem 1rem', color: '#4b5563', fontSize: '0.875rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Calendar style={{ width: 14, height: 14 }} className="w-3.5 h-3.5" />
                          {po.date}
                        </span>
                        <span>{po.client?.name || 'No client'}</span>
                        {type === 'P' && paymentBreakdown && (
                          <span style={{ color: '#15803d' }}>
                            Cash: {paymentBreakdown.cash.toFixed(2)} MAD · Check: {paymentBreakdown.check.toFixed(2)} MAD · Etra: {paymentBreakdown.etra.toFixed(2)} MAD
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '0.875rem 1rem', textAlign: 'right', fontWeight: 600, color: valueColor }}>
                      {type === 'P' ? '—' : signedQty.toLocaleString()}
                    </td>
                    <td style={{ padding: '0.875rem 1rem', textAlign: 'right', fontWeight: 600, color: valueColor }}>
                      {signedTotal.toFixed(2)} MAD
                    </td>
                    <td style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>
                      {!po.locked && (
                        <Link
                          to={`/book/${bookId}/po/${po.id}/edit`}
                          style={{ padding: '0.5rem', color: '#9ca3af', borderRadius: 8, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                          className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                          title="Edit"
                        >
                          <Edit3 style={{ width: 16, height: 16 }} className="w-4 h-4" />
                        </Link>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </Card>
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
