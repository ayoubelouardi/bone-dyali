import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'

const defaultAuthValue = {
  user: null,
  role: 'admin',
  loading: false,
  isAuthenticated: false,
  isAdmin: true,
  isViewer: false,
  workspaceId: null,
  needsWorkspaceChoice: false,
  signInWithGoogle: async () => {},
  signOut: async () => {},
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
  const [workspaceId, setWorkspaceId] = useState(null)
  const [needsWorkspaceChoice, setNeedsWorkspaceChoice] = useState(false)
  const initialized = useRef(false)

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
        return
      }

      // User has no workspace - needs to choose
      setNeedsWorkspaceChoice(true)
      setRole(null)
      setWorkspaceId(null)
    } catch (err) {
      console.error('Error resolving workspace:', err)
      setNeedsWorkspaceChoice(true)
      setRole(null)
      setWorkspaceId(null)
    }
  }, [])

  useEffect(() => {
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

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
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
      }
    })

    return () => subscription.unsubscribe()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const setWorkspaceInfo = useCallback((wsId, wsRole) => {
    setWorkspaceId(wsId)
    setRole(wsRole)
    setNeedsWorkspaceChoice(false)
  }, [])

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    })
    if (error) throw error
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setRole(null)
    setWorkspaceId(null)
    setNeedsWorkspaceChoice(false)
  }

  const leaveWorkspace = async () => {
    if (!user || role !== 'viewer') return

    await supabase
      .from('workspace_members')
      .delete()
      .eq('user_id', user.id)

    setWorkspaceId(null)
    setRole(null)
    setNeedsWorkspaceChoice(true)
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
    signInWithGoogle,
    signOut,
    setWorkspaceInfo,
    leaveWorkspace
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
