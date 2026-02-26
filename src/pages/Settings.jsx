import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { Copy, Check, Users, Trash2, Plus, Key, LogOut, RefreshCw } from 'lucide-react'

export const Settings = () => {
  const { user, workspaceId, isAdmin, role, leaveWorkspace, syncStatus, forceSyncNow } = useAuth()
  const [inviteCodes, setInviteCodes] = useState([])
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [copiedCode, setCopiedCode] = useState(null)
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    if (workspaceId && isAdmin) {
      fetchInviteCodes()
      fetchMembers()
    } else {
      setLoading(false)
    }
  }, [workspaceId, isAdmin])

  const fetchInviteCodes = async () => {
    if (!isSupabaseConfigured()) return
    
    const { data } = await supabase
      .from('invite_codes')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })
    
    setInviteCodes(data || [])
    setLoading(false)
  }

  const fetchMembers = async () => {
    if (!isSupabaseConfigured()) return
    
    const { data } = await supabase
      .from('workspace_members')
      .select('*')
      .eq('workspace_id', workspaceId)
    
    setMembers(data || [])
  }

  const generateInviteCode = async () => {
    if (!isSupabaseConfigured() || !workspaceId) return
    setGenerating(true)

    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let code = ''
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }

    const { data, error } = await supabase
      .from('invite_codes')
      .insert({
        workspace_id: workspaceId,
        code
      })
      .select()
      .single()

    if (!error && data) {
      setInviteCodes([data, ...inviteCodes])
    }
    setGenerating(false)
  }

  const deleteInviteCode = async (codeId) => {
    if (!confirm('Are you sure you want to delete this invite code?')) return
    
    const { error } = await supabase
      .from('invite_codes')
      .delete()
      .eq('id', codeId)

    if (!error) {
      setInviteCodes(inviteCodes.filter(c => c.id !== codeId))
    }
  }

  const copyCode = async (code) => {
    await navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const removeMember = async (memberId) => {
    if (!confirm('Are you sure you want to remove this viewer?')) return
    
    const { error } = await supabase
      .from('workspace_members')
      .delete()
      .eq('id', memberId)

    if (!error) {
      setMembers(members.filter(m => m.id !== memberId))
    }
  }

  const handleLeaveWorkspace = async () => {
    if (!confirm('Are you sure you want to leave this workspace? Your local data will be cleared.')) return
    await leaveWorkspace()
  }

  const handleForceSync = async () => {
    setSyncing(true)
    await forceSyncNow()
    setSyncing(false)
  }

  if (!isSupabaseConfigured()) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h2 className="text-lg font-medium text-yellow-800">Supabase Not Configured</h2>
          <p className="text-yellow-700 mt-2">
            Please configure Supabase credentials in your environment variables to enable sync features.
          </p>
        </div>
      </div>
    )
  }

  // Viewer settings page
  if (!isAdmin) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Settings</h1>

        <div className="bg-white border rounded-lg p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-gray-500" />
            <h2 className="text-lg font-medium">Workspace Status</h2>
          </div>
          
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-4">
            <p className="text-blue-700 text-sm">
              You have <strong>view-only</strong> access to this workspace. You can see all data but cannot make changes.
            </p>
          </div>

          {/* Sync Status */}
          <div className="p-4 bg-gray-50 rounded-lg mb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">Sync Status</p>
                {syncStatus.lastSynced && (
                  <p className="text-xs text-gray-500">
                    Last synced: {new Date(syncStatus.lastSynced).toLocaleTimeString()}
                  </p>
                )}
              </div>
              <button
                onClick={handleForceSync}
                disabled={syncing}
                className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                Sync Now
              </button>
            </div>
          </div>

          <button
            onClick={handleLeaveWorkspace}
            className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Leave Workspace
          </button>
        </div>

        <div className="p-4 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-medium text-gray-700">Account Info</h3>
          <p className="text-xs text-gray-500 mt-1">Email: {user?.email}</p>
          <p className="text-xs text-gray-500">Role: Viewer</p>
        </div>
      </div>
    )
  }

  // Admin settings page
  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Settings</h1>

      {/* Sync Status */}
      <div className="bg-white border rounded-lg p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <RefreshCw className="w-5 h-5 text-gray-500" />
          <h2 className="text-lg font-medium">Sync Status</h2>
        </div>
        
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <p className="text-sm font-medium text-gray-700">
              {syncStatus.error ? 'Sync Error' : 'Connected'}
            </p>
            {syncStatus.lastSynced && (
              <p className="text-xs text-gray-500">
                Last synced: {new Date(syncStatus.lastSynced).toLocaleTimeString()}
              </p>
            )}
            {syncStatus.error && (
              <p className="text-xs text-red-500">{syncStatus.error}</p>
            )}
          </div>
          <button
            onClick={handleForceSync}
            disabled={syncing}
            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            Sync Now
          </button>
        </div>
      </div>

      {/* Invite Codes Section */}
      <div className="bg-white border rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Key className="w-5 h-5 text-gray-500" />
            <h2 className="text-lg font-medium">Invite Codes</h2>
          </div>
          <button
            onClick={generateInviteCode}
            disabled={generating}
            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            {generating ? 'Generating...' : 'Generate Code'}
          </button>
        </div>
        
        <p className="text-gray-600 text-sm mb-4">
          Share these codes with viewers. Each code can only be used once.
        </p>

        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : inviteCodes.length === 0 ? (
          <p className="text-gray-500 text-sm">No invite codes yet. Generate one to invite viewers.</p>
        ) : (
          <div className="space-y-2">
            {inviteCodes.map(invite => (
              <div
                key={invite.id}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  invite.used_by ? 'bg-gray-100' : 'bg-green-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <code className={`text-lg font-mono tracking-widest ${
                    invite.used_by ? 'text-gray-400' : 'text-green-700'
                  }`}>
                    {invite.code}
                  </code>
                  {invite.used_by ? (
                    <span className="text-xs text-gray-500 bg-gray-200 px-2 py-0.5 rounded">
                      Used
                    </span>
                  ) : (
                    <span className="text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded">
                      Available
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {!invite.used_by && (
                    <button
                      onClick={() => copyCode(invite.code)}
                      className="flex items-center gap-1 px-2 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded"
                    >
                      {copiedCode === invite.code ? (
                        <><Check className="w-4 h-4" /> Copied!</>
                      ) : (
                        <><Copy className="w-4 h-4" /> Copy</>
                      )}
                    </button>
                  )}
                  <button
                    onClick={() => deleteInviteCode(invite.id)}
                    className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                    title="Delete code"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Current Viewers Section */}
      <div className="bg-white border rounded-lg p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-gray-500" />
          <h2 className="text-lg font-medium">Current Viewers</h2>
        </div>
        
        {members.length === 0 ? (
          <p className="text-gray-500 text-sm">No viewers yet.</p>
        ) : (
          <div className="space-y-2">
            {members.map(member => (
              <div
                key={member.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    User: {member.user_id.slice(0, 8)}...
                  </p>
                  <p className="text-xs text-gray-500">
                    Joined: {new Date(member.invited_at || member.created_at).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => removeMember(member.id)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded"
                  title="Remove viewer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Account Info */}
      <div className="p-4 bg-gray-50 rounded-lg">
        <h3 className="text-sm font-medium text-gray-700">Account Info</h3>
        <p className="text-xs text-gray-500 mt-1">Email: {user?.email}</p>
        <p className="text-xs text-gray-500">Role: Administrator</p>
        <p className="text-xs text-gray-500">Workspace ID: {workspaceId?.slice(0, 8)}...</p>
      </div>
    </div>
  )
}

export default Settings
