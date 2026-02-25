# Copilot Instructions

## Build & Dev Commands

```bash
npm run dev       # Start dev server (localhost:5173)
npm run build     # Production build → dist/
npm run preview   # Preview production build
npm run expose    # Dev server with --host (LAN access)
```

No test runner or linter is configured.

## Architecture

**bone-dyali** is a 100% client-side SPA — no backend, no auth, no network calls at runtime (except loading the Amiri font from a CDN for PDF generation).

**Data flow:**
```
lib/storage.js  ←→  localStorage
     ↑
hooks/ (useBooks, usePurchaseOrders)   ← React state wrappers around storage
     ↑
pages/ + components/                   ← consume hooks
```

**Routing** (React Router v7, all under the `<Layout>` shell):
- `/` — Dashboard (book list)
- `/book/new` — BookForm (create)
- `/book/:bookId` — BookDetail (PO list)
- `/book/:bookId/po/new` — PurchaseOrder (create)
- `/book/:bookId/po/:poId/edit` — PurchaseOrder (edit, blocked if `po.locked`)
- `/book/:bookId/po/:poId` — Facture (PDF view)
- `/book/:bookId/po/:poId/print` — same Facture component

**PDF generation:** `@react-pdf/renderer` renders factures client-side as an A6 PDF (105×148 mm) using the Amiri font (Arabic + Latin). `FactureView` uses `BlobProvider` to stream the PDF into an `<iframe>`. The PDF document itself lives in `src/components/FacturePDF/`.

**Export/Import:** `lib/exportImport.js` serialises all books and POs to a single JSON file for backup/restore. Import fully replaces existing data.

## Storage

localStorage keys:
- `bone_dyali_books` — array of all Book objects
- `bone_dyali_po_{bookId}` — array of PO objects for that book

All CRUD goes through `lib/storage.js`. Hooks re-read from storage after every mutation (no optimistic updates, no derived cache).

## Key Data Model Details

**Book:** `{ id, name, ownerName, color, totalPages, createdAt, nextPoNumber }`
- `nextPoNumber` increments on every `createPurchaseOrder` call; gaps are not reused.
- `color` (hex) propagates to UI accents and the PDF header.

**PurchaseOrder:** `{ id, bookId, poNumber, date, client: {name, address, extra}, lineItems: [{description, quantity, unitPrice, code}], locked, createdAt, updatedAt }`
- `locked: true` prevents edits; `updatePurchaseOrder` throws if locked.
- `lineTotal = quantity * unitPrice` is always derived, never stored. No tax.

## Conventions

- **All CRUD logic lives in `lib/storage.js`.** Hooks and components never write to localStorage directly.
- **Hooks are thin wrappers:** they call storage functions then refresh state with a full re-read (`setBooks(storage.getBooks())`).
- **UI components** live in `src/components/ui/` (Button, Card, Input, Modal, Badge, Breadcrumbs, Toast). Use these before creating new primitives.
- **Button** accepts `variant` (`primary` | `secondary` | `danger` | `ghost` | `success`), `size` (`sm` | `md` | `lg`), `icon` (Lucide component), `loading`. It applies both Tailwind classes and inline styles for reliability — keep both in sync when modifying it.
- **Toast notifications** are provided via `ToastProvider` / `useToast()` context (wraps the entire app in `App.jsx`).
- **Icons:** use `lucide-react` exclusively.
- **Tailwind v4** is configured via `@tailwindcss/postcss`. Custom theme tokens: `primary` colour scale, `font-sans` (Inter), and `shadow-card` / `shadow-card-hover` / `shadow-dropdown`.
- **`no-print` class** hides elements from print/PDF output. The facture page applies this to nav and toolbar.
- **Bilingual labels (EN/AR):** Arabic text in the facture uses the Amiri font and `dir="rtl"` scoping. Keep bilingual pairs together when editing `FacturePageContent.jsx`.
