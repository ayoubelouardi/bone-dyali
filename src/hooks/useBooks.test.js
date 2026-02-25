import { renderHook, act } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useBooks } from './useBooks'
import * as storage from '../lib/storage'

vi.mock('../lib/storage', () => ({
  getBooks: vi.fn(),
  createBook: vi.fn(),
  updateBook: vi.fn(),
  deleteBook: vi.fn(),
}))

describe('useBooks', () => {
  it('initializes from storage and refreshes after add', () => {
    storage.getBooks
      .mockReturnValueOnce([{ id: 'b1' }])
      .mockReturnValueOnce([{ id: 'b1' }, { id: 'b2' }])
    storage.createBook.mockReturnValue({ id: 'b2' })

    const { result } = renderHook(() => useBooks())
    expect(result.current.books).toEqual([{ id: 'b1' }])

    let created
    act(() => {
      created = result.current.addBook({ name: 'book' })
    })

    expect(created).toEqual({ id: 'b2' })
    expect(storage.createBook).toHaveBeenCalledWith({ name: 'book' })
    expect(result.current.books).toEqual([{ id: 'b1' }, { id: 'b2' }])
  })

  it('updates and removes books while syncing state from storage', () => {
    storage.getBooks
      .mockReturnValueOnce([{ id: 'b1' }])
      .mockReturnValueOnce([{ id: 'b1', name: 'new' }])
      .mockReturnValueOnce([])
    storage.updateBook.mockReturnValue({ id: 'b1', name: 'new' })

    const { result } = renderHook(() => useBooks())

    act(() => {
      result.current.updateBook('b1', { name: 'new' })
    })
    expect(result.current.books).toEqual([{ id: 'b1', name: 'new' }])

    act(() => {
      result.current.removeBook('b1')
    })

    expect(storage.deleteBook).toHaveBeenCalledWith('b1')
    expect(result.current.books).toEqual([])
  })
})
