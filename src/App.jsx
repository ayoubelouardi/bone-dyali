import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import { ToastProvider } from './components/ui/Toast'
import Dashboard from './pages/Dashboard'
import BookForm from './pages/BookForm'
import BookDetail from './pages/BookDetail'
import PurchaseOrder from './pages/PurchaseOrder'
import Facture from './pages/Facture'
import BookPrint from './pages/BookPrint'

export default function App() {
  return (
    <ToastProvider>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
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
    </ToastProvider>
  )
}
