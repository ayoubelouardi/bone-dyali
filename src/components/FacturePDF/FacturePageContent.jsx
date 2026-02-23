import { View, Text, StyleSheet } from '@react-pdf/renderer'

const mmToPt = (mm) => mm * 2.83465

const pageWidthPt = mmToPt(105)
const pageHeightPt = mmToPt(148)

const DEFAULT_COLOR = '#2563eb'

const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null
}

const rgbToHex = (r, g, b) => {
  return '#' + [r, g, b].map(x => {
    const hex = Math.max(0, Math.min(255, Math.round(x))).toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }).join('')
}

const lighten = (hex, amount) => {
  const rgb = hexToRgb(hex)
  if (!rgb) return hex
  return rgbToHex(
    rgb.r + (255 - rgb.r) * amount,
    rgb.g + (255 - rgb.g) * amount,
    rgb.b + (255 - rgb.b) * amount
  )
}

const darken = (hex, amount) => {
  const rgb = hexToRgb(hex)
  if (!rgb) return hex
  return rgbToHex(
    rgb.r * (1 - amount),
    rgb.g * (1 - amount),
    rgb.b * (1 - amount)
  )
}

const getTextColor = (bgColor) => {
  const rgb = hexToRgb(bgColor)
  if (!rgb) return '#ffffff'
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255
  return luminance > 0.5 ? '#1a1a1a' : '#ffffff'
}

const createStyles = (accent) => {
  const accentDark = darken(accent, 0.3)
  const accentLight = lighten(accent, 0.4)
  const accentLighter = lighten(accent, 0.7)
  const textOnAccent = getTextColor(accent)

  return StyleSheet.create({
    container: {
      width: pageWidthPt,
      height: pageHeightPt,
      flexDirection: 'column',
    },
    topStrip: {
      height: mmToPt(4),
      backgroundColor: accent,
      borderBottom: `0.5pt solid ${accentDark}`,
    },
    inner: {
      margin: `${mmToPt(6)}pt ${mmToPt(7)}pt ${mmToPt(7)}pt ${mmToPt(7)}pt`,
      padding: `${mmToPt(4)}pt ${mmToPt(5)}pt`,
      border: `0.5pt solid ${accentDark}`,
      backgroundColor: '#faf8f5',
      flex: 1,
      flexDirection: 'column',
    },
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
      color: accent,
      marginBottom: 2,
    },
    factureMeta: {
      fontSize: 9,
      color: '#1a1a1a',
      marginTop: 1,
    },
    nLabel: {
      color: accent,
      fontWeight: 'bold',
    },
    ownerBox: {
      backgroundColor: accentLighter,
      border: `0.5pt solid ${accentLight}`,
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
    clientBlock: {
      marginTop: mmToPt(2),
      marginBottom: mmToPt(2),
      paddingVertical: mmToPt(1.5),
      borderBottom: `0.5pt solid ${accentLight}`,
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
    table: {
      marginTop: mmToPt(2),
      flexDirection: 'column',
    },
    tableHeader: {
      flexDirection: 'row',
      backgroundColor: accent,
    },
    tableHeaderCell: {
      padding: `${mmToPt(1.5)}pt ${mmToPt(2)}pt`,
      border: `0.5pt solid ${accentDark}`,
      textAlign: 'center',
    },
    tableHeaderText: {
      fontSize: 7,
      color: textOnAccent,
      fontWeight: 'bold',
    },
    tableRow: {
      flexDirection: 'row',
    },
    tableCell: {
      padding: `${mmToPt(1.5)}pt ${mmToPt(2)}pt`,
      borderLeft: `0.5pt solid ${accentDark}`,
      borderRight: `0.5pt solid ${accentDark}`,
      borderBottom: `0.5pt solid ${accentLight}`,
      textAlign: 'center',
    },
    tableCellText: {
      fontSize: 8,
      color: '#1a1a1a',
    },
    emptyRowDots: {
      fontSize: 8,
      color: accentLight,
      textAlign: 'center',
    },
    colQty: { width: '12%' },
    colDesc: { width: '36%' },
    colCode: { width: '18%' },
    colPrice: { width: '17%' },
    colAmount: { width: '17%' },
    footer: {
      marginTop: 'auto',
      flexDirection: 'row',
      justifyContent: 'flex-end',
      alignItems: 'center',
      paddingTop: mmToPt(3),
    },
    totalLabel: {
      backgroundColor: accentLighter,
      border: `0.5pt solid ${accentLight}`,
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
}

export default function FacturePageContent({ book, po }) {
  const accent = book?.color || DEFAULT_COLOR
  const styles = createStyles(accent)

  const orderTotal = (po?.lineItems || []).reduce(
    (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0),
    0
  )

  return (
    <View style={styles.container}>
      <View style={styles.topStrip} />
      <View style={styles.inner}>
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

        <View style={styles.clientBlock}>
          <Text style={styles.clientName}>{po.client?.name || '—'}</Text>
          <Text style={styles.clientLabel}>Messrs. / المطلوب من </Text>
        </View>
        {po.client?.address && (
          <Text style={styles.clientAddress}>{po.client.address}</Text>
        )}

        <View style={styles.table}>
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

        <View style={styles.footer}>
          <Text style={styles.totalLabel}>المجموع</Text>
          <Text style={styles.totalAmount}>{orderTotal.toFixed(2)} MAD</Text>
        </View>
      </View>
    </View>
  )
}
