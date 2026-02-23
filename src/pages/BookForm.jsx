import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBooks } from '../hooks/useBooks'

const DEFAULT_COLOR = '#3b5b8c'

const INK_COLORS = [
  '#9e3a3a', // Red
  '#b8a54a', // Yellow
  '#3b5b8c', // Blue
  '#b87333', // Orange (Red+Yellow)
  '#3c7a5a', // Green (Yellow+Blue)
  '#6b5a8b', // Purple (Red+Blue)
  '#c4a35a', // Yellow-Orange
  '#a0522d', // Red-Orange
  '#556b2f', // Yellow-Green
  '#4a7b7b', // Teal (Blue+Green)
  '#7b3f4a', // Red-Purple
  '#5a4a8b', // Blue-Purple
  '#b76e79', // Pink
  '#8b7355', // Brown
  '#6b3030', // Maroon
  '#6b6b4a', // Olive
]

const colorSwatchStyle = (isSelected) => ({
  width: 32,
  height: 32,
  borderRadius: 6,
  cursor: 'pointer',
  border: isSelected ? '3px solid #1a1a1a' : '1px solid #d1d5db',
  boxShadow: isSelected ? '0 0 0 2px #fff' : 'none',
  marginRight: 8,
})

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
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: '0.5rem' }}>
            {INK_COLORS.map((c) => (
              <div
                key={c}
                onClick={() => setColor(c)}
                style={{
                  ...colorSwatchStyle(color === c),
                  backgroundColor: c,
                }}
                title={c}
              />
            ))}
          </div>
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
