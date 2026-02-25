import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createBook,
  createPurchaseOrder,
  deleteBook,
  getBook,
  getBooks,
  getPurchaseOrder,
  getPurchaseOrders,
  nukeDatabase,
  saveBooks,
  togglePOLock,
  updatePurchaseOrder,
} from './storage'

describe('storage', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-02-25T10:00:00.000Z'))
  })

  it('returns empty arrays on invalid stored JSON', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValueOnce('{bad')
    expect(getBooks()).toEqual([])

    vi.spyOn(Storage.prototype, 'getItem').mockReturnValueOnce('{bad')
    expect(getPurchaseOrders('book-1')).toEqual([])
  })

  it('creates a book with trimmed/default values', () => {
    const book = createBook({ name: '  Main Book  ', ownerName: '  Alice  ', color: '' })

    expect(book.name).toBe('Main Book')
    expect(book.ownerName).toBe('Alice')
    expect(book.color).toBe('#6366f1')
    expect(book.nextPoNumber).toBe(1)
    expect(book.id).toEqual(expect.any(String))

    const all = getBooks()
    expect(all).toHaveLength(1)
    expect(all[0].id).toBe(book.id)
  })

  it('creates purchase orders and increments nextPoNumber', () => {
    const book = createBook({ name: 'Book', ownerName: '', color: '#111111' })

    const po = createPurchaseOrder(book.id, {
      type: 'unknown',
      client: { name: '  Bob  ', address: '  Addr  ', extra: '  E  ' },
      lineItems: [{ description: ' Item ', quantity: '2', unitPrice: '10', code: ' A1 ' }],
      date: '2026-02-24',
    })

    expect(po).not.toBeNull()
    expect(po.type).toBe('PO')
    expect(po.poNumber).toBe(1)
    expect(po.client).toEqual({ name: 'Bob', address: 'Addr', extra: 'E' })
    expect(po.lineItems).toEqual([
      { description: 'Item', quantity: 2, unitPrice: 10, code: 'A1' },
    ])

    expect(getBook(book.id)?.nextPoNumber).toBe(2)
  })

  it('normalizes P type payment lines, dedupes paymentType and sanitizes amounts', () => {
    const book = createBook({ name: 'Book', ownerName: '', color: '#111111' })

    const po = createPurchaseOrder(book.id, {
      type: 'P',
      client: { name: '', address: '', extra: '' },
      lineItems: [
        { paymentType: 'cash', amount: '120', nSerie: ' S1 ', name: ' Name 1 ' },
        { paymentType: 'Cash', amount: '99', nSerie: ' S2 ', name: ' Name 2 ' },
        { paymentType: 'check', amount: '-2', nSerie: ' S3 ', name: ' Name 3 ' },
        { paymentType: 'invalid', amount: '50', nSerie: ' S4 ', name: ' Name 4 ' },
      ],
    })

    expect(po?.lineItems).toEqual([
      {
        paymentType: 'Cash',
        amount: 120,
        nSerie: 'S1',
        name: 'Name 1',
        description: 'Name 1',
        quantity: 1,
        unitPrice: 120,
        code: 'S1',
      },
      {
        paymentType: 'Check',
        amount: 0,
        nSerie: 'S3',
        name: 'Name 3',
        description: 'Name 3',
        quantity: 1,
        unitPrice: 0,
        code: 'S3',
      },
    ])
  })

  it('returns null when creating PO for non-existing book', () => {
    const po = createPurchaseOrder('missing', {
      type: 'PO',
      client: { name: '', address: '', extra: '' },
      lineItems: [],
    })

    expect(po).toBeNull()
  })

  it('throws when updating a locked purchase order', () => {
    const book = createBook({ name: 'Book', ownerName: '', color: '#111111' })
    const po = createPurchaseOrder(book.id, {
      type: 'PO',
      client: { name: '', address: '', extra: '' },
      lineItems: [{ description: 'x', quantity: 1, unitPrice: 1, code: '' }],
    })

    togglePOLock(book.id, po.id)

    expect(() => updatePurchaseOrder(book.id, po.id, { client: { name: 'N' } })).toThrow(
      'Cannot edit locked purchase order'
    )
  })

  it('toggles PO lock state', () => {
    const book = createBook({ name: 'Book', ownerName: '', color: '#111111' })
    const po = createPurchaseOrder(book.id, {
      type: 'PO',
      client: { name: '', address: '', extra: '' },
      lineItems: [{ description: 'x', quantity: 1, unitPrice: 1, code: '' }],
    })

    const locked = togglePOLock(book.id, po.id)
    expect(locked?.locked).toBe(true)

    const unlocked = togglePOLock(book.id, po.id)
    expect(unlocked?.locked).toBe(false)

    expect(getPurchaseOrder(book.id, po.id)?.locked).toBe(false)
  })

  it('warns and rethrows on quota exceeded saveBooks', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const error = Object.assign(new Error('quota'), { name: 'QuotaExceededError' })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw error
    })

    expect(() => saveBooks([])).toThrow(error)
    expect(warnSpy).toHaveBeenCalledTimes(1)
  })

  it('removes purchase orders when deleting a book and nukes entire database', () => {
    const book1 = createBook({ name: 'B1', ownerName: '', color: '#111111' })
    const book2 = createBook({ name: 'B2', ownerName: '', color: '#111111' })

    createPurchaseOrder(book1.id, {
      type: 'PO',
      client: { name: '', address: '', extra: '' },
      lineItems: [{ description: 'x', quantity: 1, unitPrice: 1, code: '' }],
    })
    createPurchaseOrder(book2.id, {
      type: 'PO',
      client: { name: '', address: '', extra: '' },
      lineItems: [{ description: 'y', quantity: 1, unitPrice: 1, code: '' }],
    })

    deleteBook(book1.id)
    expect(getBook(book1.id)).toBeNull()
    expect(getPurchaseOrders(book1.id)).toEqual([])
    expect(getPurchaseOrders(book2.id)).toHaveLength(1)

    nukeDatabase()
    expect(getBooks()).toEqual([])
    expect(getPurchaseOrders(book2.id)).toEqual([])
  })
})
