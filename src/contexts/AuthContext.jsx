import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { startSync, stopSync, syncData } from '../lib/syncService'
import { nukeDatabase } from '../lib/storage'

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
  const initialized = useRef(false)

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

  const resolveWorkspace = useCallback(async (authUser) => {
    try {
      // First check if user owns a workspace (admin)
      const { data: ownedWorkspace, error: ownerError } = await supabase
        .from('workspaces')
        .select('id')
        .eq('owner_id', authUser.id)
        .maybeSingle()

      if (ownerError) {
        console.error('Error checking workspace ownership:', ownerError)
      }

      if (ownedWorkspace) {
        setWorkspaceId(ownedWorkspace.id)
        setRole('admin')
        setNeedsWorkspaceChoice(false)
        startSync(authUser.id, 'admin', ownedWorkspace.id, handleSyncStatus)
        return
      }

      // Check if user is a member of a workspace (viewer)
      const { data: membership, error: memberError } = await supabase
        .from('workspace_members')
        .select('workspace_id')
        .eq('user_id', authUser.id)
        .maybeSingle()

      if (memberError) {
        console.error('Error checking membership:', memberError)
      }

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
    } catch (err) {
      console.error('Error resolving workspace:', err)
      // Still allow the app to load - send to workspace choice
      setNeedsWorkspaceChoice(true)
      setRole(null)
      setWorkspaceId(null)
    }
  }, [handleSyncStatus])

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setLoading(false)
      return
    }

    // Use getSession for initial load - reliable and not affected by race conditions
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()

        if (session?.user) {
          setUser(session.user)
          await resolveWorkspace(session.user)
        }
      } catch (err) {
        console.error('Auth init error:', err)
      } finally {
        setLoading(false)
        initialized.current = true
      }
    }

    initAuth()

    // Listen for future auth changes (sign in, sign out) AFTER initial load
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Skip the initial event — we handle it above with getSession
      if (!initialized.current) return

      if (event === 'SIGNED_IN' && session?.user) {
        setLoading(true)
        setUser(session.user)
        await resolveWorkspace(session.user)
        setLoading(false)
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
        setRole(null)
        setWorkspaceId(null)
        setNeedsWorkspaceChoice(false)
        stopSync()
      }
    })

    return () => subscription.unsubscribe()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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

    // Clear all local data so a subsequent login (same or different user)
    // always pulls a clean state from the server instead of pushing stale
    // local data into the wrong workspace.
    nukeDatabase()
    localStorage.removeItem('bone_dyali_updated_at')

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

    // Clear ALL local data (books + all per-book PO keys + timestamp)
    nukeDatabase()
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
