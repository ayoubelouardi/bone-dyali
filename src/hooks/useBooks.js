import { useState, useCallback, useEffect } from 'react'
import * as db from '../lib/db'
import { useAuth } from '../contexts/AuthContext'

export function useBooks() {
  const { isAdmin, workspaceId } = useAuth()
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchBooks = useCallback(async () => {
    if (!workspaceId) {
      setBooks([])
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      const data = await db.getBooks(workspaceId)
      setBooks(data)
      setError(null)
    } catch (err) {
      console.error('useBooks fetchBooks error:', err)
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [workspaceId])

  useEffect(() => {
    fetchBooks()
  }, [fetchBooks])

  const refresh = useCallback(() => {
    return fetchBooks()
  }, [fetchBooks])

  const addBook = useCallback(async (params) => {
    if (!isAdmin) {
      console.warn('Viewers cannot add books')
      return null
    }
    const book = await db.createBook(workspaceId, params)
    await fetchBooks()
    return book
  }, [isAdmin, workspaceId, fetchBooks])

  const updateBook = useCallback(async (id, updates) => {
    if (!isAdmin) {
      console.warn('Viewers cannot update books')
      return null
    }
    const updated = await db.updateBook(id, updates)
    await fetchBooks()
    return updated
  }, [isAdmin, fetchBooks])

  const removeBook = useCallback(async (id) => {
    if (!isAdmin) {
      console.warn('Viewers cannot remove books')
      return
    }
    await db.deleteBook(id)
    await fetchBooks()
  }, [isAdmin, fetchBooks])

  return { books, loading, error, refresh, addBook, updateBook, removeBook, canEdit: isAdmin }
}
