import { View, Text, StyleSheet } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
  },
  header: {
    borderBottom: '1pt solid #d1d5db',
    paddingBottom: 8,
    marginBottom: 8,
  },
  title: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  headerMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  metaBlock: {
    flexDirection: 'column',
    gap: 2,
  },
  metaText: {
    fontSize: 8,
    color: '#4b5563',
  },
  table: {
    border: '1pt solid #d1d5db',
    borderBottom: 0,
  },
  row: {
    flexDirection: 'row',
    borderBottom: '1pt solid #e5e7eb',
    minHeight: 18,
    alignItems: 'center',
  },
  headerRow: {
    backgroundColor: '#f3f4f6',
    minHeight: 20,
  },
  cell: {
    paddingTop: 3,
    paddingBottom: 3,
    paddingLeft: 6,
    paddingRight: 6,
    fontSize: 8,
    color: '#111827',
    borderRight: '1pt solid #e5e7eb',
  },
  lastCell: {
    borderRight: 0,
  },
  headerCellText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#374151',
  },
  rightText: {
    textAlign: 'right',
  },
  colPo: {
    width: '22%',
  },
  colDate: {
    width: '28%',
  },
  colQty: {
    width: '20%',
  },
  colTotal: {
    width: '30%',
  },
  totalsSection: {
    marginTop: 10,
    marginLeft: 'auto',
    width: 210,
    border: '1pt solid #d1d5db',
  },
  totalRow: {
    flexDirection: 'row',
    borderBottom: '1pt solid #e5e7eb',
  },
  totalLabel: {
    width: '55%',
    paddingTop: 5,
    paddingBottom: 5,
    paddingLeft: 8,
    paddingRight: 8,
    fontSize: 8,
    color: '#374151',
  },
  totalValue: {
    width: '45%',
    paddingTop: 5,
    paddingBottom: 5,
    paddingLeft: 8,
    paddingRight: 8,
    fontSize: 9,
    fontWeight: 'bold',
    textAlign: 'right',
    color: '#111827',
  },
  pageFooter: {
    marginTop: 'auto',
    borderTop: '1pt solid #e5e7eb',
    paddingTop: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 8,
    color: '#6b7280',
  },
})

function formatDate(dateValue) {
  if (!dateValue) return '—'
  const date = new Date(dateValue)
  if (Number.isNaN(date.getTime())) return String(dateValue)
  return date.toLocaleDateString('fr-FR')
}

export default function BookReportPageContent({
  book,
  rows,
  generatedAt,
  pageNumber,
  pageCount,
  showTotals,
  grandTotals,
}) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Book Purchase Orders Report</Text>
        <View style={styles.headerMeta}>
          <View style={styles.metaBlock}>
            <Text style={styles.metaText}>Book: {book.name}</Text>
            <Text style={styles.metaText}>Owner: {book.ownerName || '—'}</Text>
          </View>
          <View style={styles.metaBlock}>
            <Text style={styles.metaText}>Generated: {formatDate(generatedAt)}</Text>
            <Text style={styles.metaText}>Page: {pageNumber}/{pageCount}</Text>
          </View>
        </View>
      </View>

      <View style={styles.table}>
        <View style={[styles.row, styles.headerRow]}>
          <View style={[styles.cell, styles.colPo]}>
            <Text style={styles.headerCellText}>O Number</Text>
          </View>
          <View style={[styles.cell, styles.colDate]}>
            <Text style={styles.headerCellText}>Date</Text>
          </View>
          <View style={[styles.cell, styles.colQty]}>
            <Text style={[styles.headerCellText, styles.rightText]}>Qty</Text>
          </View>
          <View style={[styles.cell, styles.colTotal, styles.lastCell]}>
            <Text style={[styles.headerCellText, styles.rightText]}>Total (MAD)</Text>
          </View>
        </View>

        {rows.map((row) => (
          <View key={row.id} style={styles.row}>
            <View style={[styles.cell, styles.colPo]}>
              <Text>{row.type} #{row.poNumber}</Text>
            </View>
            <View style={[styles.cell, styles.colDate]}>
              <Text>{formatDate(row.date)}</Text>
            </View>
            <View style={[styles.cell, styles.colQty]}>
              <Text style={styles.rightText}>{row.type === 'P' ? '—' : row.qty.toLocaleString()}</Text>
            </View>
            <View style={[styles.cell, styles.colTotal, styles.lastCell]}>
              <Text style={styles.rightText}>{row.total.toFixed(2)}</Text>
            </View>
          </View>
        ))}
      </View>

      {showTotals && (
        <View style={styles.totalsSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Grand Total Qty</Text>
            <Text style={styles.totalValue}>{grandTotals.qty.toLocaleString()}</Text>
          </View>
          <View style={[styles.totalRow, { borderBottom: 0 }]}>
            <Text style={styles.totalLabel}>Grand Total Amount (MAD)</Text>
            <Text style={styles.totalValue}>{grandTotals.total.toFixed(2)}</Text>
          </View>
        </View>
      )}

      <View style={styles.pageFooter}>
        <Text style={styles.footerText}>{book.name}</Text>
        <Text style={styles.footerText}>Book report</Text>
      </View>
    </View>
  )
}
