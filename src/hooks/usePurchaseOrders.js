import { useState, useCallback, useEffect } from 'react'
import * as db from '../lib/db'
import { useAuth } from '../contexts/AuthContext'

export function usePurchaseOrders(bookId) {
  const { isAdmin, workspaceId } = useAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchOrders = useCallback(async () => {
    if (!bookId) {
      setOrders([])
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      const data = await db.getPurchaseOrders(bookId)
      setOrders(data)
      setError(null)
    } catch (err) {
      console.error('usePurchaseOrders fetchOrders error:', err)
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [bookId])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  const refresh = useCallback(() => {
    return fetchOrders()
  }, [fetchOrders])

  const addOrder = useCallback(async (params) => {
    if (!bookId) return null
    if (!isAdmin) {
      console.warn('Viewers cannot add orders')
      return null
    }
    const po = await db.createPurchaseOrder(bookId, workspaceId, params)
    await fetchOrders()
    return po
  }, [bookId, isAdmin, workspaceId, fetchOrders])

  const updateOrder = useCallback(async (poId, updates) => {
    if (!bookId) return null
    if (!isAdmin) {
      console.warn('Viewers cannot update orders')
      return null
    }
    try {
      const po = await db.updatePurchaseOrder(poId, updates)
      await fetchOrders()
      return po
    } catch (err) {
      console.warn(err.message)
      return null
    }
  }, [bookId, isAdmin, fetchOrders])

  const toggleLock = useCallback(async (poId) => {
    if (!bookId) return null
    if (!isAdmin) {
      console.warn('Viewers cannot toggle lock')
      return null
    }
    const po = await db.togglePOLock(poId)
    await fetchOrders()
    return po
  }, [bookId, isAdmin, fetchOrders])

  return { orders, loading, error, refresh, addOrder, updateOrder, toggleLock, canEdit: isAdmin }
}
