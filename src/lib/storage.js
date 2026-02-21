const BOOKS_KEY = 'bone_dyali_books'

function poKey(bookId) {
  return `bone_dyali_po_${bookId}`
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
  localStorage.setItem(BOOKS_KEY, JSON.stringify(books))
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
  localStorage.setItem(poKey(bookId), JSON.stringify(orders))
}

export function createBook({ name, ownerName, color, totalPages }) {
  const books = getBooks()
  const id = crypto.randomUUID()
  const book = {
    id,
    name: name.trim() || 'Unnamed book',
    ownerName: (ownerName || '').trim(),
    color: color || '#6366f1',
    totalPages: Math.max(1, Number(totalPages) || 1),
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

export function createPurchaseOrder(bookId, { client, lineItems, date }) {
  const book = getBook(bookId)
  if (!book) return null
  const orders = getPurchaseOrders(bookId)
  const poNumber = book.nextPoNumber
  const id = crypto.randomUUID()
  const po = {
    id,
    bookId,
    poNumber,
    date: (date || new Date().toISOString().slice(0, 10)),
    client: {
      name: (client?.name ?? '').trim(),
      address: (client?.address ?? '').trim(),
      extra: (client?.extra ?? '').trim(),
    },
    lineItems: (lineItems || []).map((item) => ({
      description: (item.description ?? '').trim(),
      quantity: Math.max(0, Number(item.quantity) || 0),
      unitPrice: Math.max(0, Number(item.unitPrice) || 0),
      code: (item.code ?? '').trim(),
    })),
    createdAt: new Date().toISOString(),
  }
  orders.push(po)
  savePurchaseOrders(bookId, orders)
  updateBook(bookId, { nextPoNumber: book.nextPoNumber + 1 })
  return po
}

export function getPurchaseOrder(bookId, poId) {
  return getPurchaseOrders(bookId).find((p) => p.id === poId) ?? null
}
