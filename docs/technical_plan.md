# Technical Plan

**Project:** Client-Side Purchase Order Manager  
**Based on:** [Software Requirements Specification](srs.md)

---

## 1. Architecture Overview

- **Pattern:** Single-page application (SPA), 100% client-side.
- **No backend:** All logic, state, and persistence run in the browser.
- **Storage:** Web Storage API (localStorage or IndexedDB) for books, POs, and settings.
- **Print:** Browser print (window.print) with a dedicated print stylesheet; no server-side PDF generation.

---

## 2. Technology Stack

| Layer        | Choice              | Rationale                                      |
|-------------|---------------------|-------------------------------------------------|
| Framework   | React 18+           | Component-based UI, hooks, ecosystem            |
| Build       | Vite                | Fast dev server, ESM, minimal config            |
| Routing     | React Router v6     | Client-side routes (dashboard / book / PO / facture) |
| Markup      | JSX (HTML5)         | Semantic structure, form controls, accessibility |
| Styling     | CSS3 / CSS Modules  | Layout, theming, print media queries            |
| State       | React (useState, useContext) | Local + shared app state; no global store required |
| Storage     | localStorage or IndexedDB | Per SRS; IndexedDB preferred if dataset grows  |
| I18n/Layout | Bilingual (EN/AR)   | RTL support for Arabic in facture view          |

**Target browsers:** Chrome, Edge, Firefox (current versions).

---

## 3. Data Models

### 3.1 Book

```json
{
  "id": "string (UUID or slug)",
  "name": "string",
  "ownerName": "string",
  "color": "string (hex or named)",
  "totalPages": "number",
  "createdAt": "ISO8601",
  "nextPoNumber": "number"
}
```

- `nextPoNumber`: Incremented on each new PO; used for “PO Number (Incremental)”.

### 3.2 Purchase Order

```json
{
  "id": "string (UUID)",
  "bookId": "string",
  "poNumber": "number",
  "date": "ISO8601 (date only)",
  "client": {
    "name": "string",
    "address": "string",
    "extra": "string (optional)"
  },
  "lineItems": [
    {
      "description": "string",
      "quantity": "number",
      "unitPrice": "number",
      "code": "string"
    }
  ],
  "createdAt": "ISO8601"
}
```

- **Derived:** `lineTotal = quantity * unitPrice` per line; `orderTotal = sum(lineTotals)` (no TVA/tax).

### 3.3 Export/Import (Backup)

- **Export:** Single JSON file containing all books and all POs (and optionally app version for future compatibility).
- **Import:** Replace or merge (TBD) current storage with parsed JSON; validate schema before apply.

---

## 4. Storage Design

- **Option A – localStorage:** Simple key-value; one key per entity or one key for “all data”; 5–10 MB limit.
- **Option B – IndexedDB:** Better for many books/POs; structured store by `books` and `purchase_orders` (indexed by `bookId`, `poNumber`).

**Recommendation:** Start with **localStorage** (single JSON blob or one key per book) for minimal complexity; refactor to IndexedDB if needed for size or performance.

**Keys (example):**

- `bone_dyali_books` → array of Book objects
- `bone_dyali_po_{bookId}` → array of PO objects for that book  
  **or**  
- `bone_dyali_data` → `{ books: [], purchaseOrders: [] }`

---

## 5. Application Structure (File / Module Layout)

```
bone-dyali/
├── index.html              # Vite entry; root div for React
├── package.json
├── vite.config.js
├── src/
│   ├── main.jsx             # React root, StrictMode, Router
│   ├── App.jsx              # Router setup, layout shell
│   ├── index.css            # Global styles
│   ├── print.css            # Print-only facture (import in facture route or App)
│   ├── components/
│   │   ├── Layout.jsx       # Shell: nav, outlet for routes
│   │   ├── BookCard.jsx     # Single book in dashboard (color, name, link)
│   │   ├── BookForm.jsx     # Create/edit book (name, owner, color, pages)
│   │   ├── PoForm.jsx       # PO form: client, line items, totals
│   │   ├── LineItemRow.jsx  # Single line item (qty, description, code, price)
│   │   ├── FactureView.jsx  # Bilingual facture layout; print trigger
│   │   └── ...
│   ├── pages/
│   │   ├── Dashboard.jsx    # List books, "Create Book" entry
│   │   ├── BookDetail.jsx   # PO list for one book, "New PO" button
│   │   ├── PurchaseOrder.jsx # New/edit PO form
│   │   └── Facture.jsx      # Print view for one PO (or wrapper around FactureView)
│   ├── hooks/
│   │   ├── useBooks.js      # Load/save books (calls storage)
│   │   ├── usePurchaseOrders.js  # Load/save POs for a book
│   │   └── useStorage.js    # Optional: generic persistence hook
│   ├── lib/
│   │   ├── storage.js       # localStorage/IndexedDB read/write
│   │   └── exportImport.js  # JSON export/import
│   └── context/
│       └── AppContext.jsx   # Optional: shared books/current book
└── docs/
    ├── srs.md
    └── technical_plan.md
```

- **Routing:** React Router with routes such as `/`, `/book/:bookId`, `/book/:bookId/po/new`, `/book/:bookId/po/:poId`, `/book/:bookId/po/:poId/print`.

---

## 6. Feature Implementation Map

| SRS Section           | Technical Implementation |
|-----------------------|--------------------------|
| **2.1 Dashboard**     | `Dashboard.jsx`: list books via `useBooks`; “Create Book” links to form or modal; persist via `lib/storage.js`. |
| **2.1 Create Book**   | `BookForm.jsx`: name, ownerName, color (picker), totalPages; validate; save via storage; navigate to book detail. |
| **2.1 Book color**    | `BookCard.jsx` (and book detail): use `book.color` for border/background. |
| **2.1 Book navigation** | `BookDetail.jsx`: route `/book/:bookId`; load POs with `usePurchaseOrders(bookId)`; "New PO" → `/book/:bookId/po/new`. |
| **2.2 PO creation**   | `PoForm.jsx`: auto-fill PO number from book, current date; client fields; dynamic line items (add/remove rows). |
| **2.2 Calculations**  | In `PoForm.jsx` or `LineItemRow.jsx`: compute line total and order total on input (useState/useMemo); no TVA. |
| **2.3 Local persistence** | `lib/storage.js`: read/write books and POs; consumed by hooks `useBooks`, `usePurchaseOrders`. |
| **2.3 Archive**       | On save in `PoForm.jsx`: append PO via storage; increment `book.nextPoNumber` in storage. |
| **2.3 Export**        | `lib/exportImport.js`: serialize all books + POs to JSON; trigger download (e.g. from Dashboard or Layout). |
| **2.3 Import**        | File input (Dashboard or settings): parse JSON → validate → replace/merge storage; invalidate hooks / navigate. |
| **2.4 Facture print**  | `FactureView.jsx` (or `Facture.jsx`): render facture from PO + book; `print.css` hides nav/buttons; RTL + bilingual labels; "Print" calls `window.print()`. |
| **2.4 Layout (header)** | Invoice number (EN/AR), date (EN/AR), prominent owner box (مربع اسم مالك الفاتورة), client (Messrs. / المطلوب من السادة). |
| **2.4 Table**         | Columns: QTY/العدد, DESCRIPTION/نوع البضاعة, CODE/كود البضاعة, UNIT PRICE/الثمن, AMOUNT/الثمن الكلي; footer row TOTAL/المجموع. |
| **3 Technical**       | No server; React + Vite; Web Storage API. |
| **4 UI**              | Book color in UI; responsive layout optimized for desktop and print. |

---

## 7. Print (Facture) Implementation

1. **Template:** React component `FactureView.jsx` (or `Facture.jsx`) renders a container (e.g. `id="facture-print"` or class `facture-print`) with:
   - Header: invoice number, date, owner box, client name
   - Table: line items + totals
   - Bilingual labels as per SRS
2. **Data:** Facture page reads `bookId` and `poId` from route params; loads book + PO via hooks or context; passes to `FactureView`.
3. **RTL:** Apply `dir="rtl"` (or a class) to Arabic sections; keep layout correct for mixed EN/AR.
4. **CSS:**  
   - `@media print { }` in `print.css` (import in App or facture route).  
   - Hide header, nav, buttons, forms (e.g. `.no-print` on layout; print rules hide `.no-print` and show only `.facture-print`).  
   - Page size, margins, and font size tuned for A4/Letter.
5. **Trigger:** “Print” button calls `window.print()` (e.g. in an effect or button handler after mount).

---

## 8. Implementation Phases

| Phase | Scope | Deliverables |
|-------|--------|--------------|
| **1 – Foundation** | Vite + React, storage, data models | Vite React project; `lib/storage.js` (localStorage); `App.jsx` + React Router; `useBooks` hook; minimal `Dashboard.jsx` listing books. |
| **3 – Purchase Orders** | PO form, calculations, archive | `PoForm.jsx`, `LineItemRow.jsx`; `usePurchaseOrders`; auto PO# and date; line totals + order total; save to archive. |
| **3 – Purchase Orders** | PO form, calculations, archive | `PoForm.jsx`, `LineItemRow.jsx`; `usePurchaseOrders`; auto PO# and date; line totals + order total; save to archive. | PO form with auto PO# and date; line items; totals; save to book’s archive. |
| **4 – Facture & Print** | Bilingual facture, print CSS | `FactureView.jsx` (or `Facture.jsx`); `print.css`; layout per SRS; print route; `window.print()`. |
| **5 – Export/Import** | Backup/restore | `lib/exportImport.js`; export/import UI (e.g. in Dashboard or Layout); validation on import. |
| **6 – Polish** | UX, validation, edge cases | Form validation, error states, responsive tweaks, IndexedDB migration if needed. |

---

## 9. Out of Scope (Explicit)

- Server, authentication, or cloud sync.
- TVA/tax calculations.
- Multi-user or real-time collaboration.
- Native mobile app (web only; desktop-first for printing).

---

## 10. Open Decisions

- **Import strategy:** Full replace vs merge with existing data (and conflict handling).
- **IndexedDB:** Whether to adopt from the start or only if localStorage limits are hit.
- **PO number gaps:** Behavior when a PO is deleted (e.g. keep incrementing vs reusing numbers).

Once these are decided, they can be reflected in `lib/storage.js`, `lib/exportImport.js`, and the relevant React hooks/components, and if needed in an update to this technical plan.

