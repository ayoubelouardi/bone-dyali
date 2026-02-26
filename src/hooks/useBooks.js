import { useState, useCallback } from 'react'
import * as storage from '../lib/storage'
import { useAuth } from '../contexts/AuthContext'

export function useBooks() {
  const { isAdmin } = useAuth()
  const [books, setBooks] = useState(() => storage.getBooks())

  const refresh = useCallback(() => {
    setBooks(storage.getBooks())
  }, [])

  const addBook = useCallback((params) => {
    if (!isAdmin) {
      console.warn('Viewers cannot add books')
      return null
    }
    const book = storage.createBook(params)
    setBooks(storage.getBooks())
    return book
  }, [isAdmin])

  const updateBook = useCallback((id, updates) => {
    if (!isAdmin) {
      console.warn('Viewers cannot update books')
      return null
    }
    const updated = storage.updateBook(id, updates)
    if (updated) setBooks(storage.getBooks())
    return updated
  }, [isAdmin])

  const removeBook = useCallback((id) => {
    if (!isAdmin) {
      console.warn('Viewers cannot remove books')
      return
    }
    storage.deleteBook(id)
    setBooks(storage.getBooks())
  }, [isAdmin])

  return { books, refresh, addBook, updateBook, removeBook, canEdit: isAdmin }
}
