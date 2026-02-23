import { Outlet, Link } from 'react-router-dom'
import { useEffect } from 'react'

export default function Layout() {
  useEffect(() => {
    const updatePadding = () => {
      const main = document.querySelector('main')
      if (main) {
        main.style.padding = window.innerWidth <= 640 ? '0.75rem' : '1.5rem'
      }
    }
    updatePadding()
    window.addEventListener('resize', updatePadding)
    return () => window.removeEventListener('resize', updatePadding)
  }, [])

  return (
    <div className="no-print">
      <header style={headerStyle}>
        <Link to="/" style={logoStyle}>Bone Dyali</Link>
      </header>
      <main style={mainStyle}>
        <Outlet />
      </main>
    </div>
  )
}

const headerStyle = {
  padding: '0.75rem 1rem',
  background: '#1e293b',
  color: '#f8fafc',
}

const logoStyle = {
  color: 'inherit',
  fontWeight: 700,
  textDecoration: 'none',
}

const mainStyle = {
  maxWidth: 960,
  margin: '0 auto',
  padding: '1.5rem',
}
