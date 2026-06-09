
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useAuth } from '../context/AuthContext'
import { useNavigate, useSearchParams } from 'react-router-dom'
import AdminLayout from '../components/AdminLayout'
import Toast from '../components/Toast'
import { positionAPI, companyAPI } from '../services/api'


const emptyForm = {
  title: '',
  location: '',
  salary_min: '',
  salary_max: '',
  company_id: '',
  is_active: true,
}


function AdminPositionsPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { token, user } = useAuth()

  const getParam = (key, defaultValue = '') => searchParams.get(key) ?? defaultValue

  const [positions, setPositions]       = useState([])
  const [companies, setCompanies]       = useState([])
  const [loading, setLoading]           = useState(false)
  const [error, setError]               = useState(null)
  const [success, setSuccess]           = useState(null)
  const [toastType, setToastType]       = useState('success')

  // Filter states
  const [searchTerm, setSearchTerm]     = useState(() => getParam('search', ''))
  const [statusFilter, setStatusFilter] = useState(() => getParam('status', ''))
  const [page, setPage]                 = useState(() => parseInt(getParam('page', '1'), 10) || 1)
  const [perPage, setPerPage]           = useState(() => parseInt(getParam('per_page', '20'), 10) || 20)
  const [lastPage, setLastPage]         = useState(1)
  const [total, setTotal]               = useState(0)
  const [sort, setSort]                 = useState(() => getParam('sort', 'created_at'))
  const [direction, setDirection]       = useState(() => getParam('direction', 'desc'))

  // Modal state
  const [modalOpen, setModalOpen]       = useState(false)
  const [editing, setEditing]           = useState(null) // null = adding new
  const [form, setForm]                 = useState(emptyForm)
  const [saving, setSaving]             = useState(false)
  const [formError, setFormError]       = useState(null)

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting]         = useState(false)

  // Toggle loading
  const [togglingId, setTogglingId] = useState(null)

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState([])
  const toggleSelect = (id) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])
  }
  const toggleSelectAll = () => {
    if (selectedIds.length === positions.length && positions.length > 0) {
      setSelectedIds([])
    } else {
      setSelectedIds(positions.map((p) => p.id))
    }
  }
  const clearSelection = () => setSelectedIds([])

  const handleSort = (field) => {
    if (sort === field) {
      setDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSort(field)
      setDirection('asc')
    }
    setPage(1)
  }

  // Bulk delete
  const handleBulkDelete = async () => {
    if (!selectedIds.length) return
    if (!window.confirm(`Delete ${selectedIds.length} selected position(s)?`)) return
    setLoading(true)
    try {
      await positionAPI.bulkDelete(token, selectedIds)
      setPositions((prev) => prev.filter((p) => !selectedIds.includes(p.id)))
      setTotal((t) => t - selectedIds.length)
      setSelectedIds([])
      setError(null)
      setSuccess(`${selectedIds.length} position${selectedIds.length !== 1 ? 's' : ''} deleted.`)
      setToastType('danger')
      setTimeout(() => { setSuccess(null); setToastType('success') }, 4000)
    } catch {
      setError('Failed to delete selected positions.')
      setSuccess(null)
    } finally {
      setLoading(false)
    }
  }

  const anyConfirmModalOpen = !!deleteTarget
  const anyModalOpen = modalOpen || anyConfirmModalOpen

  useEffect(() => {
    if (!anyModalOpen) return
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = originalOverflow }
  }, [anyModalOpen])

  useEffect(() => {
    if (!anyModalOpen) return
    const onKeyDown = (event) => {
      if (event.key !== 'Escape') return
      if (!saving) setModalOpen(false)
      if (!deleting) setDeleteTarget(null)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [anyModalOpen, saving, deleting])

  const loadPositions = async (activeToken, params = {}) => {
    setLoading(true)
    setError(null)
    try {
      const payload = await positionAPI.getPaginated(activeToken, params)
      setPositions(payload.data || [])
      setPage(payload.meta?.current_page ?? payload.current_page ?? 1)
      setLastPage(payload.meta?.last_page ?? payload.last_page ?? 1)
      setTotal(payload.meta?.total ?? payload.total ?? 0)
    } catch {
      setError('Failed to load positions.')
    } finally {
      setLoading(false)
    }
  }

  const loadCompanies = async () => {
    try {
      const payload = await companyAPI.getAll(token)
      setCompanies(Array.isArray(payload) ? payload : (payload?.data ?? []))
    } catch (e) {
      console.error('Failed to load companies', e)
    }
  }

  useEffect(() => {
    if (!user) return
    const timer = setTimeout(() => {
      loadPositions(token, {
        search: searchTerm.trim() || undefined,
        status: statusFilter.trim() || undefined,
        sort,
        direction,
        page,
        per_page: perPage,
      })
    }, 300)
    return () => clearTimeout(timer)
  }, [user, searchTerm, statusFilter, sort, direction, page, perPage, token])

  useEffect(() => {
    const params = new URLSearchParams()
    if (searchTerm) params.set('search', searchTerm)
    if (statusFilter) params.set('status', statusFilter)
    if (page > 1) params.set('page', String(page))
    if (perPage !== 20) params.set('per_page', String(perPage))
    if (sort) params.set('sort', sort)
    if (direction) params.set('direction', direction)
    setSearchParams(params, { replace: true })
  }, [searchTerm, statusFilter, page, perPage, sort, direction, setSearchParams])

  useEffect(() => {
    if (!user) return
    loadCompanies()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const openAdd = () => {
    setEditing(null)
    setForm(emptyForm)
    setFormError(null)
    setModalOpen(true)
  }

  const openEdit = (position) => {
    setEditing(position)
    setForm({
      title: position.title ?? '',
      location: position.location ?? '',
      salary_min: position.salary_min ?? '',
      salary_max: position.salary_max ?? '',
      company_id: position.company_id != null ? String(position.company_id) : '',
      is_active: position.is_active ?? true,
    })
    setFormError(null)
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditing(null)
    setForm(emptyForm)
    setFormError(null)
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (saving) return
    setSaving(true)
    setFormError(null)
    try {
      const body = {
        title: form.title.trim(),
        location: form.location.trim(),
        salary_min: form.salary_min !== '' ? Number(form.salary_min) : null,
        salary_max: form.salary_max !== '' ? Number(form.salary_max) : null,
        company_id: form.company_id ? Number(form.company_id) : null,
        is_active: form.is_active,
      }
      const saved = editing
        ? await positionAPI.update(token, editing.id, body)
        : await positionAPI.create(token, body)
      if (editing) {
        setPositions((prev) => prev.map((p) => (p.id === saved.id ? mergePosition(p, saved) : p)))
      } else {
        setPositions((prev) => [saved, ...prev])
        setTotal((t) => t + 1)
      }
      closeModal()
    } catch {
      setFormError('An unexpected error occurred.')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleActive = async (position) => {
    setTogglingId(position.id)
    try {
      const updated = await positionAPI.toggle(token, position.id, !position.is_active)
      setPositions((prev) => prev.map((p) => (p.id === updated.id ? mergePosition(p, updated) : p)))
    } catch {
      setError('Failed to toggle status.')
    } finally {
      setTogglingId(null)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await positionAPI.delete(token, deleteTarget.id)
      setPositions((prev) => prev.filter((p) => p.id !== deleteTarget.id))
      setTotal((t) => t - 1)
      setDeleteTarget(null)
      setError(null)
      setSuccess('Position deleted successfully.')
      setToastType('danger')
      setTimeout(() => { setSuccess(null); setToastType('success') }, 4000)
    } catch {
      setError('Failed to delete position.')
      setSuccess(null)
    } finally {
      setDeleting(false)
    }
  }

  const resolveCompanyName = (position) => {
    if (position?.company?.name) return position.company.name
    const companyId = Number(position?.company_id)
    if (!companyId) return null
    return companies.find((c) => Number(c.id) === companyId)?.name ?? null
  }

  const mergePosition = (previous, next) => ({
    ...previous,
    ...next,
    company: next.company ?? previous.company,
  })

  const formatSalary = (min, max) => {
    if (!min && !max) return '—'
    const fmt = (n) => `₱${Number(n).toLocaleString()}`
    if (min && max) return `${fmt(min)} – ${fmt(max)}`
    if (min) return `From ${fmt(min)}`
    return `Up to ${fmt(max)}`
  }

  const todayLabel = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })

  const getGreeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 18) return 'Good afternoon'
    return 'Good evening'
  }

  const firstItem = total === 0 ? 0 : (page - 1) * perPage + 1
  const lastItem  = Math.min(page * perPage, total)

  return (
    <AdminLayout pageTitle="Positions">

      {/* ── Welcome ── */}
      <div className="admin-welcome">
        <div className="admin-welcome-text">
          <h2>{getGreeting()}, {user?.name?.split(' ')[0] || 'there'} 👋</h2>
          <p>
            Manage job openings shown on the application form. Only <strong>active</strong> positions are visible to applicants.
          </p>
        </div>
        <span className="admin-welcome-date">{todayLabel}</span>
      </div>


      {/* ── Main card ── */}
      <div className="admin-card" style={{ width: '100%' }}>
        <div className="admin-card-head">
          <div>
            <h2>All positions</h2>
            <p>{total} position{total !== 1 ? 's' : ''} total</p>
          </div>
          <button type="button" className="pos-add-btn" onClick={openAdd}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add position
          </button>
        </div>

        <div className="admin-toast-stack" aria-live="polite">
          {success ? <div className={`admin-alert ${toastType === 'danger' ? 'error' : 'success'}`}>{success}</div> : null}
          {error ? <div className="admin-alert error">{error}</div> : null}
        </div>

        <div className="admin-table-filters" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'flex-end' }}>
          <label style={{ flex: '2 1 200px' }}>
            <span className="filter-label-text">Search</span>
            <input
              className="input input-bordered input-sm"
              type="search"
              placeholder="Search positions or companies..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(1) }}
            />
          </label>
          <label>
            <span className="filter-label-text">Status</span>
            <select className="select select-bordered select-sm" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}>
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
            </select>
          </label>
          <label>
            <span className="filter-label-text">Rows</span>
            <select
              className="select select-bordered select-sm"
              value={perPage}
              onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1) }}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </label>
          <div className="filter-date-group" style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem' }}>
            <button
              type="button"
              className={`adv-filter-toggle ${searchTerm || statusFilter ? 'active' : ''}`}
              onClick={() => {}}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="10" y1="18" x2="14" y2="18"/></svg>
              Filters{searchTerm || statusFilter ? ` (2)` : ''}
              <span className={`adv-filter-chevron ${searchTerm || statusFilter ? 'open' : ''}`}>▾</span>
            </button>
          </div>
        </div>
          <table className="admin-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th style={{ width: '36px' }}>
                  <input
                    type="checkbox"
                    className="bulk-checkbox"
                    checked={positions.length > 0 && selectedIds.length === positions.length}
                    ref={(el) => { if (el) el.indeterminate = selectedIds.length > 0 && selectedIds.length < positions.length }}
                    onChange={toggleSelectAll}
                    title="Select all on this page"
                  />
                </th>
                <th>
                  <button type="button" className="admin-th-sort" onClick={() => handleSort('title')}>
                    Title {sort === 'title' ? (direction === 'asc' ? '▲' : '▼') : <span className="sort-icon">↕</span>}
                  </button>
                </th>
                <th className="pos-col-company">Company</th>
                <th className="pos-col-location">Location</th>
                <th className="pos-col-salary">Salary Range</th>
                <th>
                  <button type="button" className="admin-th-sort" onClick={() => handleSort('status')}>
                    Status {sort === 'status' ? (direction === 'asc' ? '▲' : '▼') : <span className="sort-icon">↕</span>}
                  </button>
                </th>
                <th style={{ width: '110px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={`skel-${i}`} style={{ opacity: 1 - i * 0.12 }}>
                    {[36, 140, 120, 100, 120, 60, 110].map((w, j) => (
                      <td key={j}>
                        <div style={{
                          height: '14px', borderRadius: '6px', width: `${w}px`,
                          background: 'linear-gradient(90deg,rgba(200,164,65,.08) 25%,rgba(200,164,65,.18) 50%,rgba(200,164,65,.08) 75%)',
                          backgroundSize: '800px 100%',
                          animation: `shimmer 1.4s ease-in-out infinite`,
                          animationDelay: `${i * 0.07}s`,
                        }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : positions.length ? (
                positions.map((pos) => (
                  <tr key={pos.id}>
                    <td onClick={e => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        className="bulk-checkbox"
                        checked={selectedIds.includes(pos.id)}
                        onChange={() => toggleSelect(pos.id)}
                        title="Select position"
                      />
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: '#0f2c20' }}>{pos.title}</div>
                      {(resolveCompanyName(pos) || pos.location) ? (
                        <div className="pos-row-meta">
                          {[resolveCompanyName(pos), pos.location].filter(Boolean).join(' · ')}
                        </div>
                      ) : null}
                    </td>
                    <td className="pos-col-company">{resolveCompanyName(pos) || '—'}</td>
                    <td className="pos-col-location">{pos.location}</td>
                    <td className="pos-col-salary">{formatSalary(pos.salary_min, pos.salary_max)}</td>
                    <td>
                      <button
                        type="button"
                        className={`pos-status-btn ${pos.is_active ? 'pos-active' : 'pos-inactive'}`}
                        disabled={togglingId === pos.id}
                        onClick={() => handleToggleActive(pos)}
                        title={pos.is_active ? 'Click to deactivate' : 'Click to activate'}
                      >
                        <span className="pos-status-dot" />
                        {togglingId === pos.id ? '…' : pos.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                        <button
                          type="button"
                          className="tbl-edit-btn"
                          onClick={() => openEdit(pos)}
                          title="Edit position"
                          aria-label="Edit position"
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                        <button
                          type="button"
                          className="tbl-delete-btn"
                          onClick={() => setDeleteTarget(pos)}
                          title="Delete position"
                          aria-label="Delete position"
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6}>
                    <div className="admin-empty-state">
                      <div className="admin-empty-icon">📋</div>
                      <p>No positions yet</p>
                      <span>Click "Add position" to create your first job opening.</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <div className="admin-table-footer admin-pagination-bar">
            <span className="admin-pagination-info">{total > 0 ? `${firstItem}–${lastItem} of ${total}` : '0 results'}</span>
            <div className="admin-pagination-controls">
              <button
                type="button"
                className="admin-pg-btn"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                ‹ Prev
              </button>
              <span className="admin-pagination-current">
                Page {page} of {lastPage}
              </span>
              <button
                type="button"
                className="admin-pg-btn"
                onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
                disabled={page >= lastPage}
              >
                Next ›
              </button>
            </div>
          </div>
        </div>


      {/* ── Add / Edit Modal ── */}
      {modalOpen && createPortal(
        <div className="pos-backdrop" onMouseDown={closeModal}>
          <div
            className="pos-modal"
            role="dialog"
            aria-modal="true"
            aria-label={editing ? 'Edit position' : 'Add position'}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="pos-modal-head">
              <div className="pos-modal-head-icon">
                {editing ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>
                )}
              </div>
              <div className="pos-modal-head-text">
                <h3>{editing ? 'Edit Position' : 'Add New Position'}</h3>
                <p>{editing ? 'Update the details for this job opening.' : 'Create a new job opening for applicants.'}</p>
              </div>
              <button type="button" className="pos-close" onClick={closeModal}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="pos-modal-body">
                {formError && <div className="pos-inline pos-inline-err" style={{ marginBottom:'1.25rem' }}>⚠ {formError}</div>}

                <div className="pos-field-row">
                  <div className="pos-field">
                    <label className="pos-label">Job Title <span className="pos-req">*</span></label>
                    <input
                      className="pos-input"
                      name="title"
                      value={form.title}
                      onChange={handleChange}
                      required
                      placeholder="e.g. Software Engineer"
                      autoFocus
                    />
                  </div>
                  <div className="pos-field">
                    <label className="pos-label">Company</label>
                    <select
                      className="pos-input"
                      name="company_id"
                      value={form.company_id}
                      onChange={handleChange}
                    >
                      <option value="">Select company</option>
                      {companies.map((c) => (
                        <option key={c.id} value={String(c.id)}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="pos-field">
                    <label className="pos-label">Location <span className="pos-req">*</span></label>
                    <input
                      className="pos-input"
                      name="location"
                      value={form.location}
                      onChange={handleChange}
                      required
                      placeholder="e.g. Manila, Philippines"
                    />
                  </div>
                </div>

                <div className="pos-field-row">
                  <div className="pos-field">
                    <label className="pos-label">Minimum Salary (₱)</label>
                    <input
                      className="pos-input"
                      name="salary_min"
                      value={form.salary_min}
                      onChange={handleChange}
                      type="number"
                      min="0"
                      placeholder="30000"
                    />
                  </div>
                  <div className="pos-field">
                    <label className="pos-label">Maximum Salary (₱)</label>
                    <input
                      className="pos-input"
                      name="salary_max"
                      value={form.salary_max}
                      onChange={handleChange}
                      type="number"
                      min="0"
                      placeholder="50000"
                    />
                  </div>
                </div>

                <label className="pos-toggle-label">
                  <div className={`pos-toggle ${form.is_active ? 'pos-toggle-on' : ''}`}>
                    <input
                      type="checkbox"
                      name="is_active"
                      checked={form.is_active}
                      onChange={handleChange}
                      style={{ display: 'none' }}
                    />
                    <span className="pos-track"><span className="pos-thumb" /></span>
                  </div>
                  <span style={{ fontWeight: 500, color: '#1f2937' }}>Active (visible to applicants)</span>
                </label>
              </div>

              <div className="pos-modal-foot">
                <button type="button" className="pos-ghost-btn" onClick={closeModal} disabled={saving}>Cancel</button>
                <button type="submit" className="pos-add-btn" disabled={saving}>
                  {saving ? (
                    <><span className="login-spinner" style={{ borderTopColor: '#fff', borderColor: 'rgba(255,255,255,0.3)' }} />Saving…</>
                  ) : (
                    <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>{editing ? 'Save Changes' : 'Create Position'}</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      , document.body)}


      {/* ── Delete Confirm Modal ── */}
      {deleteTarget && createPortal((
        <div className="del-modal-backdrop" onMouseDown={() => !deleting && setDeleteTarget(null)}>
          <div
            className="del-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Delete position confirmation"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="del-modal-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
            </div>
            <h3 className="del-modal-title">Delete position?</h3>
            <p className="del-modal-body">
              <strong>{deleteTarget.title}</strong> will be permanently removed. Existing applicants for this position will not be affected.
            </p>
            <div className="del-modal-actions">
              <button type="button" className="del-modal-cancel" onClick={() => setDeleteTarget(null)} disabled={deleting}>Cancel</button>
              <button type="button" className="del-modal-confirm" onClick={handleDelete} disabled={deleting}>
                {deleting ? (
                  <><span className="login-spinner" style={{ borderTopColor: '#fff', borderColor: 'rgba(255,255,255,0.3)' }} />Deleting…</>
                ) : 'Delete position'}
              </button>
            </div>
          </div>
        </div>
      ), document.body)}

      {/* Bulk action bar (portal) */}
      {selectedIds.length > 0 && createPortal(
        <div className="bulk-action-bar">
          <span className="bulk-action-count">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            {selectedIds.length} selected
          </span>
          <div className="bulk-action-btns">
            <button type="button" className="bulk-action-clear" onClick={clearSelection}>
              Deselect all
            </button>
            <button type="button" className="bulk-action-delete" onClick={handleBulkDelete}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
              Delete {selectedIds.length} position{selectedIds.length !== 1 ? 's' : ''}
            </button>
          </div>
        </div>,
        document.body
      )}
    </AdminLayout>
  )
}

export default AdminPositionsPage
