import { useState, useMemo, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-react'
import { getBook } from '../lib/storage'
import { usePurchaseOrders } from '../hooks/usePurchaseOrders'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Breadcrumbs from '../components/ui/Breadcrumbs'
import Badge from '../components/ui/Badge'

const emptyLine = () => ({ description: '', quantity: 0, unitPrice: 0, code: '' })
const emptyPaymentLine = () => ({ paymentType: '', nSerie: '', name: '', amount: 0 })
const PAYMENT_TYPES = ['Cash', 'Check', 'Etra']

export default function PurchaseOrder() {
  const { bookId, poId } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const book = getBook(bookId)
  const { addOrder, getOrder, updateOrder, canEdit } = usePurchaseOrders(bookId)
  const [client, setClient] = useState({ name: '', address: '', extra: '' })
  const [lineItems, setLineItems] = useState([emptyLine()])
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [isInitialized, setIsInitialized] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const isNew = !poId || poId === 'new'
  const existingPO = isNew ? null : getOrder(poId)
  const requestedType = searchParams.get('type')?.toUpperCase()
  const newOrderType = requestedType === 'OR' ? 'OR' : requestedType === 'P' ? 'P' : 'O'
  const orderType = isNew
    ? newOrderType
    : existingPO?.type === 'OR'
      ? 'OR'
      : existingPO?.type === 'P'
        ? 'P'
        : 'O'
  const orderTypeLabel = orderType === 'OR' ? 'Order Returned' : orderType === 'P' ? 'Payment' : 'Purchase Order'
  const isPayment = orderType === 'P'

  // Load existing PO data when editing
  useEffect(() => {
    if (isNew) {
      setLineItems(isPayment ? [emptyPaymentLine()] : [emptyLine()])
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
    if (orderType === 'P') {
      const paymentLines = (existingPO.lineItems || []).map((item) => ({
        paymentType: item.paymentType || '',
        nSerie: item.nSerie ?? item.code ?? '',
        name: item.name ?? item.description ?? '',
        amount: Number(item.amount ?? item.unitPrice) || 0,
      }))
      setLineItems(paymentLines.length > 0 ? paymentLines : [emptyPaymentLine()])
    } else {
      setLineItems(existingPO.lineItems && existingPO.lineItems.length > 0 ? existingPO.lineItems : [emptyLine()])
    }
    setDate(existingPO.date || new Date().toISOString().slice(0, 10))
    setIsInitialized(true)
  }, [existingPO, bookId, poId, navigate, isInitialized, isNew, orderType, isPayment])

  const orderTotal = useMemo(
    () => {
      if (isPayment) {
        return lineItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
      }
      return lineItems.reduce(
        (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0),
        0
      )
    },
    [lineItems, isPayment]
  )

  const updateLine = (index, field, value) => {
    setLineItems((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], [field]: value }
      return next
    })
  }

  const addLine = () => setLineItems((prev) => [...prev, isPayment ? emptyPaymentLine() : emptyLine()])
  const removeLine = (index) => {
    if (lineItems.length <= 1) return
    setLineItems((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!book) return

    if (isPayment) {
      const selectedTypes = lineItems.map((item) => item.paymentType).filter(Boolean)
      const hasDuplicateType = new Set(selectedTypes).size !== selectedTypes.length
      if (hasDuplicateType) {
        setErrorMessage('Payment type must be unique: only one Cash, one Check, and one Etra line are allowed.')
        return
      }
    }

    const normalizedLineItems = isPayment
      ? lineItems.map((item) => ({
          paymentType: item.paymentType,
          nSerie: item.nSerie,
          name: item.name,
          amount: item.amount,
        }))
      : lineItems
    
    if (isNew) {
      addOrder({ client, lineItems: normalizedLineItems, date, type: orderType })
    } else {
      const success = updateOrder(poId, { client, lineItems: normalizedLineItems, date })
      if (!success) {
        setErrorMessage('Unable to update this purchase order. It might be locked.')
        return
      }
    }
    
    navigate(`/book/${bookId}`)
  }

  if (!book) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">Book not found.</p>
        <Button variant="secondary" onClick={() => navigate('/')}>Back to Dashboard</Button>
      </div>
    )
  }

  if (!canEdit && !isNew) {
    return (
      <div className="no-print max-w-3xl mx-auto">
        <Breadcrumbs items={[
          { label: 'Dashboard', href: '/' },
          { label: book.name, href: `/book/${bookId}` },
          { label: `${orderType} #${existingPO?.poNumber}` },
        ]} />
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-lg">
          You have view-only access to this purchase order.
        </div>
        <Button variant="secondary" onClick={() => navigate(`/book/${bookId}/po/${poId}`)}>
          View Details
        </Button>
      </div>
    )
  }

  const breadcrumbs = [
    { label: 'Dashboard', href: '/' },
    { label: book.name, href: `/book/${bookId}` },
    { label: isNew ? `New ${orderType}` : `${orderType} #${existingPO?.poNumber}` },
  ]

  return (
    <div className="no-print max-w-3xl mx-auto">
      <Breadcrumbs items={breadcrumbs} />

      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" icon={ArrowLeft} onClick={() => navigate(isNew ? `/book/${bookId}` : `/book/${bookId}/po/${poId}`)}>
          Back
        </Button>
      </div>

      {errorMessage && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {errorMessage}
        </div>
      )}

      <Card>
        <div className="flex items-center gap-2 mb-6">
          <h1 className="text-xl font-bold text-gray-900">
            {isNew ? `New ${orderTypeLabel}` : `Edit ${orderTypeLabel} #${existingPO?.poNumber}`}
          </h1>
          <Badge variant={orderType === 'OR' ? 'warning' : orderType === 'P' ? 'success' : 'primary'} size="sm">
            {orderType}
          </Badge>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Client Section */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Client Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Client Name"
                value={client.name}
                onChange={(e) => setClient((c) => ({ ...c, name: e.target.value }))}
                placeholder="Enter client name"
              />
              <Input
                label="Date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="mt-4">
              <Input
                label="Address"
                value={client.address}
                onChange={(e) => setClient((c) => ({ ...c, address: e.target.value }))}
                placeholder="Enter client address"
              />
            </div>
          </div>

          {/* Line Items Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">{isPayment ? 'Payment Details' : 'Line Items'}</h3>
              <Button type="button" variant="secondary" size="sm" icon={Plus} onClick={addLine}>
                {isPayment ? 'Add Payment' : 'Add Line'}
              </Button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead>
                  {isPayment ? (
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-2 text-sm font-medium text-gray-500 w-32">Payment Type</th>
                      <th className="text-left py-3 px-2 text-sm font-medium text-gray-500 w-36">N SERIE</th>
                      <th className="text-left py-3 px-2 text-sm font-medium text-gray-500">Name</th>
                      <th className="text-left py-3 px-2 text-sm font-medium text-gray-500 w-28">Amount</th>
                      <th className="w-12"></th>
                    </tr>
                  ) : (
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-2 text-sm font-medium text-gray-500 w-20">Qty</th>
                      <th className="text-left py-3 px-2 text-sm font-medium text-gray-500">Description</th>
                      <th className="text-left py-3 px-2 text-sm font-medium text-gray-500 w-24">Code</th>
                      <th className="text-left py-3 px-2 text-sm font-medium text-gray-500 w-28">Unit Price</th>
                      <th className="text-left py-3 px-2 text-sm font-medium text-gray-500 w-24">Amount</th>
                      <th className="w-12"></th>
                    </tr>
                  )}
                </thead>
                <tbody>
                  {lineItems.map((item, i) => (
                    <tr key={i} className="border-b border-gray-100">
                      {isPayment ? (
                        <>
                          <td className="py-2 px-2">
                            <select
                              value={item.paymentType || ''}
                              onChange={(e) => updateLine(i, 'paymentType', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                            >
                              <option value="">Select type</option>
                              {PAYMENT_TYPES.map((paymentType) => {
                                const isUsedByAnotherRow = lineItems.some(
                                  (row, rowIndex) => rowIndex !== i && row.paymentType === paymentType
                                )
                                return (
                                  <option key={paymentType} value={paymentType} disabled={isUsedByAnotherRow}>
                                    {paymentType}
                                  </option>
                                )
                              })}
                            </select>
                          </td>
                          <td className="py-2 px-2">
                            <input
                              type="text"
                              value={item.nSerie || ''}
                              onChange={(e) => updateLine(i, 'nSerie', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="N SERIE"
                            />
                          </td>
                          <td className="py-2 px-2">
                            <input
                              type="text"
                              value={item.name || ''}
                              onChange={(e) => updateLine(i, 'name', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="Name"
                            />
                          </td>
                          <td className="py-2 px-2">
                            <input
                              type="number"
                              min={0}
                              step="0.01"
                              value={item.amount}
                              onChange={(e) => updateLine(i, 'amount', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="py-2 px-2">
                            <input
                              type="number"
                              min={0}
                              value={item.quantity}
                              onChange={(e) => updateLine(i, 'quantity', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </td>
                          <td className="py-2 px-2">
                            <input
                              type="text"
                              value={item.description}
                              onChange={(e) => updateLine(i, 'description', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="Item description"
                            />
                          </td>
                          <td className="py-2 px-2">
                            <input
                              type="text"
                              value={item.code}
                              onChange={(e) => updateLine(i, 'code', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="Code"
                            />
                          </td>
                          <td className="py-2 px-2">
                            <input
                              type="number"
                              min={0}
                              step="0.01"
                              value={item.unitPrice}
                              onChange={(e) => updateLine(i, 'unitPrice', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </td>
                          <td className="py-2 px-2 text-gray-600 font-medium">
                            {((Number(item.quantity) || 0) * (Number(item.unitPrice) || 0)).toFixed(2)}
                          </td>
                        </>
                      )}
                      <td className="py-2 px-2">
                        <button
                          type="button"
                          onClick={() => removeLine(i)}
                          disabled={lineItems.length <= 1}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="flex justify-end mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="text-right">
                <div className="text-sm text-gray-500">{isPayment ? 'Payment Total' : 'Order Total'}</div>
                <div className={`text-2xl font-bold ${isPayment ? 'text-green-700' : 'text-gray-900'}`}>{orderTotal.toFixed(2)} MAD</div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex gap-3 pt-4 border-t border-gray-100">
            <Button type="submit" icon={Save}>
              {isNew ? `Save ${orderTypeLabel}` : `Update ${orderTypeLabel}`}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
