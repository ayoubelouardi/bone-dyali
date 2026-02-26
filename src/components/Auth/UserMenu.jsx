import { useState } from 'react'
import { LogOut, User, Check } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

export const UserMenu = () => {
  const { user, role, isAdmin, signOut } = useAuth()
  const [isOpen, setIsOpen] = useState(false)

  if (!user) return null

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
          <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border z-20">
            <div className="p-3 border-b">
              <div className="flex items-center gap-2 mb-1">
                <User className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium">{role === 'admin' ? 'Administrator' : 'Viewer'}</span>
                {role === 'admin' && <Check className="w-4 h-4 text-green-500" />}
              </div>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
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
