import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Check, AlertCircle, Loader } from 'lucide-react'

export const JoinWorkspace = () => {
  const { workspaceId } = useParams()
  const navigate = useNavigate()
  const { isAuthenticated, user } = useAuth()
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setStatus('error')
      setError('Supabase is not configured')
      return
    }

    if (!workspaceId) {
      setStatus('error')
      setError('Invalid invite link')
      return
    }

    const joinWorkspace = async () => {
      if (!isAuthenticated || !user) {
        setStatus('needs_auth')
        return
      }

      const { data: workspace } = await supabase
        .from('workspaces')
        .select('owner_id')
        .eq('id', workspaceId)
        .single()

      if (!workspace) {
        setStatus('error')
        setError('Workspace not found')
        return
      }

      if (workspace.owner_id === user.id) {
        setStatus('error')
        setError('You cannot join your own workspace as a viewer')
        return
      }

      const { error: insertError } = await supabase
        .from('workspace_members')
        .insert({
          workspace_id: workspaceId,
          user_id: user.id,
          role: 'viewer'
        })

      if (insertError) {
        if (insertError.code === '23505') {
          setStatus('already_member')
          return
        }
        setStatus('error')
        setError(insertError.message)
        return
      }

      setStatus('success')
      setTimeout(() => navigate('/'), 2000)
    }

    joinWorkspace()
  }, [workspaceId, isAuthenticated, user, navigate])

  if (status === 'loading' || status === 'needs_auth') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full mx-4 bg-white rounded-xl shadow-lg p-8 text-center">
          {status === 'needs_auth' ? (
            <>
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-blue-500" />
              </div>
              <h1 className="text-xl font-bold text-gray-800 mb-2">Sign in Required</h1>
              <p className="text-gray-600 mb-4">
                Please sign in with your Google account to join this workspace.
              </p>
              <a
                href="/login"
                className="inline-block px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Go to Login
              </a>
            </>
          ) : (
            <>
              <Loader className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
              <p className="text-gray-600">Joining workspace...</p>
            </>
          )}
        </div>
      </div>
    )
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full mx-4 bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-500" />
          </div>
          <h1 className="text-xl font-bold text-gray-800 mb-2">Welcome!</h1>
          <p className="text-gray-600">
            You have successfully joined the workspace. Redirecting...
          </p>
        </div>
      </div>
    )
  }

  if (status === 'already_member') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full mx-4 bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-500" />
          </div>
          <h1 className="text-xl font-bold text-gray-800 mb-2">Already a Member</h1>
          <p className="text-gray-600 mb-4">
            You are already a viewer in this workspace.
          </p>
          <a
            href="/"
            className="inline-block px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Go to Dashboard
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full mx-4 bg-white rounded-xl shadow-lg p-8 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <h1 className="text-xl font-bold text-gray-800 mb-2">Error</h1>
        <p className="text-gray-600">{error}</p>
      </div>
    </div>
  )
}

export default JoinWorkspace
