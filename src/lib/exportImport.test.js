import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as db from './db.js'
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

const WORKSPACE_ID = 'ws-test'

const BACKUP_PAYLOAD = {
  books: [{ id: 'b1', name: 'Book 1' }],
  purchaseOrders: { b1: [{ id: 'po1' }] },
}

describe('exportImport', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.stubGlobal('FileReader', MockFileReader)
  })

  it('exports workspace data into a downloadable JSON file', async () => {
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

    vi.spyOn(db, 'readAllWorkspaceData').mockResolvedValue(BACKUP_PAYLOAD)

    await exportAllData(WORKSPACE_ID)

    expect(db.readAllWorkspaceData).toHaveBeenCalledWith(WORKSPACE_ID)
    expect(createObjectURL).toHaveBeenCalledTimes(1)
    const blobArg = createObjectURL.mock.calls[0][0]
    const text = blobArg.parts.join('')
    const parsed = JSON.parse(text)

    expect(parsed).toEqual(BACKUP_PAYLOAD)
    expect(anchor.download).toMatch(/^bone-dyali-backup-\d{4}-\d{2}-\d{2}\.json$/)
    expect(click).toHaveBeenCalledTimes(1)
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:backup')
  })

  it('imports valid backup by calling importWorkspaceData', async () => {
    vi.spyOn(db, 'importWorkspaceData').mockResolvedValue(undefined)

    MockFileReader.next = {
      type: 'success',
      result: JSON.stringify(BACKUP_PAYLOAD),
    }

    await expect(importAllData(new Blob(['data']), WORKSPACE_ID)).resolves.toBeUndefined()

    expect(db.importWorkspaceData).toHaveBeenCalledWith(WORKSPACE_ID, BACKUP_PAYLOAD)
  })

  it('rejects import when books array is missing', async () => {
    MockFileReader.next = {
      type: 'success',
      result: JSON.stringify({ purchaseOrders: {} }),
    }

    await expect(importAllData(new Blob(['data']), WORKSPACE_ID)).rejects.toThrow(
      'Invalid backup: missing books array'
    )
  })

  it('rejects when FileReader errors', async () => {
    MockFileReader.next = {
      type: 'error',
      error: new Error('read failed'),
    }

    await expect(importAllData(new Blob(['data']), WORKSPACE_ID)).rejects.toThrow('read failed')
  })

  it('rejects when importWorkspaceData throws', async () => {
    const error = new Error('db write failed')
    vi.spyOn(db, 'importWorkspaceData').mockRejectedValue(error)

    MockFileReader.next = {
      type: 'success',
      result: JSON.stringify(BACKUP_PAYLOAD),
    }

    await expect(importAllData(new Blob(['data']), WORKSPACE_ID)).rejects.toThrow('db write failed')
  })
})
