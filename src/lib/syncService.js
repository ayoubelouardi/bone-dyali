import { supabase, isSupabaseConfigured } from './supabase'
import { getBooks, saveBooks } from './storage'

const SYNC_INTERVAL = 10 * 60 * 1000

let syncTimer = null
let syncCallback = null
let lastSyncedAt = null

const getLocalData = () => {
  const books = getBooks()
  return {
    books,
    updated_at: localStorage.getItem('bone_dyali_updated_at') || null
  }
}

const setLocalData = (data) => {
  if (data.books) {
    saveBooks(data.books)
  }
  if (data.updated_at) {
    localStorage.setItem('bone_dyali_updated_at', data.updated_at)
  }
}

const getLocalUpdatedAt = () => {
  return localStorage.getItem('bone_dyali_updated_at') || null
}

const setLocalUpdatedAt = (timestamp) => {
  localStorage.setItem('bone_dyali_updated_at', timestamp)
}

export const fetchWorkspace = async (workspaceId) => {
  if (!isSupabaseConfigured()) return null
  
  const { data, error } = await supabase
    .from('workspaces')
    .select('*')
    .eq('id', workspaceId)
    .single()
  
  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching workspace:', error)
    return null
  }
  
  return data
}

export const createWorkspace = async (userId, workspaceId, initialData = null) => {
  if (!isSupabaseConfigured()) return null
  
  const data = initialData || { books: [] }
  
  const { data: workspace, error } = await supabase
    .from('workspaces')
    .insert({
      id: workspaceId,
      owner_id: userId,
      data,
      updated_at: new Date().toISOString()
    })
    .select()
    .single()
  
  if (error) {
    console.error('Error creating workspace:', error)
    return null
  }
  
  return workspace
}

export const syncData = async (userId, role = 'admin', workspaceId = null) => {
  if (!isSupabaseConfigured()) {
    return { success: false, reason: 'not_configured' }
  }

  if (!workspaceId) {
    return { success: false, reason: 'no_workspace_id' }
  }

  const localData = getLocalData()
  const localUpdatedAt = getLocalUpdatedAt()

  // Fetch workspace data by workspaceId
  const { data: serverData, error } = await supabase
    .from('workspaces')
    .select('data, updated_at')
    .eq('id', workspaceId)
    .single()

  if (error) {
    console.error('Sync error:', error)
    return { success: false, reason: 'error', error }
  }

  if (!serverData) {
    return { success: false, reason: 'no_workspace' }
  }

  const serverUpdatedAt = serverData.updated_at
  const serverDataParsed = serverData.data || { books: [] }

  if (role === 'admin') {
    // Admin can push or pull based on timestamps
    if (localUpdatedAt && new Date(localUpdatedAt) > new Date(serverUpdatedAt)) {
      // Local is newer - push to server
      const { error: updateError } = await supabase
        .from('workspaces')
        .update({
          data: { books: localData.books },
          updated_at: new Date().toISOString()
        })
        .eq('id', workspaceId)

      if (updateError) {
        console.error('Push error:', updateError)
        return { success: false, reason: 'push_failed' }
      }

      setLocalUpdatedAt(new Date().toISOString())
      return { success: true, action: 'pushed', updatedAt: new Date().toISOString() }
    } 
    else if (!localUpdatedAt || new Date(serverUpdatedAt) > new Date(localUpdatedAt)) {
      // Server is newer - pull from server
      setLocalData(serverDataParsed)
      setLocalUpdatedAt(serverUpdatedAt)
      return { success: true, action: 'pulled', updatedAt: serverUpdatedAt }
    }

    return { success: true, action: 'up_to_date', updatedAt: serverUpdatedAt }
  } else {
    // Viewer can only pull (read-only)
    setLocalData(serverDataParsed)
    setLocalUpdatedAt(serverUpdatedAt)
    return { success: true, action: 'synced', updatedAt: serverUpdatedAt }
  }
}

export const startSync = (userId, role = 'admin', workspaceId = null, onSync) => {
  syncCallback = onSync
  
  const runSync = async () => {
    const result = await syncData(userId, role, workspaceId)
    if (syncCallback) {
      syncCallback(result)
    }
    lastSyncedAt = new Date()
  }

  runSync()
  
  syncTimer = setInterval(runSync, SYNC_INTERVAL)
  
  return () => {
    if (syncTimer) {
      clearInterval(syncTimer)
      syncTimer = null
    }
  }
}

export const stopSync = () => {
  if (syncTimer) {
    clearInterval(syncTimer)
    syncTimer = null
  }
}

export const getLastSyncedAt = () => lastSyncedAt

export const forceSync = async (userId, role = 'admin', workspaceId = null) => {
  return await syncData(userId, role, workspaceId)
}
