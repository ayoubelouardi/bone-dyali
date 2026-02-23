import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { useBooks } from '../hooks/useBooks'
import BookCard from '../components/BookCard'
import { exportAllData, importAllData } from '../lib/exportImport'
import { nukeDatabase } from '../lib/storage'

export default function Dashboard() {
  const { books, refresh } = useBooks()
  const fileInputRef = useRef(null)

  const handleExport = () => exportAllData()
  const handleImportClick = () => fileInputRef.current?.click()
  const handleImport = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    importAllData(file)
      .then(() => { refresh(); e.target.value = '' })
      .catch((err) => alert(err?.message || 'Import failed'))
  }

  const handleNuke = () => {
    if (!confirm('Delete ALL data (books and purchase orders)? This cannot be undone.')) return
    nukeDatabase()
    refresh()
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <h1 style={{ margin: 0, width: window.innerWidth <= 640 ? '100%' : 'auto' }}>Purchase Order Books</h1>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap', width: window.innerWidth <= 640 ? '100%' : 'auto' }}>
          <button type="button" onClick={handleExport} style={secondaryBtn}>Export backup</button>
          <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />
          <button type="button" onClick={handleImportClick} style={secondaryBtn}>Import backup</button>
          <button type="button" onClick={handleNuke} style={nukeBtn} title="Delete all data">Nuke database</button>
          <Link to="/book/new" style={primaryLink}>Create Book</Link>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {books.length === 0 ? (
          <p style={{ color: '#64748b' }}>No books yet. Create one to get started.</p>
        ) : (
          books.map((book) => <BookCard key={book.id} book={book} />)
        )}
      </div>
    </div>
  )
}

const primaryLink = { padding: '0.5rem 1rem', background: '#2563eb', color: '#fff', borderRadius: 6, textDecoration: 'none', fontWeight: 600, minHeight: 44, display: 'inline-flex', alignItems: 'center' }
const secondaryBtn = { padding: '0.5rem 1rem', background: '#e2e8f0', border: 0, borderRadius: 6, minHeight: 44 }
const nukeBtn = { padding: '0.5rem 1rem', background: '#dc2626', color: '#fff', border: 0, borderRadius: 6, minHeight: 44 }
