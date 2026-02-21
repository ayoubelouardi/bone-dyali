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

  return { orders, refresh, addOrder, getOrder }
}
