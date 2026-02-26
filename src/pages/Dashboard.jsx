import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Download, Upload, Trash2 } from 'lucide-react'
import { useBooks } from '../hooks/useBooks'
import BookCard from '../components/BookCard'
import { exportAllData, importAllData } from '../lib/exportImport'
import { nukeDatabase } from '../lib/storage'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import { ConfirmDialog } from '../components/ui/Modal'
import { useToast } from '../components/ui/Toast'
import { useState } from 'react'

export default function Dashboard() {
  const { books, refresh, canEdit } = useBooks()
  const fileInputRef = useRef(null)
  const toast = useToast()
  const [showNukeDialog, setShowNukeDialog] = useState(false)

  const handleExport = () => {
    exportAllData()
    toast.success('Data exported successfully')
  }

  const handleImportClick = () => fileInputRef.current?.click()
  
  const handleImport = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    importAllData(file)
      .then(() => { 
        refresh(); 
        e.target.value = ''
        toast.success('Data imported successfully')
      })
      .catch((err) => {
        toast.error(err?.message || 'Import failed')
      })
  }

  const handleNuke = () => {
    setShowNukeDialog(true)
  }

  const confirmNuke = () => {
    nukeDatabase()
    refresh()
    setShowNukeDialog(false)
    toast.success('All data has been deleted')
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }} className="sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827', margin: 0 }} className="text-2xl font-bold text-gray-900">Purchase Order Books</h1>
          <p style={{ color: '#6b7280', marginTop: '0.25rem' }} className="text-gray-500 mt-1">Manage your books and purchase orders</p>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          <Button variant="secondary" size="sm" icon={Download} onClick={handleExport}>
            Export
          </Button>
          {canEdit && (
            <>
              <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />
              <Button variant="secondary" size="sm" icon={Upload} onClick={handleImportClick}>
                Import
              </Button>
              <Button variant="danger" size="sm" icon={Trash2} onClick={handleNuke}>
                Nuke
              </Button>
            </>
          )}
          {canEdit && (
            <Link to="/book/new">
              <Button variant="primary" size="sm" icon={Plus}>
                Create Book
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Book List */}
      {books.length === 0 ? (
        <Card className="text-center py-12" style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{ color: '#9ca3af', marginBottom: '1rem' }}>
            <svg style={{ width: 64, height: 64, margin: '0 auto' }} className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 500, color: '#111827', marginBottom: '0.5rem' }} className="text-lg font-medium text-gray-900 mb-2">No books yet</h3>
          <p style={{ color: '#6b7280', marginBottom: '1.5rem' }} className="text-gray-500 mb-6">Create your first book to start managing purchase orders</p>
          <Link to="/book/new">
            <Button icon={Plus}>Create Your First Book</Button>
          </Link>
        </Card>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(1, minmax(0, 1fr))', gap: '1rem' }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
          {books.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      )}

      {/* Nuke Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showNukeDialog}
        onClose={() => setShowNukeDialog(false)}
        onConfirm={confirmNuke}
        title="Delete All Data"
        message="Are you sure you want to delete ALL data? This action cannot be undone and will permanently remove all books and purchase orders."
        confirmText="Delete Everything"
        variant="danger"
      />
    </div>
  )
}
