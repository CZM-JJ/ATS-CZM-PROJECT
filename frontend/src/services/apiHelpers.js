export const requestJson = async (url, options = {}, errorMessage = 'Request failed') => {
  const res = await fetch(url, options)
  if (!res.ok) throw new Error(errorMessage)
  if (res.status === 204 || res.status === 205) return null
  const text = await res.text()
  if (!text) return null
  return JSON.parse(text)
}

export const requestBlob = async (url, options = {}, errorMessage = 'Request failed') => {
  const res = await fetch(url, options)
  if (!res.ok) throw new Error(errorMessage)
  return res.blob()
}

export const buildHeaders = ({ token, contentType } = {}) => {
  const headers = {}
  if (token) headers.Authorization = `Bearer ${token}`
  if (contentType) headers['Content-Type'] = contentType
  return headers
}
