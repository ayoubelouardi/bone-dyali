import { Outlet, Link } from 'react-router-dom'
import { BookOpen } from 'lucide-react'

export default function Layout() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Sticky Header */}
      <header style={{ position: 'sticky', top: 0, zIndex: 200, backgroundColor: '#1e293b', color: '#ffffff', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
        <div style={{ maxWidth: '64rem', margin: '0 auto', padding: '0 1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '3.5rem' }}>
            <Link
              to="/"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, fontSize: '1.125rem', color: '#ffffff', textDecoration: 'none' }}
            >
              <BookOpen style={{ width: 24, height: 24 }} />
              <span>Bone Dyali</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ flex: 1 }}>
        <div style={{ maxWidth: '64rem', margin: '0 auto', padding: '1.5rem' }}>
          <Outlet />
        </div>
      </main>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid #e5e7eb', backgroundColor: '#ffffff', padding: '1rem 0' }}>
        <div style={{ maxWidth: '64rem', margin: '0 auto', padding: '0 1.5rem', textAlign: 'center', fontSize: '0.875rem', color: '#6b7280' }}>
          Bone Dyali — Purchase Order Manager
        </div>
      </footer>
    </div>
  )
}
