import { createContext, useContext, useState, useEffect } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { startSync, stopSync, syncData } from '../lib/syncService'
import { getBooks } from '../lib/storage'

const AuthContext = createContext(null)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [role, setRole] = useState(null)
  const [loading, setLoading] = useState(true)
  const [syncStatus, setSyncStatus] = useState({ syncing: false, lastSynced: null, error: null })
  const [workspaceId, setWorkspaceId] = useState(null)

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setLoading(false)
      return
    }

    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session?.user) {
        setUser(session.user)
        await checkOrCreateWorkspace(session.user)
      }
      setLoading(false)
    }

    initAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user)
        await checkOrCreateWorkspace(session.user)
      } else {
        setUser(null)
        setRole(null)
        setWorkspaceId(null)
        stopSync()
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const checkOrCreateWorkspace = async (authUser) => {
    const { data: workspace } = await supabase
      .from('workspaces')
      .select('*')
      .eq('owner_id', authUser.id)
      .single()

    if (workspace) {
      setWorkspaceId(workspace.id)
      setRole('admin')
      startSync(authUser.id, 'admin', handleSyncStatus)
    } else {
      const existingLocalData = getBooks()
      const { data: newWorkspace } = await supabase
        .from('workspaces')
        .insert({
          owner_id: authUser.id,
          data: existingLocalData || { books: [] },
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (newWorkspace) {
        setWorkspaceId(newWorkspace.id)
        setRole('admin')
        startSync(authUser.id, 'admin', handleSyncStatus)
      }
    }
  }

  const handleSyncStatus = (result) => {
    if (result.success) {
      setSyncStatus({
        syncing: false,
        lastSynced: new Date(),
        error: null
      })
    } else if (result.reason === 'not_configured') {
      setSyncStatus({
        syncing: false,
        lastSynced: null,
        error: 'Supabase not configured'
      })
    } else {
      setSyncStatus(prev => ({
        ...prev,
        syncing: false,
        error: result.reason
      }))
    }
  }

  const signInWithGoogle = async () => {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase not configured')
    }
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    })
    
    if (error) throw error
  }

  const signOut = async () => {
    if (!isSupabaseConfigured()) return
    
    stopSync()
    await supabase.auth.signOut()
    setUser(null)
    setRole(null)
    setWorkspaceId(null)
    setSyncStatus({ syncing: false, lastSynced: null, error: null })
  }

  const forceSyncNow = async () => {
    if (!user) return
    setSyncStatus(prev => ({ ...prev, syncing: true }))
    const result = await syncData(user.id, role)
    handleSyncStatus(result)
    return result
  }

  const value = {
    user,
    role,
    loading,
    isAuthenticated: !!user,
    isAdmin: role === 'admin',
    isViewer: role === 'viewer',
    workspaceId,
    syncStatus,
    signInWithGoogle,
    signOut,
    forceSyncNow
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
