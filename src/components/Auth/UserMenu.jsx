import { useState } from 'react'
import { LogOut, RefreshCw, User, Check, AlertCircle, WifiOff } from 'lucide-react'
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

  const hasSyncError = !!syncStatus.error

  return (
    <>
      {/* Persistent error banner shown at top level when sync fails */}
      {hasSyncError && !isOpen && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-red-600 text-white text-xs px-4 py-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <WifiOff className="w-3.5 h-3.5 flex-shrink-0" />
            <span>Sync error — your data may not be up to date. Open the user menu to retry.</span>
          </div>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="underline whitespace-nowrap disabled:opacity-60"
          >
            {syncing ? 'Retrying...' : 'Retry now'}
          </button>
        </div>
      )}

      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors ${hasSyncError ? 'ring-2 ring-red-400' : ''}`}
        >
          <div className="relative w-8 h-8">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
              {user.email?.[0]?.toUpperCase() || 'U'}
            </div>
            {hasSyncError && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-white" />
            )}
          </div>
          <div className="hidden md:flex flex-col items-start">
            <span className="text-sm font-medium text-gray-700">
              {user.user_metadata?.full_name || user.email?.split('@')[0]}
            </span>
            <span className={`text-xs ${hasSyncError ? 'text-red-500' : 'text-gray-500'}`}>
              {hasSyncError ? 'Sync error' : isAdmin ? 'Admin' : 'Viewer'}
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

                {hasSyncError ? (
                  <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
                    <div className="flex items-start gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-medium text-red-700">Sync failed</p>
                        <p className="text-xs text-red-600 mt-0.5">{syncStatus.error}</p>
                        <p className="text-xs text-red-500 mt-1">
                          Your data is saved locally. Click "Sync Now" to retry.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 mt-1">
                    <Check className="w-3 h-3 text-green-500" />
                    <span className="text-xs text-gray-500">Last: {formatLastSynced()}</span>
                  </div>
                )}

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
    </>
  )
}
