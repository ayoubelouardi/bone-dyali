import { supabase, isSupabaseConfigured } from './supabase'
import { getBooks, getPurchaseOrders, saveBooks, savePurchaseOrders, saveBooksFromServer, savePurchaseOrdersFromServer } from './storage'

const SYNC_INTERVAL = 10 * 60 * 1000
const RETRY_DELAYS = [3000, 8000, 20000] // retry at 3s, 8s, 20s after failure

let syncTimer = null
let syncCallback = null
let retryTimer = null

// --- Local data helpers ---

const LOCAL_UPDATED_AT_KEY = 'bone_dyali_updated_at'

const getLocalUpdatedAt = () => localStorage.getItem(LOCAL_UPDATED_AT_KEY) || null
const setLocalUpdatedAt = (ts) => localStorage.setItem(LOCAL_UPDATED_AT_KEY, ts)

/** Collect all books + every book's purchase orders from localStorage */
const readAllLocalData = () => {
  const books = getBooks()
  const purchaseOrders = {}
  for (const book of books) {
    purchaseOrders[book.id] = getPurchaseOrders(book.id)
  }
  return { books, purchaseOrders }
}

/** Write books + purchase orders received from the server into localStorage (no timestamp bump) */
const writeAllLocalData = ({ books = [], purchaseOrders = {} }) => {
  saveBooksFromServer(books)
  for (const [bookId, orders] of Object.entries(purchaseOrders)) {
    savePurchaseOrdersFromServer(bookId, orders)
  }
}

// --- Core sync ---

export const syncData = async (userId, role = 'admin', workspaceId = null) => {
  if (!isSupabaseConfigured()) return { success: false, reason: 'not_configured' }
  if (!workspaceId)           return { success: false, reason: 'no_workspace_id' }

  // Fetch server snapshot
  const { data: serverRow, error } = await supabase
    .from('workspaces')
    .select('data, updated_at')
    .eq('id', workspaceId)
    .single()

  if (error) {
    console.error('Sync fetch error:', error)
    return { success: false, reason: 'fetch_failed', error }
  }

  const serverUpdatedAt  = serverRow.updated_at
  const serverData       = serverRow.data || { books: [], purchaseOrders: {} }

  // ── VIEWER: always pull, never push ──────────────────────────────────────
  if (role === 'viewer') {
    writeAllLocalData(serverData)
    setLocalUpdatedAt(serverUpdatedAt)
    return { success: true, action: 'pulled', updatedAt: serverUpdatedAt }
  }

  // ── ADMIN ─────────────────────────────────────────────────────────────────
  const localUpdatedAt = getLocalUpdatedAt()
  const localBooks = getBooks()

  // No local timestamp OR no local books → fresh device, always pull from server
  // This covers the case where a user logs in on a new device (phone, another PC)
  // and needs to restore all their cloud data without any manual intervention.
  if (!localUpdatedAt || localBooks.length === 0) {
    writeAllLocalData(serverData)
    setLocalUpdatedAt(serverUpdatedAt)
    return { success: true, action: 'pulled', updatedAt: serverUpdatedAt }
  }

  const localIsNewer = new Date(localUpdatedAt) > new Date(serverUpdatedAt)

  if (localIsNewer) {
    // Admin added new data locally → push everything to server
    const localData = readAllLocalData()
    const now = new Date().toISOString()

    const { data: updated, error: pushError } = await supabase
      .from('workspaces')
      .update({ data: localData, updated_at: now })
      .eq('id', workspaceId)
      .select('updated_at')
      .single()

    if (pushError) {
      console.error('Sync push error:', pushError)
      return { success: false, reason: 'push_failed', error: pushError }
    }

    // Use the timestamp the server actually stored to avoid drift
    setLocalUpdatedAt(updated.updated_at)
    return { success: true, action: 'pushed', updatedAt: updated.updated_at }
  }

  // Server is newer (or equal) → pull
  if (new Date(serverUpdatedAt) > new Date(localUpdatedAt)) {
    writeAllLocalData(serverData)
    setLocalUpdatedAt(serverUpdatedAt)
    return { success: true, action: 'pulled', updatedAt: serverUpdatedAt }
  }

  return { success: true, action: 'up_to_date', updatedAt: serverUpdatedAt }
}

// --- Periodic sync timer ---

const clearRetry = () => {
  if (retryTimer) {
    clearTimeout(retryTimer)
    retryTimer = null
  }
}

export const startSync = (userId, role = 'admin', workspaceId = null, onSync) => {
  // Clear any existing timer first
  stopSync()

  syncCallback = onSync

  let retryCount = 0

  const runSync = async () => {
    const result = await syncData(userId, role, workspaceId)
    if (syncCallback) syncCallback(result)

    // Auto-retry on failure (only for initial load failures on fresh devices)
    if (!result.success && retryCount < RETRY_DELAYS.length) {
      const delay = RETRY_DELAYS[retryCount]
      retryCount++
      console.warn(`Sync failed (${result.reason}), retrying in ${delay / 1000}s... (attempt ${retryCount}/${RETRY_DELAYS.length})`)
      retryTimer = setTimeout(runSync, delay)
    } else if (result.success) {
      // Reset retry count on success
      retryCount = 0
    }
  }

  // Run immediately on start
  runSync()
  syncTimer = setInterval(() => {
    // Reset retry count before each periodic sync
    retryCount = 0
    runSync()
  }, SYNC_INTERVAL)
}

export const stopSync = () => {
  if (syncTimer) {
    clearInterval(syncTimer)
    syncTimer = null
  }
  clearRetry()
}

export const forceSync = async (userId, role = 'admin', workspaceId = null) => {
  return await syncData(userId, role, workspaceId)
}
