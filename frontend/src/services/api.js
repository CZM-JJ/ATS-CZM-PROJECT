import { apiBase } from '../utils/apiBase'
import { buildHeaders, requestBlob, requestJson } from './apiHelpers'

// ============================================================================
// AUTHENTICATION
// ============================================================================
export const authAPI = {
  login: async ({ email, password }) => {
    return requestJson(
      `${apiBase}/api/login`,
      {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      },
      'Login failed'
    )
  },

  logout: async () => {
    await requestJson(`${apiBase}/api/logout`, {
      method: 'POST',
      credentials: 'include',
    }).catch(() => {})
  },

  getCurrentUser: async () => {
    try {
      return await requestJson(
        `${apiBase}/api/me`,
        {
          credentials: 'include',
          headers: buildHeaders(),
        },
        'Failed to fetch user'
      )
    } catch (err) {
      if (err.message.includes('401') || err.message === 'Unauthorized') {
        return null
      }
      throw err
    }
  },

  getPermissions: async () => {
    return requestJson(
      `${apiBase}/api/settings/permissions`,
      {
        credentials: 'include',
        headers: buildHeaders(),
      },
      'Failed to fetch permissions'
    )
  },

  forgotPassword: async (email) => {
    return requestJson(
      `${apiBase}/api/forgot-password`,
      {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      },
      'Failed to send reset email'
    )
  },

  resetPassword: async ({ token, email, password, password_confirmation }) => {
    return requestJson(
      `${apiBase}/api/reset-password`,
      {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, email, password, password_confirmation }),
      },
      'Failed to reset password'
    )
  },
}

// ============================================================================
// COMPANIES
// ============================================================================
export const companyAPI = {
  getAll: async (token) => {
    return requestJson(
      `${apiBase}/api/companies`,
      {
        credentials: 'include',
        headers: buildHeaders({ token }),
      },
      'Failed to fetch companies'
    )
  },
}

// ============================================================================
// APPLICANTS
// ============================================================================
export const applicantAPI = {
  getAll: async (token, params = {}) => {
    const query = new URLSearchParams(params).toString()
    return requestJson(
      `${apiBase}/api/applicants?${query}`,
      {
        headers: buildHeaders({ token }),
      },
      'Failed to fetch applicants'
    )
  },

  getById: async (token, id) => {
    return requestJson(
      `${apiBase}/api/applicants/${id}`,
      {
        headers: buildHeaders({ token }),
      },
      'Failed to fetch applicant'
    )
  },

  create: async (data) => {
    const formData = new FormData()
    Object.keys(data).forEach(key => {
      if (data[key] !== null && data[key] !== undefined) {
        formData.append(key, data[key])
      }
    })

    return requestJson(
      `${apiBase}/api/applicants`,
      {
        method: 'POST',
        credentials: 'include',
        body: formData,
      },
      'Failed to submit application'
    )
  },

  update: async (token, id, data) => {
    return requestJson(
      `${apiBase}/api/applicants/${id}`,
      {
        method: 'PATCH',
        credentials: 'include',
        headers: buildHeaders({ token, contentType: 'application/json' }),
        body: JSON.stringify(data),
      },
      'Failed to update applicant'
    )
  },

  delete: async (token, id) => {
    return requestJson(
      `${apiBase}/api/applicants/${id}`,
      {
        method: 'DELETE',
        credentials: 'include',
        headers: buildHeaders({ token }),
      },
      'Failed to delete applicant'
    )
  },

  restore: async (token, id) => {
    return requestJson(
      `${apiBase}/api/applicants/${id}/restore`,
      {
        method: 'PATCH',
        credentials: 'include',
        headers: buildHeaders({ token }),
      },
      'Failed to restore applicant'
    )
  },

  forceDelete: async (token, id) => {
    return requestJson(
      `${apiBase}/api/applicants/${id}/force`,
      {
        method: 'DELETE',
        credentials: 'include',
        headers: buildHeaders({ token }),
      },
      'Failed to permanently delete applicant'
    )
  },

  bulkDelete: async (token, ids) => {
    return requestJson(
      `${apiBase}/api/applicants`,
      {
        method: 'DELETE',
        credentials: 'include',
        headers: buildHeaders({ token, contentType: 'application/json' }),
        body: JSON.stringify({ ids }),
      },
      'Failed to delete applicants'
    )
  },

  bulkRestore: async (token, ids) => {
    return requestJson(
      `${apiBase}/api/applicants/restore`,
      {
        method: 'PATCH',
        credentials: 'include',
        headers: buildHeaders({ token, contentType: 'application/json' }),
        body: JSON.stringify({ ids }),
      },
      'Failed to restore applicants'
    )
  },

  bulkForceDelete: async (token, ids) => {
    return requestJson(
      `${apiBase}/api/applicants/force`,
      {
        method: 'DELETE',
        credentials: 'include',
        headers: buildHeaders({ token, contentType: 'application/json' }),
        body: JSON.stringify({ ids }),
      },
      'Failed to permanently delete applicants'
    )
  },

  getCv: async (token, id) => {
    return requestBlob(
      `${apiBase}/api/applicants/${id}/cv`,
      {
        credentials: 'include',
        headers: {
          ...buildHeaders({ token }),
          Accept: 'application/json',
        },
      },
      'Failed to fetch CV'
    )
  },
}

// ============================================================================
// APPLICANT NOTES
// ============================================================================
export const noteAPI = {
  getByApplicant: async (token, applicantId) => {
    return requestJson(
      `${apiBase}/api/applicants/${applicantId}/notes`,
      {
        headers: buildHeaders({ token }),
      },
      'Failed to fetch notes'
    )
  },

  create: async (token, applicantId, note) => {
    return requestJson(
      `${apiBase}/api/applicants/${applicantId}/notes`,
      {
        method: 'POST',
        credentials: 'include',
        headers: buildHeaders({ token, contentType: 'application/json' }),
        body: JSON.stringify({ note }),
      },
      'Failed to create note'
    )
  },
}

// ============================================================================
// POSITIONS
// ============================================================================
export const positionAPI = {
  getPublic: async () => {
    return requestJson(
      `${apiBase}/api/positions`,
      {
        headers: { 'Content-Type': 'application/json' },
      },
      'Failed to fetch positions'
    )
  },

  getAll: async (token) => {
    return requestJson(
      `${apiBase}/api/positions/all`,
      {
        headers: buildHeaders({ token }),
      },
      'Failed to fetch positions'
    )
  },

  getPaginated: async (token, params = {}) => {
    const query = new URLSearchParams({
      page: String(params.page ?? 1),
      per_page: String(params.per_page ?? 20),
      ...(params.search ? { search: params.search } : {}),
      ...(params.status ? { status: params.status } : {}),
      ...(params.sort ? { sort: params.sort } : {}),
      ...(params.direction ? { direction: params.direction } : {}),
    }).toString()
    return requestJson(
      `${apiBase}/api/positions/admin?${query}`,
      {
        headers: buildHeaders({ token }),
      },
      'Failed to fetch positions'
    )
  },

  create: async (token, data) => {
    return requestJson(
      `${apiBase}/api/positions`,
      {
        method: 'POST',
        credentials: 'include',
        headers: buildHeaders({ token, contentType: 'application/json' }),
        body: JSON.stringify(data),
      },
      'Failed to create position'
    )
  },

  update: async (token, id, data) => {
    return requestJson(
      `${apiBase}/api/positions/${id}`,
      {
        method: 'PATCH',
        credentials: 'include',
        headers: buildHeaders({ token, contentType: 'application/json' }),
        body: JSON.stringify(data),
      },
      'Failed to update position'
    )
  },

  delete: async (token, id) => {
    return requestJson(
      `${apiBase}/api/positions/${id}`,
      {
        method: 'DELETE',
        credentials: 'include',
        headers: buildHeaders({ token }),
      },
      'Failed to delete position'
    )
  },

  bulkDelete: async (token, ids) => {
    return requestJson(
      `${apiBase}/api/positions/bulk`,
      {
        method: 'DELETE',
        credentials: 'include',
        headers: buildHeaders({ token, contentType: 'application/json' }),
        body: JSON.stringify({ ids }),
      },
      'Failed to delete positions'
    )
  },

  toggle: async (token, id, isActive) => {
    return requestJson(
      `${apiBase}/api/positions/${id}/toggle`,
      {
        method: 'PATCH',
        credentials: 'include',
        headers: buildHeaders({ token, contentType: 'application/json' }),
        body: JSON.stringify({ is_active: isActive }),
      },
      'Failed to toggle position'
    )
  },
}

// ============================================================================
// USERS
// ============================================================================
export const userAPI = {
  getAll: async (token) => {
    return requestJson(
      `${apiBase}/api/users`,
      {
        credentials: 'include',
        headers: buildHeaders({ token }),
      },
      'Failed to fetch users'
    )
  },

  create: async (token, data) => {
    return requestJson(
      `${apiBase}/api/users`,
      {
        method: 'POST',
        credentials: 'include',
        headers: buildHeaders({ token, contentType: 'application/json' }),
        body: JSON.stringify(data),
      },
      'Failed to create user'
    )
  },

  update: async (token, id, data) => {
    return requestJson(
      `${apiBase}/api/users/${id}`,
      {
        method: 'PATCH',
        credentials: 'include',
        headers: buildHeaders({ token, contentType: 'application/json' }),
        body: JSON.stringify(data),
      },
      'Failed to update user'
    )
  },

  delete: async (token, id) => {
    return requestJson(
      `${apiBase}/api/users/${id}`,
      {
        method: 'DELETE',
        credentials: 'include',
        headers: buildHeaders({ token }),
      },
      'Failed to delete user'
    )
  },

  updatePermissions: async (token, permissions) => {
    return requestJson(
      `${apiBase}/api/settings/permissions`,
      {
        method: 'PUT',
        credentials: 'include',
        headers: buildHeaders({ token, contentType: 'application/json' }),
        body: JSON.stringify(permissions),
      },
      'Failed to update permissions'
    )
  },
}

// ============================================================================
// NOTIFICATIONS
// ============================================================================
export const notificationAPI = {
  getAll: async (token) => {
    return requestJson(
      `${apiBase}/api/notifications`,
      {
        credentials: 'include',
        headers: buildHeaders({ token }),
      },
      'Failed to fetch notifications'
    )
  },

  markRead: async (token, id) => {
    return requestJson(
      `${apiBase}/api/notifications/${id}/read`,
      {
        method: 'PATCH',
        credentials: 'include',
        headers: buildHeaders({ token }),
      },
      'Failed to mark notification as read'
    )
  },

  markAllRead: async (token) => {
    return requestJson(
      `${apiBase}/api/notifications/read-all`,
      {
        method: 'PATCH',
        credentials: 'include',
        headers: buildHeaders({ token }),
      },
      'Failed to mark all notifications as read'
    )
  },
}

// ============================================================================
// AUDIT LOGS
// ============================================================================
export const auditLogAPI = {
  getAll: async (token, params = {}) => {
    const query = new URLSearchParams(params).toString()
    return requestJson(
      `${apiBase}/api/audit-logs?${query}`,
      {
        credentials: 'include',
        headers: buildHeaders({ token }),
      },
      'Failed to fetch audit logs'
    )
  },

  getTimeline: async (token, applicantId) => {
    return requestJson(
      `${apiBase}/api/applicants/${applicantId}/timeline`,
      {
        credentials: 'include',
        headers: buildHeaders({ token }),
      },
      'Failed to fetch applicant timeline'
    )
  },
}

// ============================================================================
// ANALYTICS
// ============================================================================
export const analyticsAPI = {
  getDashboard: async (token, params = {}) => {
    const query = new URLSearchParams(params).toString()
    return requestJson(
      `${apiBase}/api/dashboard/overview?${query}`,
      {
        credentials: 'include',
        headers: buildHeaders({ token }),
      },
      'Failed to fetch analytics'
    )
  },
}

