import { createContext, useContext, useLayoutEffect, useState } from 'react'
import { authAPI } from '../services/api'
import { PERMISSION_DEFAULTS } from '../utils/constants'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken]           = useState(() => localStorage.getItem('ats_token') || '')
  const [user, setUser]             = useState(null)
  const [isLoading, setIsLoading]   = useState(true)
  const [permissions, setPermissions] = useState(PERMISSION_DEFAULTS)

  // Load user profile and reset state when token changes
  useLayoutEffect(() => {
    if (!token) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUser(() => null)
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPermissions(() => PERMISSION_DEFAULTS)
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsLoading(() => false)
      return
    }

    setIsLoading(() => true)
    authAPI.getCurrentUser(token)
      .then((profile) => setUser(() => profile))
      .catch(() => {
        setToken(() => '')
        localStorage.removeItem('ats_token')
        setUser(() => null)
      })
      .finally(() => setIsLoading(() => false))

    // Load permissions
    authAPI.getPermissions(token)
      .then((data) => { if (data) setPermissions(() => data) })
      .catch(() => {}) // silently fall back to defaults
  }, [token])

  const login = (newToken) => {
    localStorage.setItem('ats_token', newToken)
    setToken(newToken)
  }

  const logout = async () => {
    if (token) {
      await authAPI.logout(token).catch(() => {})
    }
    localStorage.removeItem('ats_token')
    setToken('')
    setUser(null)
    setPermissions(PERMISSION_DEFAULTS)
  }

  return (
    <AuthContext.Provider value={{ token, user, isLoading, login, logout, permissions, setPermissions }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}

// ── Role helpers ───────────────────────────────────────────────────────────
// eslint-disable-next-line react-refresh/only-export-components
export function useRole() {
  const { user, permissions } = useAuth()
  const role = user?.role ?? null
  const can  = (perm) => (permissions[perm] ?? PERMISSION_DEFAULTS[perm] ?? []).includes(role)
  return {
    role,
    isAdmin:        role === 'admin',
    isHrManager:    role === 'hr_manager',
    isHrSupervisor: role === 'hr_supervisor',
    isRecruiter:    role === 'recruiter',
    // dynamic permission checks (read from DB-backed permissions)
    canEdit:            can('canEdit'),
    canDelete:          can('canDelete'),
    canManagePositions: can('canManagePositions'),
    canViewAnalytics:   can('canViewAnalytics'),
    canManageUsers:     can('canManageUsers'),
    // generic helper
    hasRole: (...roles) => roles.includes(role),
  }
}
