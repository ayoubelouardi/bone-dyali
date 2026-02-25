import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as storage from './storage'
import { exportAllData, importAllData } from './exportImport'

class MockFileReader {
  static next = { type: 'success', result: '' }

  constructor() {
    this.result = null
    this.error = null
    this.onload = null
    this.onerror = null
  }

  readAsText() {
    const payload = MockFileReader.next
    if (payload.type === 'error') {
      this.error = payload.error
      this.onerror?.()
      return
    }

    this.result = payload.result
    this.onload?.()
  }
}

describe('exportImport', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
    vi.stubGlobal('FileReader', MockFileReader)
  })

  it('exports books and purchase orders into downloadable JSON', async () => {
    class MockBlob {
      constructor(parts, options) {
        this.parts = parts
        this.options = options
      }
    }
    vi.stubGlobal('Blob', MockBlob)

    const createObjectURL = vi.fn(() => 'blob:backup')
    const revokeObjectURL = vi.fn()
    vi.stubGlobal('URL', { createObjectURL, revokeObjectURL })

    const click = vi.fn()
    const anchor = { click, href: '', download: '' }
    vi.spyOn(document, 'createElement').mockReturnValue(anchor)

    vi.spyOn(storage, 'getBooks').mockReturnValue([{ id: 'b1', name: 'Book 1' }])
    localStorage.setItem('bone_dyali_po_b1', JSON.stringify([{ id: 'po1' }]))

    exportAllData()

    expect(createObjectURL).toHaveBeenCalledTimes(1)
    const blobArg = createObjectURL.mock.calls[0][0]
    const text = blobArg.parts.join('')
    const parsed = JSON.parse(text)

    expect(parsed).toEqual({
      books: [{ id: 'b1', name: 'Book 1' }],
      purchaseOrders: { b1: [{ id: 'po1' }] },
    })
    expect(anchor.download).toMatch(/^bone-dyali-backup-\d{4}-\d{2}-\d{2}\.json$/)
    expect(click).toHaveBeenCalledTimes(1)
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:backup')
  })

  it('imports valid backup and keeps unrelated existing PO keys', async () => {
    localStorage.setItem('bone_dyali_po_stale', JSON.stringify([{ id: 'old' }]))

    const saveBooksSpy = vi.spyOn(storage, 'saveBooks')
    const payload = {
      books: [{ id: 'b1', name: 'Book 1' }],
      purchaseOrders: {
        b1: [{ id: 'po1' }],
      },
    }

    MockFileReader.next = {
      type: 'success',
      result: JSON.stringify(payload),
    }

    await expect(importAllData(new Blob(['data']))).resolves.toBeUndefined()

    expect(saveBooksSpy).toHaveBeenCalledWith(payload.books)
    expect(JSON.parse(localStorage.getItem('bone_dyali_po_b1'))).toEqual([{ id: 'po1' }])
    expect(JSON.parse(localStorage.getItem('bone_dyali_po_stale'))).toEqual([{ id: 'old' }])
  })

  it('rejects import when books array is missing', async () => {
    MockFileReader.next = {
      type: 'success',
      result: JSON.stringify({ purchaseOrders: {} }),
    }

    await expect(importAllData(new Blob(['data']))).rejects.toThrow(
      'Invalid backup: missing books array'
    )
  })

  it('rejects when FileReader errors', async () => {
    MockFileReader.next = {
      type: 'error',
      error: new Error('read failed'),
    }

    await expect(importAllData(new Blob(['data']))).rejects.toThrow('read failed')
  })

  it('rejects when writing purchase orders fails', async () => {
    MockFileReader.next = {
      type: 'success',
      result: JSON.stringify({
        books: [],
        purchaseOrders: { b1: [{ id: 'po1' }] },
      }),
    }

    const error = new Error('write failed')
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw error
    })

    await expect(importAllData(new Blob(['data']))).rejects.toThrow('write failed')
  })
})
