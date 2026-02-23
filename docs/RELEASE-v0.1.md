# Alpha Release - Bone Dyali

**Version:** 0.1.0-alpha  
**Date:** February 23, 2026  
**Status:** Alpha Release

---

## Overview

Bone Dyali is a purchase order management application for small businesses. This alpha release provides core functionality for managing books (customers/clients) and their purchase orders.

---

## Features

### Completed

- **Book Management**
  - Create, edit, and delete books (customers)
  - Assign custom colors to books
  - View book details with purchase order history

- **Purchase Order (PO) Management**
  - Create new purchase orders with line items
  - Edit existing POs
  - Lock/unlock POs to prevent edits
  - Delete POs

- **Analytics**
  - Total revenue per book
  - Total quantity sold per book

- **PDF Generation**
  - Generate professional PDF invoices/factures
  - Download PDFs
  - Preview PDFs in-app

- **Data Management**
  - Export all data to JSON
  - Import data from JSON
  - Nuke (delete all) data

- **UI/UX**
  - Responsive design (mobile-friendly)
  - Custom component library (Button, Card, Badge, Modal, Toast)
  - Lucide icons
  - Smooth animations

---

## Technology Stack

- **Frontend:** React + Vite
- **Styling:** Tailwind CSS v4
- **Icons:** Lucide React
- **PDF Generation:** @react-pdf/renderer
- **Storage:** LocalStorage (IndexedDB via Dexie)
- **Routing:** React Router v6

---

## Known Issues

- Tailwind CSS configuration is brand new (v4) - may have edge cases
- PDF formatting is fixed and cannot be customized yet
- No user authentication (single-user local app)
- No cloud sync

---

## Installation & Running

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

---

## Roadmap (Next Steps)

1. Improve PDF customization options
2. Add more invoice templates
3. Enhance analytics dashboard
4. Add search/filter functionality
5. Implement data validation
6. Add unit tests

---

## Changelog

### v0.1.0-alpha (2026-02-23)

- Initial alpha release
- Core CRUD for books and purchase orders
- PDF generation and download
- Data export/import
- Responsive UI with Tailwind CSS
