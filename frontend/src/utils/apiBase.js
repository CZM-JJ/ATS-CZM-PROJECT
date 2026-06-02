const explicitApiBase = import.meta.env.VITE_API_BASE_URL

export function getApiBase() {
  if (explicitApiBase && explicitApiBase.trim()) {
    return explicitApiBase.trim().replace(/\/$/, '')
  }

  if (import.meta.env.DEV) {
    return `http://${window.location.hostname}:8000`
  }

  return window.location.origin
}

export const apiBase = getApiBase()