import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import BookForm from './pages/BookForm'
import BookDetail from './pages/BookDetail'
import PurchaseOrder from './pages/PurchaseOrder'
import Facture from './pages/Facture'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="book/new" element={<BookForm />} />
        <Route path="book/:bookId" element={<BookDetail />} />
        <Route path="book/:bookId/po/new" element={<PurchaseOrder />} />
        <Route path="book/:bookId/po/:poId/edit" element={<PurchaseOrder />} />
        <Route path="book/:bookId/po/:poId" element={<Facture />} />
        <Route path="book/:bookId/po/:poId/print" element={<Facture />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
