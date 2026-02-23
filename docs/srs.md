# Software Requirements Specification (SRS)

## Project: Client-Side Purchase Order Manager

---

## 1. Introduction

This application is a standalone, browser-based tool for generating and managing Purchase Orders (POs). It requires no server-side backend; all data is managed via browser storage.

---

## 2. Functional Requirements

### 2.1 Dashboard & Book Management

- **Dashboard:** Primary entry point displaying all "Purchase Order Books."
- **Create Book:** Users can create a new book by defining:
    - **Book Name/ID**
    - **Owner Name:** The name to appear in the "Company/Owner Name Box" on the printed invoice.
    - **Color:** Physical attribute of the book.
    - **PO Capacity:** Unlimited purchase orders per book.
- **Book Navigation:** Clicking a book enters its specific PO archive.

---

### 2.2 Purchase Order (PO) Creation

- **Automatic Fields:**
    - **PO Number:** Incremental.
    - **Current Date**
- **Manual Input:**
    - **Client Details** (Name, Address, etc.)
    - **Line Items** (Description, Quantity, Unit Price, Code)
- **Calculations:**
    - **Line Total:** `Quantity × Unit Price`
    - **Order Total:** Sum of all Line Totals (No TVA/Tax included).

---

### 2.3 Storage & Archive

- **Local Persistence:** Uses Browser localStorage or IndexedDB.
- **Archive:** Saved POs move to a permanent list within the selected book.
- **Portability:** Export all data to a JSON file (Backup) and provide Import functionality.

---

### 2.4 Printing (Facture)

- **Format:** A professional, bilingual (English/Arabic) "Facture" layout triggered via the browser's print command, modelled after the provided example.
- **Layout Details:**
    - **Header:** Must include:
        - **Invoice Number / رقم الفاتورة**
        - **Date / التاريخ**
        - **Prominent box with Book Owner's Name** (مربع يحتوي على اسم مالك الفاتورة), as defined during book creation.
        - **Client's Name field** (Messrs. / المطلوب من السادة).
    - **Table Columns (Bilingual):**
        - **QTY / العدد**
        - **DESCRIPTION / نوع البضاعة**
        - **CODE / كود البضاعة**
        - **UNIT PRICE / الثمن**
        - **AMOUNT / الثمن الكلي**
    - **Footer:** Final row for the total sum:
        - **TOTAL / المجموع**
- **Styling:** CSS Print Media queries ensure UI elements (buttons, navigation) are hidden, leaving only the invoice.

---

## 3. Technical Requirements

- **Environment:** 100% Client-side (HTML/JS/CSS).
- **Storage:** Web Storage API.
- **Compatibility:** Modern web browsers (Chrome, Edge, Firefox).

---

## 4. User Interface (UI) Design

- **Color Coding:** The UI will reflect the "Color" attribute assigned to the PO Book for easy visual identification.
- **Responsive:** Optimized for desktop use where printing is standard.
