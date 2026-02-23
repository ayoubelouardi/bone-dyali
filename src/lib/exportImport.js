import { getBooks, saveBooks } from './storage.js'

const STORAGE_KEYS_PREFIX = 'bone_dyali_'

export function exportAllData() {
  const books = getBooks()
  const data = { books, purchaseOrders: {} }
  for (const book of books) {
    try {
      const raw = localStorage.getItem(`${STORAGE_KEYS_PREFIX}po_${book.id}`)
      if (raw) data.purchaseOrders[book.id] = JSON.parse(raw)
    } catch {}
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `bone-dyali-backup-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export function importAllData(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result)
        if (!data.books || !Array.isArray(data.books)) {
          reject(new Error('Invalid backup: missing books array'))
          return
        }
        saveBooks(data.books)
        const pos = data.purchaseOrders || {}
        for (const [bookId, orders] of Object.entries(pos)) {
          if (Array.isArray(orders)) {
            try {
              localStorage.setItem(`${STORAGE_KEYS_PREFIX}po_${bookId}`, JSON.stringify(orders))
            } catch (e) {
              reject(e)
              return
            }
          }
        }
        resolve()
      } catch (e) {
        reject(e)
      }
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsText(file)
  })
}
