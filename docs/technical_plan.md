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
├── index.html          # Entry; shell for SPA (dashboard or router target)
├── css/
│   ├── main.css        # Global + dashboard + forms
│   └── print.css       # Print-only facture layout (hide nav, buttons, etc.)
├── js/
│   ├── app.js          # Init, routing (if any), global state
│   ├── storage.js      # Load/save books & POs (localStorage/IndexedDB)
│   ├── books.js        # Book CRUD, list, navigation
│   ├── purchase-order.js  # PO CRUD, calculations, line items
│   ├── facture.js      # Render facture DOM + trigger print
│   └── export-import.js   # JSON export/import
└── docs/
    ├── srs.md
    └── technical_plan.md
```

- **Routing:** Hash-based or single view with show/hide of “dashboard” vs “book detail” vs “PO form” vs “facture view” is sufficient (no framework required).

---

## 6. Feature Implementation Map

| SRS Section           | Technical Implementation |
|-----------------------|--------------------------|
| **2.1 Dashboard**     | `index.html` + `books.js`: list books, “Create Book” form; persist via `storage.js`. |
| **2.1 Create Book**   | Form: name, ownerName, color (picker), totalPages; validate; save; redirect to book view. |
| **2.1 Book color**    | Use `book.color` in list/cards (border or background) for visual identification. |
| **2.1 Book navigation** | Click book → load PO list for that `bookId`; “New PO” button. |
| **2.2 PO creation**   | Form: auto-fill PO number (from `book.nextPoNumber`), current date; client fields; dynamic line items (add/remove rows). |
| **2.2 Calculations**  | On input change: compute line total and order total in `purchase-order.js`; no TVA. |
| **2.3 Local persistence** | `storage.js`: read/write books and POs; decide localStorage vs IndexedDB. |
| **2.3 Archive**       | On “Save” PO: append to book’s PO list in storage; increment `book.nextPoNumber`. |
| **2.3 Export**        | `export-import.js`: serialize all books + POs to JSON; trigger download. |
| **2.3 Import**        | File input → parse JSON → validate → replace (or merge) storage; reload UI. |
| **2.4 Facture print**  | `facture.js`: build printable DOM from PO + book (owner name); `print.css`: hide non-invoice UI; RTL + bilingual labels. |
| **2.4 Layout (header)** | Invoice number (EN/AR), date (EN/AR), prominent owner box (مربع اسم مالك الفاتورة), client (Messrs. / المطلوب من السادة). |
| **2.4 Table**         | Columns: QTY/العدد, DESCRIPTION/نوع البضاعة, CODE/كود البضاعة, UNIT PRICE/الثمن, AMOUNT/الثمن الكلي; footer row TOTAL/المجموع. |
| **3 Technical**       | No server; HTML/JS/CSS only; Web Storage API. |
| **4 UI**              | Book color in UI; responsive layout optimized for desktop and print. |

---

## 7. Print (Facture) Implementation

1. **Template:** A dedicated container (e.g. `#facture-print`) filled by `facture.js` with:
   - Header: invoice number, date, owner box, client name
   - Table: line items + totals
   - Bilingual labels as per SRS
2. **RTL:** Apply `dir="rtl"` (or a class) to Arabic sections; keep layout correct for mixed EN/AR.
3. **CSS:**  
   - `@media print { }` in `print.css`  
   - Hide header, nav, buttons, forms (e.g. `body > *:not(#facture-print)` or class-based).  
   - Show only `#facture-print` (or equivalent).  
   - Page size, margins, and font size tuned for A4/Letter.
4. **Trigger:** “Print” button calls `window.print()` after the facture DOM is rendered.

---

## 8. Implementation Phases

| Phase | Scope | Deliverables |
|-------|--------|--------------|
| **1 – Foundation** | Storage, data models, shell UI | `storage.js` (localStorage), `app.js`, basic `index.html` + `main.css`; create/read books. |
| **2 – Books & Dashboard** | Full book CRUD, color, navigation | Dashboard list, create book form, book detail view with PO list; color in UI. |
| **3 – Purchase Orders** | PO form, calculations, archive | PO form with auto PO# and date; line items; totals; save to book’s archive. |
| **4 – Facture & Print** | Bilingual facture, print CSS | `facture.js` + `print.css`; layout matches SRS; window.print() works. |
| **5 – Export/Import** | Backup/restore | Export all data to JSON file; import from file with validation. |
| **6 – Polish** | UX, validation, edge cases | Form validation, error messages, responsive tweaks, any IndexedDB migration if needed. |

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

Once these are decided, they can be reflected in `storage.js` and `export-import.js` and, if needed, in an update to this technical plan.
