import { useState, useCallback, useEffect } from 'react'
import * as storage from '../lib/storage'
import { useAuth } from '../contexts/AuthContext'

export function usePurchaseOrders(bookId) {
  const { isAdmin } = useAuth()
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
      if (!isAdmin) {
        console.warn('Viewers cannot add orders')
        return null
      }
      const po = storage.createPurchaseOrder(bookId, params)
      setOrders(storage.getPurchaseOrders(bookId))
      return po
    },
    [bookId, isAdmin]
  )

  const getOrder = useCallback(
    (poId) => storage.getPurchaseOrder(bookId, poId),
    [bookId]
  )

  const updateOrder = useCallback(
    (poId, updates) => {
      if (!bookId) return null
      if (!isAdmin) {
        console.warn('Viewers cannot update orders')
        return null
      }
      try {
        const po = storage.updatePurchaseOrder(bookId, poId, updates)
        setOrders(storage.getPurchaseOrders(bookId))
        return po
      } catch (error) {
        console.warn(error.message)
        return null
      }
    },
    [bookId, isAdmin]
  )

  const toggleLock = useCallback(
    (poId) => {
      if (!bookId) return null
      if (!isAdmin) {
        console.warn('Viewers cannot toggle lock')
        return null
      }
      const po = storage.togglePOLock(bookId, poId)
      setOrders(storage.getPurchaseOrders(bookId))
      return po
    },
    [bookId, isAdmin]
  )

  return { orders, refresh, addOrder, getOrder, updateOrder, toggleLock, canEdit: isAdmin }
}
