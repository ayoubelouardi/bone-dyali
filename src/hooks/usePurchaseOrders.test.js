import { renderHook, act } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { usePurchaseOrders } from './usePurchaseOrders'
import * as storage from '../lib/storage'

vi.mock('../lib/storage', () => ({
  getPurchaseOrders: vi.fn(),
  createPurchaseOrder: vi.fn(),
  getPurchaseOrder: vi.fn(),
  updatePurchaseOrder: vi.fn(),
  togglePOLock: vi.fn(),
}))

describe('usePurchaseOrders', () => {
  it('loads orders by book id and refreshes when book changes', () => {
    storage.getPurchaseOrders.mockImplementation((bookId) =>
      bookId === 'b1' ? [{ id: 'po1' }] : [{ id: 'po2' }]
    )

    const { result, rerender } = renderHook(({ bookId }) => usePurchaseOrders(bookId), {
      initialProps: { bookId: 'b1' },
    })

    expect(result.current.orders).toEqual([{ id: 'po1' }])

    rerender({ bookId: 'b2' })
    expect(result.current.orders).toEqual([{ id: 'po2' }])
  })

  it('adds and toggles orders while re-reading storage state', () => {
    const ordersByState = {
      initial: [],
      afterAdd: [{ id: 'po1' }],
      afterToggle: [{ id: 'po1', locked: true }],
    }
    let state = 'initial'
    storage.getPurchaseOrders.mockImplementation(() => ordersByState[state])
    storage.createPurchaseOrder.mockReturnValue({ id: 'po1' })
    storage.togglePOLock.mockReturnValue({ id: 'po1', locked: true })

    const { result } = renderHook(() => usePurchaseOrders('b1'))

    act(() => {
      state = 'afterAdd'
      result.current.addOrder({ type: 'O' })
    })
    expect(storage.createPurchaseOrder).toHaveBeenCalledWith('b1', { type: 'O' })
    expect(result.current.orders).toEqual([{ id: 'po1' }])

    let toggled
    act(() => {
      state = 'afterToggle'
      toggled = result.current.toggleLock('po1')
    })
    expect(toggled).toEqual({ id: 'po1', locked: true })
    expect(result.current.orders).toEqual([{ id: 'po1', locked: true }])
  })

  it('returns null and warns when updateOrder hits a locked PO error', () => {
    storage.getPurchaseOrders
      .mockReturnValueOnce([{ id: 'po1', locked: true }])
      .mockReturnValueOnce([{ id: 'po1', locked: true }])
    storage.updatePurchaseOrder.mockImplementation(() => {
      throw new Error('Cannot edit locked purchase order')
    })

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { result } = renderHook(() => usePurchaseOrders('b1'))

    let value
    act(() => {
      value = result.current.updateOrder('po1', { client: { name: 'x' } })
    })

    expect(value).toBeNull()
    expect(warnSpy).toHaveBeenCalledWith('Cannot edit locked purchase order')
    expect(result.current.orders).toEqual([{ id: 'po1', locked: true }])
  })

  it('returns null when book id is missing', () => {
    const { result } = renderHook(() => usePurchaseOrders(''))

    expect(result.current.addOrder({ type: 'O' })).toBeNull()
    expect(result.current.updateOrder('po1', {})).toBeNull()
    expect(result.current.toggleLock('po1')).toBeNull()
  })
})
