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

export const fetchWorkspace = async (userId) => {
  if (!isSupabaseConfigured()) return null
  
  const { data, error } = await supabase
    .from('workspaces')
    .select('*')
    .eq('owner_id', userId)
    .single()
  
  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching workspace:', error)
    return null
  }
  
  return data
}

export const createWorkspace = async (userId, initialData = null) => {
  if (!isSupabaseConfigured()) return null
  
  const data = initialData || { books: [] }
  
  const { data: workspace, error } = await supabase
    .from('workspaces')
    .insert({
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

export const syncData = async (userId, role = 'admin') => {
  if (!isSupabaseConfigured()) {
    return { success: false, reason: 'not_configured' }
  }

  const localData = getLocalData()
  const localUpdatedAt = getLocalUpdatedAt()

  if (role === 'admin') {
    const { data: serverData, error } = await supabase
      .from('workspaces')
      .select('data, updated_at')
      .eq('owner_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Sync error:', error)
      return { success: false, reason: 'error', error }
    }

    if (!serverData) {
      const workspace = await createWorkspace(userId, localData)
      if (workspace) {
        setLocalUpdatedAt(workspace.updated_at)
        return { success: true, action: 'created', updatedAt: workspace.updated_at }
      }
      return { success: false, reason: 'create_failed' }
    }

    const serverUpdatedAt = serverData.updated_at
    const serverDataParsed = serverData.data || { books: [] }

    if (localUpdatedAt && new Date(localUpdatedAt) > new Date(serverUpdatedAt)) {
      const { error: updateError } = await supabase
        .from('workspaces')
        .update({
          data: localData.books,
          updated_at: new Date().toISOString()
        })
        .eq('owner_id', userId)

      if (updateError) {
        console.error('Push error:', updateError)
        return { success: false, reason: 'push_failed' }
      }

      setLocalUpdatedAt(new Date().toISOString())
      return { success: true, action: 'pushed', updatedAt: new Date().toISOString() }
    } 
    else if (!localUpdatedAt || new Date(serverUpdatedAt) > new Date(localUpdatedAt)) {
      setLocalData(serverDataParsed)
      setLocalUpdatedAt(serverUpdatedAt)
      return { success: true, action: 'pulled', updatedAt: serverUpdatedAt }
    }

    return { success: true, action: 'up_to_date', updatedAt: serverUpdatedAt }
  } else {
    const { data: workspaceData, error } = await supabase
      .from('workspaces')
      .select('data, updated_at')
      .eq('owner_id', userId)
      .single()

    if (error || !workspaceData) {
      return { success: false, reason: 'no_workspace' }
    }

    setLocalData(workspaceData.data)
    setLocalUpdatedAt(workspaceData.updated_at)
    return { success: true, action: 'synced', updatedAt: workspaceData.updated_at }
  }
}

export const startSync = (userId, role = 'admin', onSync) => {
  syncCallback = onSync
  
  const runSync = async () => {
    const result = await syncData(userId, role)
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

export const forceSync = async (userId, role = 'admin') => {
  return await syncData(userId, role)
}
