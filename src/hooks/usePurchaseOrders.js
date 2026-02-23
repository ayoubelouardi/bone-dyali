import { useState, useCallback, useEffect } from 'react'
import * as storage from '../lib/storage'

export function usePurchaseOrders(bookId) {
  const [orders, setOrders] = useState(() =>
    bookId ? storage.getPurchaseOrders(bookId) : []
  )

  useEffect(() => {
    setOrders(bookId ? storage.getPurchaseOrders(bookId) : [])
  }, [bookId])

  const refresh = useCallback(() => {
    if (bookId) setOrders(storage.getPurchaseOrders(bookId))
  }, [bookId])

  const addOrder = useCallback(
    (params) => {
      if (!bookId) return null
      const po = storage.createPurchaseOrder(bookId, params)
      setOrders(storage.getPurchaseOrders(bookId))
      return po
    },
    [bookId]
  )

  const getOrder = useCallback(
    (poId) => storage.getPurchaseOrder(bookId, poId),
    [bookId]
  )

  const updateOrder = useCallback(
    (poId, updates) => {
      if (!bookId) return null
      try {
        const po = storage.updatePurchaseOrder(bookId, poId, updates)
        setOrders(storage.getPurchaseOrders(bookId))
        return po
      } catch (error) {
        console.warn(error.message)
        return null
      }
    },
    [bookId]
  )

  const toggleLock = useCallback(
    (poId) => {
      if (!bookId) return null
      const po = storage.togglePOLock(bookId, poId)
      setOrders(storage.getPurchaseOrders(bookId))
      return po
    },
    [bookId]
  )

  return { orders, refresh, addOrder, getOrder, updateOrder, toggleLock }
}
