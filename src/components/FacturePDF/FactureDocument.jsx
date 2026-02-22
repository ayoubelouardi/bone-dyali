import { Document, Page, StyleSheet, Font } from '@react-pdf/renderer'
import FacturePageContent from './FacturePageContent.jsx'

// Register Amiri font from CDN for Arabic + Latin support
Font.register({
  family: 'Amiri',
  fonts: [
    {
      src: 'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/amiri/Amiri-Regular.ttf',
      fontWeight: 'normal',
    },
    {
      src: 'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/amiri/Amiri-Bold.ttf',
      fontWeight: 'bold',
    },
  ],
})

const styles = StyleSheet.create({
  page: {
    width: '105mm',
    height: '148mm',
    padding: 0,
    backgroundColor: '#faf8f5',
    fontFamily: 'Amiri',
  },
})

export default function FactureDocument({ book, po }) {
  if (!book || !po) return null

  return (
    <Document>
      <Page size={{ width: '105mm', height: '148mm' }} style={styles.page} wrap={false}>
        <FacturePageContent book={book} po={po} />
      </Page>
    </Document>
  )
}
