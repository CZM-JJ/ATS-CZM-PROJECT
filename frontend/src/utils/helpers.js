// ============================================================================
// STRING FORMATTING
// ============================================================================

/**
 * Format status value to readable text (e.g., "interview_scheduled" → "Interview Scheduled")
 */
export const formatStatus = (value) => {
  if (!value) return ''
  return value
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

/**
 * Get short status label from SHORT_STATUS map
 */
export const shortStatus = (v, statusMap) => {
  return statusMap?.[v] ?? formatStatus(v)
}

/**
 * Format name to title case
 */
export const toName = (str) =>
  str ? str.trim().toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()) : ''

/**
 * Convert all-caps text to title case, but preserve other user input as-is.
 */
export const formatText = (value) => {
  if (value === null || value === undefined) return ''
  const text = String(value).trim()
  if (text === '') return ''
  const letters = text.replace(/[^A-Za-z]/g, '')
  if (!letters || letters !== letters.toUpperCase()) return text
  return text.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
}

/**
 * Format date to readable string (e.g., "January 25, 2026")
 */
export const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A'
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

/**
 * Format date and time to readable string (e.g., "Jan 25, 2026, 2:30 PM")
 */
export const formatDateTime = (dateStr) => {
  if (!dateStr) return 'N/A'
  return new Date(dateStr).toLocaleString()
}

/**
 * Format value as currency (PHP)
 */
export const formatCurrency = (value) => {
  if (value === null || value === undefined || value === '') return 'N/A'
  const num = Number(value)
  return Number.isFinite(num) ? `PHP ${num.toLocaleString()}` : String(value)
}

/**
 * Return safe value for display (fallback to 'N/A')
 */
export const safeValue = (value) =>
  value === null || value === undefined || value === '' ? 'N/A' : value

/**
 * Format time relative to now (e.g., "2m ago", "1h ago")
 */
export const timeAgo = (dateStr) => {
  if (!dateStr) return ''
  const diff = (Date.now() - new Date(dateStr)) / 1000
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

/**
 * Format notification time (e.g., "Dec 25, 2026, 2:30 PM")
 */
export const formatNotifTime = (iso) => {
  if (!iso) return ''
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

/**
 * Format notification time ago with better granularity
 */
export const formatNotifTimeAgo = (iso) => {
  if (!iso) return ''
  const diffSec = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (diffSec < 60) return 'just now'
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`
  if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

// ============================================================================
// FORM UTILITIES
// ============================================================================

/**
 * Extract meaningful error message from API response
 */
export const extractError = async (response) => {
  try {
    const payload = await response.json()

    if (payload?.message) {
      return payload.message
    }

    if (payload?.errors) {
      const firstKey = Object.keys(payload.errors)[0]
      if (firstKey && Array.isArray(payload.errors[firstKey])) {
        return payload.errors[firstKey][0]
      }
    }
  } catch {
    // Silent fail - return generic message
  }

  return 'Unable to complete the request. Please try again.'
}

/**
 * Extract error from XHR response
 */
export const extractXhrError = (xhr) => {
  try {
    const payload = JSON.parse(xhr.responseText || '{}')
    if (payload?.message) return payload.message
    if (payload?.errors) {
      const firstKey = Object.keys(payload.errors)[0]
      if (firstKey) return payload.errors[firstKey][0]
    }
  } catch {
    // If we can't parse JSON, try to return status text
    if (xhr.statusText) return xhr.statusText
  }
  return 'Unable to complete the request. Please try again.'
}

/**
 * Clean filter object to remove empty values
 */
export const cleanFilters = (filters) => {
  return Object.fromEntries(
    Object.entries(filters).filter(([, v]) => v !== undefined && v !== null && v !== '')
  )
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Validate email format
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validate phone number (basic format)
 */
export const isValidPhone = (phone) => {
  const phoneRegex = /^\+?[\d\s\-()]+$/
  return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10
}

/**
 * Validate file size (in bytes)
 */
export const isValidFileSize = (file, maxSizeInMB = 5) => {
  return file.size <= maxSizeInMB * 1024 * 1024
}

/**
 * Validate file type
 */
export const isValidFileType = (file, allowedTypes = ['application/pdf', 'application/msword']) => {
  return allowedTypes.includes(file.type)
}
