import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { Copy, Check, Users, Trash2, ExternalLink } from 'lucide-react'

export const Settings = () => {
  const { user, workspaceId, isAdmin, role } = useAuth()
  const [inviteLink, setInviteLink] = useState('')
  const [copied, setCopied] = useState(false)
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (workspaceId) {
      fetchMembers()
    }
  }, [workspaceId])

  const fetchMembers = async () => {
    if (!isSupabaseConfigured()) return
    
    const { data } = await supabase
      .from('workspace_members')
      .select('*')
      .eq('workspace_id', workspaceId)
    
    setMembers(data || [])
    setLoading(false)
  }

  const generateInviteLink = () => {
    const link = `${window.location.origin}/join/${workspaceId}`
    setInviteLink(link)
  }

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(inviteLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const removeMember = async (memberId) => {
    if (!confirm('Are you sure you want to remove this member?')) return
    
    const { error } = await supabase
      .from('workspace_members')
      .delete()
      .eq('id', memberId)

    if (!error) {
      setMembers(members.filter(m => m.id !== memberId))
    }
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

  if (!isAdmin) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h2 className="text-lg font-medium text-gray-800">Settings</h2>
          <p className="text-gray-600 mt-2">
            You have view-only access. Contact the administrator to make changes.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Settings</h1>

      <div className="bg-white border rounded-lg p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-gray-500" />
          <h2 className="text-lg font-medium">Invite Viewers</h2>
        </div>
        
        <p className="text-gray-600 text-sm mb-4">
          Generate a link to invite viewers who can only view your data (cannot edit).
        </p>

        {!inviteLink ? (
          <button
            onClick={generateInviteLink}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Generate Invite Link
          </button>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
              <input
                type="text"
                value={inviteLink}
                readOnly
                className="flex-1 bg-transparent text-sm text-gray-600 outline-none"
              />
              <button
                onClick={copyToClipboard}
                className="flex items-center gap-1 px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <a
              href={inviteLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
            >
              <ExternalLink className="w-4 h-4" />
              Open invite link
            </a>
          </div>
        )}
      </div>

      <div className="bg-white border rounded-lg p-6">
        <h2 className="text-lg font-medium mb-4">Current Viewers</h2>
        
        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : members.length === 0 ? (
          <p className="text-gray-500 text-sm">No viewers invited yet.</p>
        ) : (
          <div className="space-y-2">
            {members.map(member => (
              <div
                key={member.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="text-sm font-medium text-gray-700">User ID: {member.user_id.slice(0, 8)}...</p>
                  <p className="text-xs text-gray-500">
                    Joined: {new Date(member.invited_at).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => removeMember(member.id)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-sm font-medium text-gray-700">Account Info</h3>
        <p className="text-xs text-gray-500 mt-1">Email: {user?.email}</p>
        <p className="text-xs text-gray-500">Role: Administrator</p>
      </div>
    </div>
  )
}

export default Settings
