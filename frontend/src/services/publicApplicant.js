import { apiBase } from '../utils/apiBase'

export const submitPublicApplicant = async (formData, { onProgress, timeoutMs = 120000 } = {}) => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', `${apiBase}/api/public/applicants`, true)
    xhr.responseType = 'text'
    xhr.timeout = timeoutMs
    xhr.setRequestHeader('Accept', 'application/json')

    if (xhr.upload && typeof onProgress === 'function') {
      xhr.upload.onprogress = (event) => {
        if (!event.lengthComputable) return
        const percent = Math.max(0, Math.min(100, Math.round((event.loaded / event.total) * 100)))
        onProgress(percent)
      }
    }

    xhr.onload = () => resolve(xhr)
    xhr.onerror = () => reject(new Error('Network error'))
    xhr.ontimeout = () => reject(new Error('Timeout'))
    xhr.onabort = () => reject(new Error('Aborted'))
    xhr.send(formData)
  })
}
