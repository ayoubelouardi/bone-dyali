import { View, Text, StyleSheet } from '@react-pdf/renderer'

const mmToPt = (mm) => mm * 2.83465

const pageWidthPt = mmToPt(105)
const pageHeightPt = mmToPt(148)

const styles = StyleSheet.create({
  container: {
    width: pageWidthPt,
    height: pageHeightPt,
    flexDirection: 'column',
  },
  // Top yellow-green strip (like binding strip)
  topStrip: {
    height: mmToPt(4),
    backgroundColor: '#c9d46c',
    borderBottom: '0.5pt solid #b5c258',
  },
  // Inner content area with margins
  inner: {
    margin: `${mmToPt(6)}pt ${mmToPt(7)}pt ${mmToPt(7)}pt ${mmToPt(7)}pt`,
    padding: `${mmToPt(4)}pt ${mmToPt(5)}pt`,
    border: '0.5pt solid #1e3a5f',
    backgroundColor: '#faf8f5',
    flex: 1,
    flexDirection: 'column',
  },
  // Header row: Facture info left, Owner box right
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: mmToPt(3),
  },
  headerLeft: {
    flexDirection: 'column',
  },
  factureTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#b91c1c',
    marginBottom: 2,
  },
  factureMeta: {
    fontSize: 9,
    color: '#1a1a1a',
    marginTop: 1,
  },
  nLabel: {
    color: '#b91c1c',
    fontWeight: 'bold',
  },
  ownerBox: {
    backgroundColor: '#e8e6a0',
    border: '0.5pt solid #d4d078',
    padding: `${mmToPt(2)}pt ${mmToPt(4)}pt`,
    minWidth: mmToPt(25),
    textAlign: 'center',
  },
  ownerName: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#2d2d2d',
  },
  ownerPhone: {
    fontSize: 7,
    fontWeight: 'bold',
    color: '#2d2d2d',
    marginTop: 1,
  },
  // Client block (RTL)
  clientBlock: {
    marginTop: mmToPt(2),
    marginBottom: mmToPt(2),
    paddingVertical: mmToPt(1.5),
    borderBottom: '0.5pt solid #a8c5e0',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  clientLabel: {
    fontSize: 8,
    color: '#1a1a1a',
  },
  clientName: {
    fontSize: 9,
    fontWeight: 'bold',
    marginRight: mmToPt(1.5),
  },
  clientAddress: {
    fontSize: 8,
    color: '#1a1a1a',
    marginBottom: mmToPt(2),
    textAlign: 'right',
  },
  // Table
  table: {
    marginTop: mmToPt(2),
    flexDirection: 'column',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#5b8fb9',
  },
  tableHeaderCell: {
    padding: `${mmToPt(1.5)}pt ${mmToPt(2)}pt`,
    border: '0.5pt solid #1e3a5f',
    textAlign: 'center',
  },
  tableHeaderText: {
    fontSize: 7,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  tableRow: {
    flexDirection: 'row',
  },
  tableCell: {
    padding: `${mmToPt(1.5)}pt ${mmToPt(2)}pt`,
    borderLeft: '0.5pt solid #1e3a5f',
    borderRight: '0.5pt solid #1e3a5f',
    borderBottom: '0.5pt solid #a8c5e0',
    textAlign: 'center',
  },
  tableCellText: {
    fontSize: 8,
    color: '#1a1a1a',
  },
  emptyRowDots: {
    fontSize: 8,
    color: '#a8c5e0',
    textAlign: 'center',
  },
  // Column widths (must sum to ~100%)
  colQty: { width: '12%' },
  colDesc: { width: '36%' },
  colCode: { width: '18%' },
  colPrice: { width: '17%' },
  colAmount: { width: '17%' },
  // Footer
  footer: {
    marginTop: 'auto',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingTop: mmToPt(3),
  },
  totalLabel: {
    backgroundColor: '#e8e6a0',
    border: '0.5pt solid #d4d078',
    padding: `${mmToPt(1.5)}pt ${mmToPt(3)}pt`,
    fontSize: 9,
    fontWeight: 'bold',
  },
  totalAmount: {
    fontSize: 11,
    fontWeight: 'bold',
    marginLeft: mmToPt(2),
  },
})

export default function FacturePageContent({ book, po }) {
  const orderTotal = (po?.lineItems || []).reduce(
    (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0),
    0
  )

  return (
    <View style={styles.container}>
      {/* Top binding strip */}
      <View style={styles.topStrip} />

      {/* Main content box */}
      <View style={styles.inner}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.factureTitle}>Facture</Text>
            <Text style={styles.factureMeta}>
              <Text style={styles.nLabel}>N°</Text> {po.poNumber}
            </Text>
            <Text style={styles.factureMeta}>Date {po.date}</Text>
          </View>
          <View style={styles.ownerBox}>
            <Text style={styles.ownerName}>{book.ownerName || book.name}</Text>
            {book.ownerPhone && (
              <Text style={styles.ownerPhone}>{book.ownerPhone}</Text>
            )}
          </View>
        </View>

        {/* Client block (RTL) */}
        <View style={styles.clientBlock}>
          <Text style={styles.clientName}>{po.client?.name || '—'}</Text>
          <Text style={styles.clientLabel}>Messrs. / المطلوب من </Text>
        </View>
        {po.client?.address && (
          <Text style={styles.clientAddress}>{po.client.address}</Text>
        )}

        {/* Table */}
        <View style={styles.table}>
          {/* Header */}
          <View style={styles.tableHeader}>
            <View style={[styles.tableHeaderCell, styles.colQty]}>
              <Text style={styles.tableHeaderText}>الكمية{'\n'}QTY</Text>
            </View>
            <View style={[styles.tableHeaderCell, styles.colDesc]}>
              <Text style={styles.tableHeaderText}>الشرح{'\n'}DESCRIPTION</Text>
            </View>
            <View style={[styles.tableHeaderCell, styles.colCode]}>
              <Text style={styles.tableHeaderText}>كود البضاعة{'\n'}CODE</Text>
            </View>
            <View style={[styles.tableHeaderCell, styles.colPrice]}>
              <Text style={styles.tableHeaderText}>السعر{'\n'}Price</Text>
            </View>
            <View style={[styles.tableHeaderCell, styles.colAmount]}>
              <Text style={styles.tableHeaderText}>المجموع{'\n'}Amount</Text>
            </View>
          </View>

          {/* Body */}
          {Array.from({ length: 8 }, (_, i) => {
            const item = po.lineItems?.[i]
            return (
              <View key={i} style={styles.tableRow}>
                <View style={[styles.tableCell, styles.colQty]}>
                  {item ? (
                    <Text style={styles.tableCellText}>{item.quantity}</Text>
                  ) : (
                    <Text style={styles.emptyRowDots}>.....</Text>
                  )}
                </View>
                <View style={[styles.tableCell, styles.colDesc]}>
                  {item ? (
                    <Text style={styles.tableCellText}>{item.description}</Text>
                  ) : (
                    <Text style={styles.emptyRowDots}>........................</Text>
                  )}
                </View>
                <View style={[styles.tableCell, styles.colCode]}>
                  {item ? (
                    <Text style={styles.tableCellText}>{item.code}</Text>
                  ) : (
                    <Text style={styles.emptyRowDots}>.............</Text>
                  )}
                </View>
                <View style={[styles.tableCell, styles.colPrice]}>
                  {item ? (
                    <Text style={styles.tableCellText}>{Number(item.unitPrice).toFixed(2)}</Text>
                  ) : (
                    <Text style={styles.emptyRowDots}>.............</Text>
                  )}
                </View>
                <View style={[styles.tableCell, styles.colAmount]}>
                  {item ? (
                    <Text style={styles.tableCellText}>
                      {((Number(item.quantity) || 0) * (Number(item.unitPrice) || 0)).toFixed(2)}
                    </Text>
                  ) : (
                    <Text style={styles.emptyRowDots}>..........</Text>
                  )}
                </View>
              </View>
            )
          })}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.totalLabel}>المجموع</Text>
          <Text style={styles.totalAmount}>{orderTotal.toFixed(2)} $</Text>
        </View>
      </View>
    </View>
  )
}
