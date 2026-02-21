import { Outlet, Link } from 'react-router-dom'

export default function Layout() {
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
  padding: '0.75rem 1.5rem',
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
