import { Document, Page, StyleSheet } from '@react-pdf/renderer'
import BookReportPageContent from './BookReportPageContent'

const ROWS_PER_PAGE = 42

const styles = StyleSheet.create({
  page: {
    paddingTop: 24,
    paddingRight: 24,
    paddingBottom: 20,
    paddingLeft: 24,
    backgroundColor: '#ffffff',
    fontFamily: 'Helvetica',
  },
})

function chunkRows(rows, chunkSize) {
  if (!rows.length) return [[]]
  const chunks = []
  for (let i = 0; i < rows.length; i += chunkSize) {
    chunks.push(rows.slice(i, i + chunkSize))
  }
  return chunks
}

export default function BookReportDocument({ book, orders }) {
  if (!book) return null

  const rows = (orders || []).map((po) => {
    const type = po.type === 'OR' ? 'OR' : po.type === 'P' ? 'P' : 'O'
    const qty = type === 'P'
      ? 0
      : (po.lineItems || []).reduce((sum, item) => sum + (Number(item.quantity) || 0), 0)
    const total = (po.lineItems || []).reduce((sum, item) => {
      if (type === 'P') {
        return sum + (Number(item.amount ?? item.unitPrice) || 0)
      }
      const quantity = Number(item.quantity) || 0
      const unitPrice = Number(item.unitPrice) || 0
      return sum + quantity * unitPrice
    }, 0)

    const signedQty = type === 'OR' ? -qty : qty
    const signedTotal = type === 'O' ? total : -total

    return {
      id: po.id,
      type,
      poNumber: po.poNumber,
      date: po.date || '—',
      qty: signedQty,
      total: signedTotal,
    }
  })

  const grandTotals = rows.reduce(
    (acc, row) => ({
      qty: acc.qty + row.qty,
      total: acc.total + row.total,
    }),
    { qty: 0, total: 0 }
  )

  const pageChunks = chunkRows(rows, ROWS_PER_PAGE)
  const generatedAt = new Date().toISOString()

  return (
    <Document>
      {pageChunks.map((chunk, index) => (
        <Page key={`book-report-page-${index + 1}`} size="A4" style={styles.page}>
          <BookReportPageContent
            book={book}
            rows={chunk}
            generatedAt={generatedAt}
            pageNumber={index + 1}
            pageCount={pageChunks.length}
            showTotals={index === pageChunks.length - 1}
            grandTotals={grandTotals}
          />
        </Page>
      ))}
    </Document>
  )
}
