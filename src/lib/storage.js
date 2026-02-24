const BOOKS_KEY = 'bone_dyali_books'

function poKey(bookId) {
  return `bone_dyali_po_${bookId}`
}

// Fallback for crypto.randomUUID in older browsers or HTTP contexts
function generateUUID() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  // Fallback implementation
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

export function getBooks() {
  try {
    const raw = localStorage.getItem(BOOKS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveBooks(books) {
  try {
    localStorage.setItem(BOOKS_KEY, JSON.stringify(books))
  } catch (e) {
    if (e.name === 'QuotaExceededError') {
      console.warn('Storage quota exceeded. Please delete some books or export your data as backup.')
    }
    throw e
  }
}

export function getPurchaseOrders(bookId) {
  try {
    const raw = localStorage.getItem(poKey(bookId))
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function savePurchaseOrders(bookId, orders) {
  try {
    localStorage.setItem(poKey(bookId), JSON.stringify(orders))
  } catch (e) {
    if (e.name === 'QuotaExceededError') {
      console.warn('Storage quota exceeded. Please delete some purchase orders or export your data as backup.')
    }
    throw e
  }
}

export function createBook({ name, ownerName, color }) {
  const books = getBooks()
  const id = generateUUID()
  const book = {
    id,
    name: name.trim() || 'Unnamed book',
    ownerName: (ownerName || '').trim(),
    color: color || '#6366f1',
    createdAt: new Date().toISOString(),
    nextPoNumber: 1,
  }
  books.push(book)
  saveBooks(books)
  return book
}

export function updateBook(id, updates) {
  const books = getBooks()
  const i = books.findIndex((b) => b.id === id)
  if (i === -1) return null
  books[i] = { ...books[i], ...updates }
  saveBooks(books)
  return books[i]
}

export function getBook(id) {
  return getBooks().find((b) => b.id === id) ?? null
}

export function deleteBook(id) {
  const books = getBooks().filter((b) => b.id !== id)
  saveBooks(books)
  try {
    localStorage.removeItem(poKey(id))
  } catch {}
}

function normalizeOrderType(type) {
  const normalized = String(type || '').toUpperCase()
  if (normalized === 'OR' || normalized === 'P') return normalized
  return 'PO'
}

function normalizePaymentType(paymentType) {
  const normalized = String(paymentType || '').toLowerCase()
  if (normalized === 'cash') return 'Cash'
  if (normalized === 'check') return 'Check'
  if (normalized === 'etra') return 'Etra'
  return ''
}

function normalizeLineItems(lineItems, orderType) {
  if (orderType !== 'P') {
    return (lineItems || []).map((item) => ({
      description: (item.description ?? '').trim(),
      quantity: Math.max(0, Number(item.quantity) || 0),
      unitPrice: Math.max(0, Number(item.unitPrice) || 0),
      code: (item.code ?? '').trim(),
    }))
  }

  const uniqueTypes = new Set()

  return (lineItems || []).reduce((acc, item) => {
    const paymentType = normalizePaymentType(item.paymentType)
    if (!paymentType || uniqueTypes.has(paymentType)) return acc
    uniqueTypes.add(paymentType)

    const amount = Math.max(0, Number(item.amount ?? item.unitPrice) || 0)

    acc.push({
      paymentType,
      amount,
      nSerie: (item.nSerie ?? item.code ?? '').trim(),
      name: (item.name ?? item.description ?? '').trim(),
      description: (item.name ?? item.description ?? '').trim(),
      quantity: 1,
      unitPrice: amount,
      code: (item.nSerie ?? item.code ?? '').trim(),
    })

    return acc
  }, [])
}

export function createPurchaseOrder(bookId, { client, lineItems, date, type }) {
  const book = getBook(bookId)
  if (!book) return null
  const orders = getPurchaseOrders(bookId)
  const poNumber = book.nextPoNumber
  const id = generateUUID()
  const orderType = normalizeOrderType(type)
  const po = {
    id,
    bookId,
    poNumber,
    type: orderType,
    date: (date || new Date().toISOString().slice(0, 10)),
    client: {
      name: (client?.name ?? '').trim(),
      address: (client?.address ?? '').trim(),
      extra: (client?.extra ?? '').trim(),
    },
    lineItems: normalizeLineItems(lineItems, orderType),
    locked: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  orders.push(po)
  savePurchaseOrders(bookId, orders)
  updateBook(bookId, { nextPoNumber: book.nextPoNumber + 1 })
  return po
}

export function getPurchaseOrder(bookId, poId) {
  return getPurchaseOrders(bookId).find((p) => p.id === poId) ?? null
}

export function updatePurchaseOrder(bookId, poId, updates) {
  const orders = getPurchaseOrders(bookId)
  const index = orders.findIndex((p) => p.id === poId)
  if (index === -1) return null
  
  const po = orders[index]
  if (po.locked) {
    throw new Error('Cannot edit locked purchase order')
  }
  
  const nextType = normalizeOrderType(updates.type ?? po.type)

  const updatedPO = {
    ...po,
    ...updates,
    type: nextType,
    updatedAt: new Date().toISOString(),
    // Ensure these fields are properly formatted if updated
    client: updates.client ? {
      name: (updates.client?.name ?? po.client?.name ?? '').trim(),
      address: (updates.client?.address ?? po.client?.address ?? '').trim(),
      extra: (updates.client?.extra ?? po.client?.extra ?? '').trim(),
    } : po.client,
    lineItems: updates.lineItems ? normalizeLineItems(updates.lineItems, nextType) : po.lineItems,
  }
  
  orders[index] = updatedPO
  savePurchaseOrders(bookId, orders)
  return updatedPO
}

export function togglePOLock(bookId, poId) {
  const orders = getPurchaseOrders(bookId)
  const index = orders.findIndex((p) => p.id === poId)
  if (index === -1) return null
  
  orders[index] = {
    ...orders[index],
    locked: !orders[index].locked,
    updatedAt: new Date().toISOString(),
  }
  
  savePurchaseOrders(bookId, orders)
  return orders[index]
}

/** Permanently delete all app data from localStorage. */
export function nukeDatabase() {
  const books = getBooks()
  for (const book of books) {
    try {
      localStorage.removeItem(poKey(book.id))
    } catch {}
  }
  localStorage.removeItem(BOOKS_KEY)
}
