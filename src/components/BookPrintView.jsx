import { useMemo, useState } from 'react'
import { BlobProvider } from '@react-pdf/renderer'
import { Download, RefreshCw, Loader2 } from 'lucide-react'
import Button from './ui/Button'
import BookReportDocument from './BookPDF/BookReportDocument'

export default function BookPrintView({ book, orders }) {
  const [iframeKey, setIframeKey] = useState(0)

  const fileName = useMemo(() => {
    const cleanBookName = (book?.name || 'book').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
    return `${cleanBookName || 'book'}-report.pdf`
  }, [book?.name])

  if (!book) return <p>Loading…</p>

  return (
    <BlobProvider document={<BookReportDocument book={book} orders={orders || []} />}>
      {({ url, loading, error }) => {
        if (error) {
          return (
            <div className="no-print p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
              Failed to generate PDF: {error.message}
            </div>
          )
        }

        return (
          <>
            <div className="no-print flex items-center gap-3 mb-6 max-w-6xl mx-auto px-4 sm:px-6">
              {!loading && url ? (
                <>
                  <a
                    href={url}
                    download={fileName}
                    className="inline-flex items-center gap-2 px-4 py-2 text-white rounded-lg font-medium transition-all hover:opacity-90 hover:shadow-md active:scale-[0.98]"
                    style={{
                      backgroundColor: book.color,
                      boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                      alignItems: 'center',
                      lineHeight: 1,
                      color: '#ffffff',
                    }}
                  >
                    <Download className="w-4 h-4" style={{ display: 'inline-block', verticalAlign: 'middle' }} />
                    <span style={{ display: 'inline-block', verticalAlign: 'middle', lineHeight: 1 }}>Download PDF</span>
                  </a>
                  <Button
                    variant="secondary"
                    icon={RefreshCw}
                    onClick={() => setIframeKey((k) => k + 1)}
                  >
                    Refresh
                  </Button>
                </>
              ) : (
                <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-600 rounded-lg">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating PDF…
                </div>
              )}
            </div>

            <div
              className="mx-auto border border-gray-200 rounded-xl overflow-hidden bg-gray-50 shadow-sm"
              style={{ width: '100%', maxWidth: '980px' }}
            >
              {loading ? (
                <div className="flex flex-col items-center justify-center py-16 text-gray-500">
                  <Loader2 className="w-8 h-8 animate-spin mb-3" />
                  <p>Generating preview…</p>
                </div>
              ) : url ? (
                <iframe
                  key={iframeKey}
                  src={url}
                  title="Book Report Preview"
                  className="w-full"
                  style={{ height: '980px', border: 'none' }}
                />
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-gray-500">
                  <p>Unable to load preview.</p>
                </div>
              )}
            </div>
          </>
        )
      }}
    </BlobProvider>
  )
}
