import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Check } from 'lucide-react'
import { useBooks } from '../hooks/useBooks'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'

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
    <div className="max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" icon={ArrowLeft} onClick={() => navigate(-1)}>
          Back
        </Button>
      </div>

      <Card>
        <h1 className="text-xl font-bold text-gray-900 mb-6">Create New Book</h1>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Book name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. 2024 Orders"
            required
          />
          
          <Input
            label="Owner name (on invoice)"
            value={ownerName}
            onChange={(e) => setOwnerName(e.target.value)}
            placeholder="Company / owner name"
          />
          
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Color
            </label>
            <div className="flex flex-wrap gap-2">
              {INK_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`
                    w-10 h-10 rounded-lg transition-all duration-150
                    ${color === c 
                      ? 'ring-2 ring-offset-2 ring-gray-900 scale-110' 
                      : 'hover:scale-105'
                    }
                  `}
                  style={{ backgroundColor: c }}
                  title={c}
                >
                  {color === c && <Check className="w-5 h-5 text-white mx-auto" />}
                </button>
              ))}
            </div>
          </div>
          
          <Input
            label="Total pages"
            type="number"
            min={1}
            value={totalPages}
            onChange={(e) => setTotalPages(Number(e.target.value) || 1)}
          />
          
          <div className="flex gap-3 pt-4">
            <Button type="submit" variant="primary">
              Create Book
            </Button>
            <Button type="button" variant="secondary" onClick={() => navigate(-1)}>
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
