import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import { ToastProvider } from './components/ui/Toast'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Dashboard from './pages/Dashboard'
import BookForm from './pages/BookForm'
import BookDetail from './pages/BookDetail'
import PurchaseOrder from './pages/PurchaseOrder'
import Facture from './pages/Facture'
import BookPrint from './pages/BookPrint'
import Login from './pages/Login'
import Settings from './pages/Settings'
import WorkspaceChoice from './pages/WorkspaceChoice'

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading, needsWorkspaceChoice } = useAuth()
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (needsWorkspaceChoice) {
    return <Navigate to="/workspace-choice" replace />
  }

  return children
}

const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth()
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  return children
}

const WorkspaceChoiceRoute = ({ children }) => {
  const { isAuthenticated, loading, needsWorkspaceChoice } = useAuth()
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (!needsWorkspaceChoice) {
    return <Navigate to="/" replace />
  }

  return children
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={
        <PublicRoute>
          <Login />
        </PublicRoute>
      } />
      <Route path="/workspace-choice" element={
        <WorkspaceChoiceRoute>
          <WorkspaceChoice />
        </WorkspaceChoiceRoute>
      } />
      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<Dashboard />} />
        <Route path="settings" element={<Settings />} />
        <Route path="book/new" element={<BookForm />} />
        <Route path="book/:bookId" element={<BookDetail />} />
        <Route path="book/:bookId/po/new" element={<PurchaseOrder />} />
        <Route path="book/:bookId/po/:poId/edit" element={<PurchaseOrder />} />
        <Route path="book/:bookId/po/:poId" element={<Facture />} />
        <Route path="book/:bookId/po/:poId/print" element={<Facture />} />
        <Route path="book/:bookId/print" element={<BookPrint />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </ToastProvider>
  )
}
