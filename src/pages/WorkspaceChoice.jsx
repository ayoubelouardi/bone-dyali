import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { BookOpen, Users, Plus, ArrowRight, Loader } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

export default function WorkspaceChoice() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user, setWorkspaceInfo } = useAuth()
  const [mode, setMode] = useState(null) // null | 'create' | 'join'
  const [inviteCode, setInviteCode] = useState(searchParams.get('code') || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (searchParams.get('code')) {
      setMode('join')
    }
  }, [searchParams])

  const generateInviteCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let code = ''
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return code
  }

  const handleCreateWorkspace = async () => {
    if (!user) return
    setLoading(true)
    setError('')

    try {
      // Create workspace row (no data blob — books live in their own table)
      const { data: workspace, error: createError } = await supabase
        .from('workspaces')
        .insert({ owner_id: user.id })
        .select()
        .single()

      if (createError) {
        if (createError.code === '23505') {
          setError('You already have a workspace. Please refresh the page.')
        } else {
          setError(createError.message)
        }
        setLoading(false)
        return
      }

      // Generate first invite code
      const code = generateInviteCode()
      await supabase
        .from('invite_codes')
        .insert({ workspace_id: workspace.id, code })

      setWorkspaceInfo(workspace.id, 'admin')
      navigate('/')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleJoinWorkspace = async () => {
    if (!user || !inviteCode.trim()) return
    setLoading(true)
    setError('')

    try {
      const codeUpper = inviteCode.trim().toUpperCase()

      // Find the invite code
      const { data: invite, error: findError } = await supabase
        .from('invite_codes')
        .select('id, workspace_id, used_by')
        .eq('code', codeUpper)
        .single()

      if (findError || !invite) {
        setError('Invalid invite code. Please check and try again.')
        setLoading(false)
        return
      }

      if (invite.used_by) {
        setError('This invite code has already been used.')
        setLoading(false)
        return
      }

      // Check if user already in a workspace
      const { data: existingMembership } = await supabase
        .from('workspace_members')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (existingMembership) {
        setError('You are already a member of a workspace. Leave your current workspace first.')
        setLoading(false)
        return
      }

      // Add user as member
      const { error: memberError } = await supabase
        .from('workspace_members')
        .insert({
          workspace_id: invite.workspace_id,
          user_id: user.id,
          role: 'viewer'
        })

      if (memberError) {
        setError(memberError.message)
        setLoading(false)
        return
      }

      // Mark invite code as used
      await supabase
        .from('invite_codes')
        .update({ used_by: user.id, used_at: new Date().toISOString() })
        .eq('id', invite.id)

      setWorkspaceInfo(invite.workspace_id, 'viewer')
      navigate('/')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!mode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-lg w-full mx-4">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-500 rounded-xl flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Welcome to Bone Dyali</h1>
            <p className="text-gray-600 mt-2">Choose how you want to get started</p>
          </div>

          <div className="space-y-4">
            {/* Create Workspace Option */}
            <button
              onClick={() => setMode('create')}
              className="w-full bg-white rounded-xl shadow-lg p-6 text-left transition-all border-2 border-gray-200 hover:border-blue-500 hover:shadow-xl"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Plus className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-gray-800">Create Workspace</h2>
                  <p className="text-gray-600 text-sm mt-1">
                    Start as admin. You can invite others to view your data.
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400" />
              </div>
            </button>

            {/* Join Workspace Option */}
            <button
              onClick={() => setMode('join')}
              className="w-full bg-white rounded-xl shadow-lg p-6 text-left transition-all border-2 border-gray-200 hover:border-green-500 hover:shadow-xl"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-gray-800">Join Workspace</h2>
                  <p className="text-gray-600 text-sm mt-1">
                    Enter an invite code to view someone else's data (read-only).
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400" />
              </div>
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (mode === 'create') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-md w-full mx-4 bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-6">
            <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Plus className="w-7 h-7 text-blue-600" />
            </div>
            <h1 className="text-xl font-bold text-gray-800">Create Your Workspace</h1>
            <p className="text-gray-600 text-sm mt-1">
              You will be the admin of this workspace
            </p>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <button
              onClick={handleCreateWorkspace}
              disabled={loading}
              style={{ color: 'white', background: 'black' }}
              className="w-full py-3 px-4 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  Create Workspace
                </>
              )}
            </button>

            <button
              onClick={() => setMode(null)}
              disabled={loading}
              className="w-full py-3 px-4 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Back
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Join mode
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-md w-full mx-4 bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Users className="w-7 h-7 text-green-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-800">Join a Workspace</h1>
          <p className="text-gray-600 text-sm mt-1">
            Enter the invite code provided by the admin
          </p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Invite Code
            </label>
            <input
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              placeholder="Enter 8-character code"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-center text-lg tracking-widest uppercase"
              maxLength={8}
            />
          </div>

          <button
            onClick={handleJoinWorkspace}
            disabled={loading || inviteCode.length < 8}
            className="w-full py-3 px-4 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                Joining...
              </>
            ) : (
              <>
                <Users className="w-5 h-5" />
                Join Workspace
              </>
            )}
          </button>

          <button
            onClick={() => setMode(null)}
            disabled={loading}
            className="w-full py-3 px-4 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Back
          </button>
        </div>
      </div>
    </div>
  )
}
