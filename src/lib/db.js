/**
 * db.js — Relational data layer for Bone Dyali
 *
 * All functions are async and call Supabase directly.
 * localStorage and the sync service are no longer used.
 *
 * Data shape returned to the UI:
 *
 * Book:
 *   { id, workspaceId, name, ownerName, color, createdAt }
 *
 * PurchaseOrder:
 *   { id, bookId, workspaceId, poNumber, type, date,
 *     client: { name, address, extra },
 *     lineItems: LineItem[],
 *     locked, createdAt, updatedAt }
 *
 * LineItem (O/OR):
 *   { id, description, quantity, unitPrice, code, sortOrder }
 *
 * LineItem (P):
 *   { id, paymentType, amount, nSerie, itemName, sortOrder }
 */

import { supabase } from './supabase'

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Map a DB row from `books` to the shape expected by the UI. */
function mapBook(row) {
  return {
    id:          row.id,
    workspaceId: row.workspace_id,
    name:        row.name,
    ownerName:   row.owner_name,
    color:       row.color,
    createdAt:   row.created_at,
  }
}

/** Map a DB row from `purchase_orders` (with nested line_items) to UI shape. */
function mapPO(row) {
  const lineItems = (row.line_items || [])
    .sort((a, b) => a.sort_order - b.sort_order)
    .map(mapLineItem)

  return {
    id:          row.id,
    bookId:      row.book_id,
    workspaceId: row.workspace_id,
    poNumber:    row.po_number,
    type:        row.type,
    date:        row.date,
    client: {
      name:    row.client_name,
      address: row.client_address,
      extra:   row.client_extra,
    },
    lineItems,
    locked:    row.locked,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

/** Map a DB row from `line_items` to UI shape. */
function mapLineItem(row) {
  if (row.payment_type !== null && row.payment_type !== undefined && row.payment_type !== '') {
    // P-type line item
    return {
      id:          row.id,
      sortOrder:   row.sort_order,
      paymentType: row.payment_type,
      amount:      Number(row.amount) || 0,
      nSerie:      row.n_serie,
      name:        row.item_name,
    }
  }
  // O/OR-type line item
  return {
    id:          row.id,
    sortOrder:   row.sort_order,
    description: row.description,
    quantity:    Number(row.quantity) || 0,
    unitPrice:   Number(row.unit_price) || 0,
    code:        row.code,
  }
}

/**
 * Convert the UI-side lineItems array into DB insert rows.
 * Handles both O/OR and P type line items.
 */
function buildLineItemRows(lineItems, purchaseOrderId, workspaceId) {
  return lineItems.map((item, index) => {
    const base = {
      purchase_order_id: purchaseOrderId,
      workspace_id:      workspaceId,
      sort_order:        index,
      // defaults for all columns
      description:  '',
      quantity:     0,
      unit_price:   0,
      code:         '',
      payment_type: null,
      amount:       0,
      n_serie:      '',
      item_name:    '',
    }

    if (item.paymentType !== undefined || item.payment_type !== undefined) {
      // P-type
      return {
        ...base,
        payment_type: item.paymentType ?? item.payment_type ?? null,
        amount:       Number(item.amount) || 0,
        n_serie:      item.nSerie ?? item.n_serie ?? '',
        item_name:    item.name ?? item.item_name ?? '',
      }
    }

    // O/OR-type
    return {
      ...base,
      description: item.description ?? '',
      quantity:    Number(item.quantity) || 0,
      unit_price:  Number(item.unitPrice ?? item.unit_price) || 0,
      code:        item.code ?? '',
    }
  })
}

// ---------------------------------------------------------------------------
// Books
// ---------------------------------------------------------------------------

export async function getBooks(workspaceId) {
  const { data, error } = await supabase
    .from('books')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return (data || []).map(mapBook)
}

export async function getBook(bookId) {
  const { data, error } = await supabase
    .from('books')
    .select('*')
    .eq('id', bookId)
    .single()

  if (error) throw error
  return mapBook(data)
}

export async function createBook(workspaceId, { name, ownerName = '', color = '#6366f1' }) {
  const { data, error } = await supabase
    .from('books')
    .insert({
      workspace_id: workspaceId,
      name:         name.trim() || 'Unnamed book',
      owner_name:   ownerName.trim(),
      color,
    })
    .select()
    .single()

  if (error) throw error
  return mapBook(data)
}

export async function updateBook(bookId, { name, ownerName, color }) {
  const updates = {}
  if (name      !== undefined) updates.name       = name.trim()
  if (ownerName !== undefined) updates.owner_name = ownerName.trim()
  if (color     !== undefined) updates.color      = color

  const { data, error } = await supabase
    .from('books')
    .update(updates)
    .eq('id', bookId)
    .select()
    .single()

  if (error) throw error
  return mapBook(data)
}

export async function deleteBook(bookId) {
  const { error } = await supabase
    .from('books')
    .delete()
    .eq('id', bookId)

  if (error) throw error
}

// ---------------------------------------------------------------------------
// Purchase Orders
// ---------------------------------------------------------------------------

/**
 * Fetch all POs for a book, ordered by po_number ascending.
 * Line items are fetched in a single join and sorted by sort_order.
 */
export async function getPurchaseOrders(bookId) {
  const { data, error } = await supabase
    .from('purchase_orders')
    .select(`
      *,
      line_items (*)
    `)
    .eq('book_id', bookId)
    .order('po_number', { ascending: true })

  if (error) throw error
  return (data || []).map(mapPO)
}

/**
 * Fetch a single PO with its line items.
 */
export async function getPurchaseOrder(bookId, poId) {
  const { data, error } = await supabase
    .from('purchase_orders')
    .select(`
      *,
      line_items (*)
    `)
    .eq('id', poId)
    .eq('book_id', bookId)
    .single()

  if (error) throw error
  return mapPO(data)
}

/**
 * Create a new purchase order and its line items.
 * po_number is computed as MAX(po_number)+1 for the book (application-side).
 */
export async function createPurchaseOrder(bookId, workspaceId, { client = {}, lineItems = [], date, type }) {
  // 1. Compute next po_number
  const { data: maxRow, error: maxError } = await supabase
    .from('purchase_orders')
    .select('po_number')
    .eq('book_id', bookId)
    .order('po_number', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (maxError) throw maxError
  const nextPoNumber = (maxRow?.po_number ?? 0) + 1

  // 2. Insert the PO
  const now = new Date().toISOString()
  const { data: po, error: poError } = await supabase
    .from('purchase_orders')
    .insert({
      book_id:        bookId,
      workspace_id:   workspaceId,
      po_number:      nextPoNumber,
      type:           normalizeType(type),
      date:           date || new Date().toISOString().slice(0, 10),
      client_name:    (client.name    || '').trim(),
      client_address: (client.address || '').trim(),
      client_extra:   (client.extra   || '').trim(),
      locked:         false,
      created_at:     now,
      updated_at:     now,
    })
    .select()
    .single()

  if (poError) throw poError

  // 3. Insert line items (bulk)
  if (lineItems.length > 0) {
    const rows = buildLineItemRows(lineItems, po.id, workspaceId)
    const { error: liError } = await supabase.from('line_items').insert(rows)
    if (liError) throw liError
  }

  // 4. Return the full PO with line items
  return getPurchaseOrder(bookId, po.id)
}

/**
 * Update a purchase order's client info, date, and line items.
 * Replaces all existing line items with the new set.
 */
export async function updatePurchaseOrder(poId, { client, lineItems, date }) {
  // Fetch current PO to get bookId and workspaceId
  const { data: current, error: fetchError } = await supabase
    .from('purchase_orders')
    .select('book_id, workspace_id, locked')
    .eq('id', poId)
    .single()

  if (fetchError) throw fetchError
  if (current.locked) throw new Error('Cannot edit a locked purchase order')

  const now = new Date().toISOString()

  // 1. Update the PO row
  const updates = { updated_at: now }
  if (date           !== undefined) updates.date           = date
  if (client?.name   !== undefined) updates.client_name    = (client.name   || '').trim()
  if (client?.address !== undefined) updates.client_address = (client.address || '').trim()
  if (client?.extra  !== undefined) updates.client_extra   = (client.extra  || '').trim()

  const { error: updateError } = await supabase
    .from('purchase_orders')
    .update(updates)
    .eq('id', poId)

  if (updateError) throw updateError

  // 2. Replace line items: delete all then re-insert
  if (lineItems !== undefined) {
    const { error: deleteError } = await supabase
      .from('line_items')
      .delete()
      .eq('purchase_order_id', poId)

    if (deleteError) throw deleteError

    if (lineItems.length > 0) {
      const rows = buildLineItemRows(lineItems, poId, current.workspace_id)
      const { error: insertError } = await supabase.from('line_items').insert(rows)
      if (insertError) throw insertError
    }
  }

  return getPurchaseOrder(current.book_id, poId)
}

/**
 * Toggle the locked state of a PO.
 */
export async function togglePOLock(poId) {
  // Fetch current locked state
  const { data: current, error: fetchError } = await supabase
    .from('purchase_orders')
    .select('book_id, locked')
    .eq('id', poId)
    .single()

  if (fetchError) throw fetchError

  const { error: updateError } = await supabase
    .from('purchase_orders')
    .update({ locked: !current.locked, updated_at: new Date().toISOString() })
    .eq('id', poId)

  if (updateError) throw updateError

  return getPurchaseOrder(current.book_id, poId)
}

// ---------------------------------------------------------------------------
// Workspace nuke (admin only — deletes all books and cascades)
// ---------------------------------------------------------------------------

export async function nukeWorkspace(workspaceId) {
  const { error } = await supabase
    .from('books')
    .delete()
    .eq('workspace_id', workspaceId)

  if (error) throw error
}

// ---------------------------------------------------------------------------
// Export / Import helpers (used by exportImport.js)
// ---------------------------------------------------------------------------

/**
 * Read all workspace data from the DB in the legacy JSON export format.
 * { books: Book[], purchaseOrders: { [bookId]: PurchaseOrder[] } }
 */
export async function readAllWorkspaceData(workspaceId) {
  const books = await getBooks(workspaceId)
  const purchaseOrders = {}
  for (const book of books) {
    purchaseOrders[book.id] = await getPurchaseOrders(book.id)
  }
  return { books, purchaseOrders }
}

/**
 * Bulk-import data from a JSON backup file into the DB.
 * Nukes existing books first, then re-inserts everything.
 */
export async function importWorkspaceData(workspaceId, { books = [], purchaseOrders = {} }) {
  // 1. Nuke existing data
  await nukeWorkspace(workspaceId)

  // 2. Insert books and POs sequentially (preserve ids for PO→book FK)
  for (const book of books) {
    // Insert book with its original id so PO references still match
    const { error: bookError } = await supabase
      .from('books')
      .insert({
        id:           book.id,
        workspace_id: workspaceId,
        name:         book.name || 'Unnamed book',
        owner_name:   book.ownerName || '',
        color:        book.color || '#6366f1',
        created_at:   book.createdAt || new Date().toISOString(),
      })

    if (bookError) throw bookError

    const pos = purchaseOrders[book.id] || []
    for (const po of pos) {
      const { data: insertedPO, error: poError } = await supabase
        .from('purchase_orders')
        .insert({
          id:             po.id,
          book_id:        book.id,
          workspace_id:   workspaceId,
          po_number:      po.poNumber,
          type:           normalizeType(po.type),
          date:           po.date || new Date().toISOString().slice(0, 10),
          client_name:    (po.client?.name    || '').trim(),
          client_address: (po.client?.address || '').trim(),
          client_extra:   (po.client?.extra   || '').trim(),
          locked:         po.locked ?? false,
          created_at:     po.createdAt  || new Date().toISOString(),
          updated_at:     po.updatedAt  || new Date().toISOString(),
        })
        .select()
        .single()

      if (poError) throw poError

      const lineItems = po.lineItems || []
      if (lineItems.length > 0) {
        const rows = buildLineItemRows(lineItems, insertedPO.id, workspaceId)
        const { error: liError } = await supabase.from('line_items').insert(rows)
        if (liError) throw liError
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Internal normalizers
// ---------------------------------------------------------------------------

function normalizeType(type) {
  const t = String(type || '').toUpperCase()
  if (t === 'OR' || t === 'P') return t
  return 'O'
}
