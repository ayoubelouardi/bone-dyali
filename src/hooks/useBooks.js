import { useState, useCallback } from 'react'
import * as storage from '../lib/storage'

export function useBooks() {
  const [books, setBooks] = useState(() => storage.getBooks())

  const refresh = useCallback(() => {
    setBooks(storage.getBooks())
  }, [])

  const addBook = useCallback((params) => {
    const book = storage.createBook(params)
    setBooks(storage.getBooks())
    return book
  }, [])

  const updateBook = useCallback((id, updates) => {
    const updated = storage.updateBook(id, updates)
    if (updated) setBooks(storage.getBooks())
    return updated
  }, [])

  const removeBook = useCallback((id) => {
    storage.deleteBook(id)
    setBooks(storage.getBooks())
  }, [])

  return { books, refresh, addBook, updateBook, removeBook }
}
