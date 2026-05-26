import { createContext, useContext, useLayoutEffect, useState } from 'react'
import { authAPI } from '../services/api'
import { PERMISSION_DEFAULTS } from '../utils/constants'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [permissions, setPermissions] = useState(PERMISSION_DEFAULTS)


  const refresh = async () => {
    setIsLoading(true)
    try {
      const profile = await authAPI.getCurrentUser()
      setUser(profile)

      const perms = await authAPI.getPermissions().catch(() => null)
      if (perms) setPermissions(perms)
    } catch {
      setUser(null)
      setPermissions(PERMISSION_DEFAULTS)
    } finally {
      setIsLoading(false)
    }
  }

  useLayoutEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const login = async (credentials) => {
    await authAPI.login(credentials)
    await refresh()
  }

  const logout = async () => {
    await authAPI.logout().catch(() => {})
    setUser(null)
    setPermissions(PERMISSION_DEFAULTS)
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, permissions, setPermissions, refresh }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}

export function useRole() {
  const { user, permissions } = useAuth()
  const role = user?.role

  return {
    isAdmin: role === 'admin',
    canEdit: permissions?.canEdit?.includes(role),
    canDelete: permissions?.canDelete?.includes(role),
    canManagePositions: permissions?.canManagePositions?.includes(role),
    canViewAnalytics: permissions?.canViewAnalytics?.includes(role),
    canManageUsers: permissions?.canManageUsers?.includes(role),
  }
}
