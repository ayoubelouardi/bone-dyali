import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { useBooks } from '../hooks/useBooks'
import BookCard from '../components/BookCard'
import { exportAllData, importAllData } from '../lib/exportImport'

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

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <h1 style={{ margin: 0 }}>Purchase Order Books</h1>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button type="button" onClick={handleExport} style={secondaryBtn}>Export backup</button>
          <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />
          <button type="button" onClick={handleImportClick} style={secondaryBtn}>Import backup</button>
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

const primaryLink = { padding: '0.5rem 1rem', background: '#2563eb', color: '#fff', borderRadius: 6, textDecoration: 'none', fontWeight: 600 }
const secondaryBtn = { padding: '0.5rem 1rem', background: '#e2e8f0', border: 0, borderRadius: 6 }
