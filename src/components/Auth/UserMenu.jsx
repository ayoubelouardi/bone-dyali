import { useState } from 'react'
import { LogOut, RefreshCw, User, Check, AlertCircle } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

export const UserMenu = () => {
  const { user, role, isAdmin, signOut, syncStatus, forceSyncNow } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [syncing, setSyncing] = useState(false)

  if (!user) return null

  const handleSync = async () => {
    setSyncing(true)
    await forceSyncNow()
    setSyncing(false)
  }

  const formatLastSynced = () => {
    if (!syncStatus.lastSynced) return 'Never'
    const date = new Date(syncStatus.lastSynced)
    return date.toLocaleTimeString()
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
          {user.email?.[0]?.toUpperCase() || 'U'}
        </div>
        <div className="hidden md:flex flex-col items-start">
          <span className="text-sm font-medium text-gray-700">
            {user.user_metadata?.full_name || user.email?.split('@')[0]}
          </span>
          <span className="text-xs text-gray-500">
            {isAdmin ? 'Admin' : 'Viewer'}
          </span>
        </div>
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border z-20">
            <div className="p-3 border-b">
              <div className="flex items-center gap-2 mb-1">
                <User className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium">{role === 'admin' ? 'Administrator' : 'Viewer'}</span>
                {role === 'admin' && <Check className="w-4 h-4 text-green-500" />}
              </div>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            </div>

            <div className="p-3 border-b">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Sync Status</span>
                <button
                  onClick={handleSync}
                  disabled={syncing}
                  className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3 h-3 ${syncing ? 'animate-spin' : ''}`} />
                  {syncing ? 'Syncing...' : 'Sync Now'}
                </button>
              </div>
              <div className="flex items-center gap-1 mt-1">
                {syncStatus.error ? (
                  <>
                    <AlertCircle className="w-3 h-3 text-red-500" />
                    <span className="text-xs text-red-500">{syncStatus.error}</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3 h-3 text-green-500" />
                    <span className="text-xs text-gray-500">Last: {formatLastSynced()}</span>
                  </>
                )}
              </div>
              {!isAdmin && (
                <p className="text-xs text-gray-400 mt-2">
                  You have view-only access
                </p>
              )}
            </div>

            <button
              onClick={signOut}
              className="w-full flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm">Sign Out</span>
            </button>
          </div>
        </>
      )}
    </div>
  )
}
