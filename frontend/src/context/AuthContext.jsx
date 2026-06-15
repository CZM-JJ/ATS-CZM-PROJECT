import { createContext, useContext, useLayoutEffect, useState } from 'react'
import { authAPI } from '../services/api'
import { PERMISSION_DEFAULTS } from '../utils/constants'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(() => {
    if (typeof window === 'undefined') return null
    return window.localStorage.getItem('ats_token') || window.sessionStorage.getItem('ats_token') || null
  })
  const [isLoading, setIsLoading] = useState(true)
  const [permissions, setPermissions] = useState(PERMISSION_DEFAULTS)

  const getStorage = () => {
    if (typeof window === 'undefined') return null
    return window.localStorage.getItem('ats_remember_me') === 'true'
      ? window.localStorage
      : window.sessionStorage
  }

  const refresh = async (overrideToken = null) => {
    setIsLoading(true)
    const currentToken = overrideToken || token

    if (!currentToken) {
      setUser(null)
      setPermissions(PERMISSION_DEFAULTS)
      setIsLoading(false)
      return
    }

    try {
      const profile = await authAPI.getCurrentUser(currentToken)
      setUser(profile)
      if (profile?.token && profile.token !== currentToken) {
        setToken(profile.token)
        const storage = getStorage() || window.localStorage
        storage.setItem('ats_token', profile.token)
      }

      const perms = await authAPI.getPermissions(currentToken).catch(() => null)
      if (perms) setPermissions(perms)
    } catch (err) {
      console.error('Auth refresh failed:', err)
      setUser(null)
      setToken(null)
      window.localStorage.removeItem('ats_token')
      window.sessionStorage.removeItem('ats_token')
      setPermissions(PERMISSION_DEFAULTS)
    } finally {
      setIsLoading(false)
    }
  }

  useLayoutEffect(() => {
    refresh()
  }, [])

  const login = async (credentials, remember = false) => {
    const result = await authAPI.login(credentials)
    const newToken = result?.token || result?.access_token || result?.data?.token || null
    if (newToken) {
      window.localStorage.setItem('ats_remember_me', remember ? 'true' : 'false')
      const storage = remember ? window.localStorage : window.sessionStorage
      storage.setItem('ats_token', newToken)
      setToken(newToken)
      await refresh(newToken)
    } else {
      throw new Error('No token received from login')
    }
  }

  const logout = async () => {
    await authAPI.logout(token).catch(() => {})
    setUser(null)
    setToken(null)
    window.localStorage.removeItem('ats_token')
    window.localStorage.removeItem('ats_remember_me')
    window.sessionStorage.removeItem('ats_token')
    setPermissions(PERMISSION_DEFAULTS)
  }

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, permissions, setPermissions, refresh }}>
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
