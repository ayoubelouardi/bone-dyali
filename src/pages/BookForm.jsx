import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBooks } from '../hooks/useBooks'

const DEFAULT_COLOR = '#6366f1'

export default function BookForm() {
  const navigate = useNavigate()
  const { addBook } = useBooks()
  const [name, setName] = useState('')
  const [ownerName, setOwnerName] = useState('')
  const [color, setColor] = useState(DEFAULT_COLOR)
  const [totalPages, setTotalPages] = useState(1)

  const handleSubmit = (e) => {
    e.preventDefault()
    const book = addBook({ name, ownerName, color, totalPages })
    navigate(`/book/${book.id}`)
  }

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Create Book</h1>
      <form onSubmit={handleSubmit} style={{ maxWidth: 400 }}>
        <label style={{ display: 'block', marginBottom: '1rem', fontWeight: 500 }}>
          Book name
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. 2024 Orders" required style={{ display: 'block', width: '100%', padding: '0.5rem', marginTop: '0.25rem' }} />
        </label>
        <label style={{ display: 'block', marginBottom: '1rem', fontWeight: 500 }}>
          Owner name (on invoice)
          <input type="text" value={ownerName} onChange={(e) => setOwnerName(e.target.value)} placeholder="Company / owner name" style={{ display: 'block', width: '100%', padding: '0.5rem', marginTop: '0.25rem' }} />
        </label>
        <label style={{ display: 'block', marginBottom: '1rem', fontWeight: 500 }}>
          Color
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} style={{ height: 40, padding: 2, cursor: 'pointer' }} />
        </label>
        <label style={{ display: 'block', marginBottom: '1rem', fontWeight: 500 }}>
          Total pages
          <input type="number" min={1} value={totalPages} onChange={(e) => setTotalPages(Number(e.target.value) || 1)} style={{ display: 'block', width: '100%', padding: '0.5rem', marginTop: '0.25rem' }} />
        </label>
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
          <button type="submit" style={{ padding: '0.5rem 1rem', background: '#2563eb', color: '#fff', border: 0, borderRadius: 6 }}>Save</button>
          <button type="button" onClick={() => navigate(-1)} style={{ padding: '0.5rem 1rem', background: '#e2e8f0', border: 0, borderRadius: 6 }}>Cancel</button>
        </div>
      </form>
    </div>
  )
}
