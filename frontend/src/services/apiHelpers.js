import { apiBase } from '../utils/apiBase'

const CSRF_COOKIE_URL = `${apiBase}/sanctum/csrf-cookie`

const isUnsafeMethod = (method) => {
  const m = (method || 'GET').toUpperCase()
  return !['GET', 'HEAD', 'OPTIONS'].includes(m)
}

const getCookie = (name) => {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(
    new RegExp(
      `(?:^|; )${name.replace(/([.$?*|{}()\[\]\\\/\+^])/g, '\\$1')}=([^;]*)`
    )
  )
  return match ? match[1] : null
}

const ensureCsrfCookie = async () => {
  if (getCookie('XSRF-TOKEN')) return
  await fetch(CSRF_COOKIE_URL, { method: 'GET', credentials: 'include' })
}

const withDefaultOptions = async (options = {}) => {
  const merged = {
    credentials: 'include',
    ...options,
    headers: {
      'X-Requested-With': 'XMLHttpRequest',
      ...(options.headers || {}),
    },
  }

  if (isUnsafeMethod(merged.method)) {
    await ensureCsrfCookie()
    const xsrf = getCookie('XSRF-TOKEN')
    if (xsrf) {
      merged.headers['X-XSRF-TOKEN'] = decodeURIComponent(xsrf)
    }
  }

  return merged
}

export const requestJson = async (url, options = {}, errorMessage = 'Request failed') => {
  const finalOptions = await withDefaultOptions(options)
  const res = await fetch(url, finalOptions)
  const text = await res.text()
  let data = null
  try {
    data = text ? JSON.parse(text) : null
  } catch (e) {
    data = null
  }

  if (!res.ok) {
    const serverMsg = data && data.message ? data.message : errorMessage
    throw new Error(serverMsg)
  }

  if (res.status === 204 || res.status === 205) return null
  if (!text) return null
  return data
}

export const requestBlob = async (url, options = {}, errorMessage = 'Request failed') => {
  const finalOptions = await withDefaultOptions(options)
  const res = await fetch(url, finalOptions)
  if (!res.ok) {
    const text = await res.text()
    let data = null
    try {
      data = text ? JSON.parse(text) : null
    } catch (e) {
      data = null
    }
    const serverMsg = data && data.message
      ? data.message
      : `${errorMessage}${res.status ? ` (${res.status} ${res.statusText})` : ''}`
    throw new Error(serverMsg)
  }
  return res.blob()
}

export const buildHeaders = ({ contentType } = {}) => {
  const headers = {}
  if (contentType) headers['Content-Type'] = contentType
  return headers
}
