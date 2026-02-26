import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { startSync, stopSync, syncData } from '../lib/syncService'

const defaultAuthValue = {
  user: null,
  role: 'admin',
  loading: false,
  isAuthenticated: false,
  isAdmin: true,
  isViewer: false,
  workspaceId: null,
  needsWorkspaceChoice: false,
  syncStatus: { syncing: false, lastSynced: null, error: null },
  signInWithGoogle: async () => {},
  signOut: async () => {},
  forceSyncNow: async () => {},
  setWorkspaceInfo: () => {},
  leaveWorkspace: async () => {}
}

const AuthContext = createContext(defaultAuthValue)

export const useAuth = () => {
  return useContext(AuthContext)
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [role, setRole] = useState(null)
  const [loading, setLoading] = useState(true)
  const [syncStatus, setSyncStatus] = useState({ syncing: false, lastSynced: null, error: null })
  const [workspaceId, setWorkspaceId] = useState(null)
  const [needsWorkspaceChoice, setNeedsWorkspaceChoice] = useState(false)

  const handleSyncStatus = useCallback((result) => {
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
  }, [])

  const checkWorkspaceMembership = useCallback(async (authUser) => {
    // First check if user owns a workspace (admin)
    const { data: ownedWorkspace } = await supabase
      .from('workspaces')
      .select('id')
      .eq('owner_id', authUser.id)
      .single()

    if (ownedWorkspace) {
      setWorkspaceId(ownedWorkspace.id)
      setRole('admin')
      setNeedsWorkspaceChoice(false)
      startSync(authUser.id, 'admin', ownedWorkspace.id, handleSyncStatus)
      return
    }

    // Check if user is a member of a workspace (viewer)
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('workspace_id')
      .eq('user_id', authUser.id)
      .single()

    if (membership) {
      setWorkspaceId(membership.workspace_id)
      setRole('viewer')
      setNeedsWorkspaceChoice(false)
      startSync(authUser.id, 'viewer', membership.workspace_id, handleSyncStatus)
      return
    }

    // User has no workspace - needs to choose
    setNeedsWorkspaceChoice(true)
    setRole(null)
    setWorkspaceId(null)
  }, [handleSyncStatus])

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setLoading(false)
      return
    }

    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session?.user) {
        setUser(session.user)
        await checkWorkspaceMembership(session.user)
      }
      setLoading(false)
    }

    initAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user)
        await checkWorkspaceMembership(session.user)
      } else {
        setUser(null)
        setRole(null)
        setWorkspaceId(null)
        setNeedsWorkspaceChoice(false)
        stopSync()
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [checkWorkspaceMembership])

  const setWorkspaceInfo = useCallback((wsId, wsRole) => {
    setWorkspaceId(wsId)
    setRole(wsRole)
    setNeedsWorkspaceChoice(false)
    if (user) {
      startSync(user.id, wsRole, wsId, handleSyncStatus)
    }
  }, [user, handleSyncStatus])

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
    setNeedsWorkspaceChoice(false)
    setSyncStatus({ syncing: false, lastSynced: null, error: null })
  }

  const leaveWorkspace = async () => {
    if (!isSupabaseConfigured() || !user || role !== 'viewer') return

    stopSync()

    // Delete membership
    await supabase
      .from('workspace_members')
      .delete()
      .eq('user_id', user.id)

    // Clear local data
    localStorage.removeItem('bone_dyali_books')
    localStorage.removeItem('bone_dyali_updated_at')

    setWorkspaceId(null)
    setRole(null)
    setNeedsWorkspaceChoice(true)
    setSyncStatus({ syncing: false, lastSynced: null, error: null })
  }

  const forceSyncNow = async () => {
    if (!user || !workspaceId) return
    setSyncStatus(prev => ({ ...prev, syncing: true }))
    const result = await syncData(user.id, role, workspaceId)
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
    needsWorkspaceChoice,
    syncStatus,
    signInWithGoogle,
    signOut,
    forceSyncNow,
    setWorkspaceInfo,
    leaveWorkspace
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
