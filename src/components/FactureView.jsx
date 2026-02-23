import { useState } from 'react'
import { BlobProvider } from '@react-pdf/renderer'
import FactureDocument from './FacturePDF/FactureDocument.jsx'

export default function FactureView({ book, po }) {
  const [iframeKey, setIframeKey] = useState(0)

  if (!book || !po) return <p>Loading…</p>

  const fileName = `po-${po.poNumber}.pdf`

  return (
    <BlobProvider document={<FactureDocument book={book} po={po} />}>
      {({ url, loading, error }) => {
        if (error) {
          return (
            <div className="no-print" style={{ padding: '1rem', color: '#dc2626' }}>
              Failed to generate PDF: {error.message}
            </div>
          )
        }

        return (
          <>
            {/* Toolbar */}
            <div className="no-print" style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
              {!loading && url ? (
                <>
                  <a
                    href={url}
                    download={fileName}
                    style={{ padding: '0.5rem 1rem', background: book.color, color: '#fff', border: 0, borderRadius: 6, textDecoration: 'none', display: 'inline-block', minHeight: 44 }}
                  >
                    Download PDF
                  </a>
                  <button
                    type="button"
                    onClick={() => setIframeKey(k => k + 1)}
                    style={{ padding: '0.5rem 1rem', background: '#64748b', color: '#fff', border: 0, borderRadius: 6, minHeight: 44 }}
                  >
                    Refresh Preview
                  </button>
                </>
              ) : (
                <span style={{ padding: '0.5rem 1rem', background: '#e5e7eb', color: '#374151', borderRadius: 6 }}>
                  Generating PDF…
                </span>
              )}
            </div>

            {/* PDF Preview via iframe */}
            <div
              style={{
                width: '100%',
                maxWidth: window.innerWidth <= 768 ? '100%' : '420px',
                margin: '0 auto',
                border: '1px solid #d1d5db',
                borderRadius: 8,
                overflow: 'hidden',
                background: '#f3f4f6',
              }}
            >
              {loading ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
                  Generating preview…
                </div>
              ) : url ? (
                <iframe
                  key={iframeKey}
                  src={url}
                  title="Facture Preview"
                  style={{
                    width: '100%',
                    height: '594px',
                    border: 0,
                  }}
                />
              ) : (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
                  Unable to load preview.
                </div>
              )}
            </div>
          </>
        )
      }}
    </BlobProvider>
  )
}
