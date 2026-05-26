import { apiBase } from '../utils/apiBase'

const withDefaultOptions = async (options = {}) => {
  const headers = {
    'X-Requested-With': 'XMLHttpRequest',
    'Accept': 'application/json',
    ...(options.headers || {}),
  }
  
  return {
    ...options,
    headers,
  }
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
    const error = new Error(`${serverMsg}${res.status ? ` (${res.status} ${res.statusText})` : ''}`)
    error.status = res.status
    error.response = res
    throw error
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

export const buildHeaders = ({ token, contentType } = {}) => {
  const headers = {}
  if (token) headers.Authorization = `Bearer ${token}`
  if (contentType) headers['Content-Type'] = contentType
  return headers
}
