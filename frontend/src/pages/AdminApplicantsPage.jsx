import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth, useRole } from '../context/AuthContext'
import AdminLayout from '../components/AdminLayout'
import ApplicantTimeline from '../components/ApplicantTimeline'
import Toast from '../components/Toast'
import { applicantAPI, noteAPI, positionAPI, userAPI } from '../services/api'
import { STATUS_OPTIONS, PIPELINE_STATUS_OPTIONS, TERMINAL_STATUS_OPTIONS, SHORT_STATUS, AGE_RANGE_BOUNDS, EDUCATION_OPTIONS, GENDER_OPTIONS, VACANCY_SOURCE_OPTIONS, CIVIL_STATUS_OPTIONS } from '../utils/constants'
import { formatStatus, formatText, toName, timeAgo, formatDate, formatDateTime, formatCurrency, safeValue } from '../utils/helpers'

const shortStatus = (v) => SHORT_STATUS[v] ?? formatStatus(v)

const getInitials = (first, last) =>
  `${first?.slice(0, 1) ?? ''}${last?.slice(0, 1) ?? ''}`.toUpperCase()

const avatarPalettes = [
  { background: 'linear-gradient(135deg,#0f3d2e,#1a6644)', color: '#c8a441' },
  { background: 'linear-gradient(135deg,#1e3a8a,#2563eb)', color: '#bfdbfe' },
  { background: 'linear-gradient(135deg,#7c2d12,#c2410c)', color: '#fed7aa' },
  { background: 'linear-gradient(135deg,#4a044e,#86198f)', color: '#f5d0fe' },
  { background: 'linear-gradient(135deg,#0f4c4c,#0d9488)', color: '#99f6e4' },
  { background: 'linear-gradient(135deg,#78350f,#d97706)', color: '#fef3c7' },
]
const getAvatarColor = (firstName = '', lastName = '') => {
  const str = `${firstName}${lastName}`
  let hash = 0
  for (let i = 0; i < str.length; i++) hash = (hash * 31 + str.charCodeAt(i)) | 0
  return avatarPalettes[Math.abs(hash) % avatarPalettes.length]
}

function AdminApplicantsPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { token, user, isLoading } = useAuth()
  const { canEdit, canDelete } = useRole()

  // Initialize filters from URL params
  const getParam = (key, defaultValue = '') => searchParams.get(key) ?? defaultValue

  const [applicants, setApplicants]       = useState([])
  const [showAddModal, setShowAddModal]     = useState(false)
  const [adding, setAdding] = useState(false)
  const [addForm, setAddForm] = useState({
    position_applied_for: '',
    last_name: '',
    first_name: '',
    middle_name: '',
    permanent_address: '',
    current_address: '',
    gender: '',
    civil_status: '',
    birthdate: '',
    highest_education_level: '',
    bachelors_degree_course: '',
    year_graduated: '',
    last_school_attended: '',
    prc_license: '',
    total_work_experience_years: '',
    contact_number: '',
    email_address: '',
    expected_salary: '',
    preferred_work_location: '',
    vacancy_source: '',
  })

  const handleAddChange = (e) => {
    const { name, value } = e.target
    setAddForm(prev => ({ ...prev, [name]: value }))
  }

  const handleAddSubmit = async (e) => {
    e.preventDefault()
    setAdding(true)
    try {
      await applicantAPI.create(token, addForm)
      setSuccess('Applicant added successfully.')
      setShowAddModal(false)
      setAddForm({
        position_applied_for: '',
        last_name: '',
        first_name: '',
        middle_name: '',
        permanent_address: '',
        current_address: '',
        gender: '',
        civil_status: '',
        birthdate: '',
        highest_education_level: '',
        bachelors_degree_course: '',
        year_graduated: '',
        last_school_attended: '',
        prc_license: '',
        total_work_experience_years: '',
        contact_number: '',
        email_address: '',
        expected_salary: '',
        preferred_work_location: '',
        vacancy_source: '',
      })
      setTimeout(() => setSuccess(null), 3000)
      loadApplicants(token)
    } catch (err) {
      setError(err?.message || 'Failed to add applicant.')
      setTimeout(() => setError(null), 5000)
    } finally {
      setAdding(false)
    }
  }
  const [loading, setLoading]             = useState(false)
  const [error, setError]                 = useState(null)
  const [success, setSuccess]             = useState(null)
  const [toastType, setToastType]         = useState('success')
  const [searchTerm, setSearchTerm]       = useState(() => getParam('search', ''))
  const [statusFilter, setStatusFilter]   = useState(() => getParam('status', ''))
  const [positionFilter, setPositionFilter] = useState(() => getParam('position', ''))
  const [updatedByFilter, setUpdatedByFilter] = useState(() => getParam('updated_by', ''))
  const [startDate, setStartDate]         = useState(() => getParam('start_date', ''))
  const [endDate, setEndDate]             = useState(() => getParam('end_date', ''))
  const [page, setPage]                   = useState(() => parseInt(getParam('page', '1'), 10) || 1)
  const [lastPage, setLastPage]           = useState(1)
  const [total, setTotal]                 = useState(0)
  const [positions, setPositions]         = useState([])
  const [users, setUsers]                     = useState([])
  const [sort, setSort]                   = useState(() => getParam('sort', 'status'))
  const [direction, setDirection]         = useState(() => getParam('direction', 'asc'))
  const [viewMode, setViewMode]           = useState(() => getParam('view', 'active'))
  const [updatingId, setUpdatingId]       = useState(null)
  const [perPage, setPerPage]             = useState(() => parseInt(getParam('per_page', '20'), 10) || 20)
  const [deleteTarget, setDeleteTarget]   = useState(null)   // { id, name }
  const [deleting, setDeleting]           = useState(false)
  const [restoreTarget, setRestoreTarget] = useState(null)   // { id, name }
  const [restoring, setRestoring]         = useState(false)
  const [forceTarget, setForceTarget]     = useState(null)   // { id, name }
  const [forcing, setForcing]             = useState(false)
  const [selectedIds, setSelectedIds]     = useState([])
  const [showBulkModal, setShowBulkModal] = useState(false)
  const [bulkDeleting, setBulkDeleting]   = useState(false)
  const [showBulkRestoreModal, setShowBulkRestoreModal] = useState(false)
  const [bulkRestoring, setBulkRestoring] = useState(false)
  const [showBulkForceModal, setShowBulkForceModal] = useState(false)
  const [bulkForcing, setBulkForcing]     = useState(false)
  const [openDropdownId, setOpenDropdownId] = useState(null)
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, above: false })
  const [viewTargetId, setViewTargetId]   = useState(null)

  // Advanced filters - also initialized from URL
  const [showAdvanced, setShowAdvanced] = useState(() => {
    // Open advanced panel if any advanced filter is set in URL
    const hasAdvancedFilter = ['gender', 'education', 'vacancy_source', 'location', 'salary_min', 'salary_max', 'experience_min', 'experience_max', 'age_range'].some(k => getParam(k))
    return hasAdvancedFilter
  })
  const [genderFilter, setGenderFilter]       = useState(() => getParam('gender', ''))
  const [educationFilter, setEducationFilter] = useState(() => getParam('education', ''))
  const [vacancyFilter, setVacancyFilter]     = useState(() => getParam('vacancy_source', ''))
  const [locationFilter, setLocationFilter]   = useState(() => getParam('location', ''))
  const [salaryMin, setSalaryMin]             = useState(() => getParam('salary_min', ''))
  const [salaryMax, setSalaryMax]             = useState(() => getParam('salary_max', ''))
  const [experienceMin, setExperienceMin]     = useState(() => getParam('experience_min', ''))
  const [experienceMax, setExperienceMax]     = useState(() => getParam('experience_max', ''))
  const [ageRangeFilter, setAgeRangeFilter]   = useState(() => getParam('age_range', ''))

  const anyConfirmModalOpen = !!deleteTarget || !!restoreTarget || !!forceTarget || showBulkModal || showBulkRestoreModal || showBulkForceModal
  const [viewApplicant, setViewApplicant] = useState(null)
  const [viewNotes, setViewNotes]         = useState([])
  const [viewLoading, setViewLoading]     = useState(false)
  const [viewError, setViewError]         = useState(null)

  const selectedAgeRange = AGE_RANGE_BOUNDS[ageRangeFilter] || { ageMin: undefined, ageMax: undefined }

  const advancedFilterCount = [genderFilter, educationFilter, vacancyFilter, locationFilter, salaryMin, salaryMax, experienceMin, experienceMax, ageRangeFilter].filter(Boolean).length
  const activeFilterCount = [searchTerm, statusFilter, positionFilter, updatedByFilter, startDate, endDate].filter(Boolean).length + advancedFilterCount

  const handleSort = (field) => {
    if (sort === field) {
      setDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSort(field)
      setDirection('asc')
    }
    setPage(1)
  }

  const loadPositions = async (activeToken) => {
    try {
      const payload = await positionAPI.getAll(activeToken)
      setPositions(Array.isArray(payload) ? payload : (payload.data || []))
    } catch (err) {
      console.error('loadPositions failed', err)
    }
  }

  const loadApplicants = async (activeToken, filters = {}) => {
    setLoading(true)
    setError(null)
    try {
      const cleanFilters = Object.fromEntries(
        Object.entries(filters).filter(([, v]) => v !== undefined && v !== null && v !== '')
      )
      const payload = await applicantAPI.getAll(activeToken, cleanFilters)
      setApplicants(payload.data || [])
      setPage(payload.meta?.current_page ?? payload.current_page ?? 1)
      setLastPage(payload.meta?.last_page ?? payload.last_page ?? 1)
      setTotal(payload.meta?.total ?? payload.total ?? 0)
    } catch (err) {
      console.error('loadApplicants failed', err)
      setError(err?.message || 'Unable to load applicants.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!openDropdownId) return
    const close = () => setOpenDropdownId(null)
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [openDropdownId])

  useEffect(() => {
    if (!viewTargetId) return
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setViewTargetId(null)
        setViewApplicant(null)
        setViewNotes([])
        setViewError(null)
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [viewTargetId])

  useEffect(() => {
    if (!viewTargetId && !anyConfirmModalOpen) return
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = originalOverflow
    }
  }, [viewTargetId, anyConfirmModalOpen])

  useEffect(() => {
    if (!anyConfirmModalOpen) return
    const onKeyDown = (event) => {
      if (event.key !== 'Escape') return
      if (!deleting) setDeleteTarget(null)
      if (!restoring) setRestoreTarget(null)
      if (!forcing) setForceTarget(null)
      if (!bulkDeleting) setShowBulkModal(false)
      if (!bulkRestoring) setShowBulkRestoreModal(false)
      if (!bulkForcing) setShowBulkForceModal(false)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [anyConfirmModalOpen, deleting, restoring, forcing, bulkDeleting, bulkRestoring, bulkForcing])

  const toggleDropdown = (e, applicantId) => {
    e.stopPropagation()
    if (openDropdownId === applicantId) {
      setOpenDropdownId(null)
      return
    }

    const rect = e.currentTarget.getBoundingClientRect()
    const panelWidth = 210
    const panelHeight = 340
    const gap = 4
    const scrollX = window.scrollX || window.pageXOffset
    const scrollY = window.scrollY || window.pageYOffset
    const showAbove = rect.bottom + panelHeight > window.innerHeight

    const rawLeft = scrollX + rect.left
    const maxLeft = scrollX + window.innerWidth - panelWidth - 8

    setDropdownPos({
      top: showAbove ? (scrollY + rect.top - panelHeight - gap) : (scrollY + rect.bottom + gap),
      left: Math.max(scrollX + 8, Math.min(rawLeft, maxLeft)),
      above: showAbove,
    })
    setOpenDropdownId(applicantId)
  }

  const handleStatusChange = async (applicantId, newStatus, event) => {
    event.stopPropagation()
    if (!canEdit) return
    setOpenDropdownId(null)
    setUpdatingId(applicantId)
    try {
      const updatedApplicant = await applicantAPI.update(token, applicantId, { status: newStatus })
      setApplicants((prev) =>
        prev.map((a) => (a.id === applicantId ? updatedApplicant : a))
      )
      setSuccess('Status updated successfully.')
      setTimeout(() => setSuccess(null), 3000)
    } catch {
      setError('Failed to update status.')
    } finally {
      setUpdatingId(null)
    }
  }

  const handleDelete = (applicant, e) => {
    e.stopPropagation()
    setDeleteTarget({ id: applicant.id, name: `${toName(applicant.first_name)} ${toName(applicant.last_name)}` })
  }

  const handleForceDelete = (applicant, e) => {
    e.stopPropagation()
    setForceTarget({ id: applicant.id, name: `${toName(applicant.first_name)} ${toName(applicant.last_name)}` })
  }

  const closeViewModal = () => {
    setViewTargetId(null)
    setViewApplicant(null)
    setViewNotes([])
    setViewError(null)
    setViewLoading(false)
  }

  const handleView = async (applicantId, e) => {
    e.stopPropagation()
    setViewTargetId(applicantId)
    setViewApplicant(null)
    setViewNotes([])
    setViewError(null)
    setViewLoading(true)

    try {
      const applicantPayload = await applicantAPI.getById(token, applicantId)
      let notesPayload = []
      try {
        notesPayload = await noteAPI.getByApplicant(token, applicantId)
      } catch {
        notesPayload = []
      }

      setViewApplicant(applicantPayload)
      setViewNotes(Array.isArray(notesPayload) ? notesPayload : (notesPayload.data || []))
    } catch {
      setViewError('Unable to load applicant details.')
    } finally {
      setViewLoading(false)
    }
  }

  const handleDownloadCv = async (applicant) => {
    if (!applicant?.id) return
    try {
      const blob = await applicantAPI.getCv(token, applicant.id)
      const url = URL.createObjectURL(blob)
      const ext = applicant.cv_path?.split('.').pop() || 'pdf'
      const a = document.createElement('a')
      a.href = url
      a.download = `${toName(applicant.last_name || 'applicant')}_${toName(applicant.first_name || 'cv')}.${ext}`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      setViewError(err?.message || 'Unable to download CV.')
    }
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await applicantAPI.delete(token, deleteTarget.id)
      setApplicants((prev) => prev.filter((a) => a.id !== deleteTarget.id))
      setSelectedIds((prev) => prev.filter((id) => id !== deleteTarget.id))
      setDeleteTarget(null)
      setSuccess('Applicant archived.')
      setTimeout(() => setSuccess(null), 4000)
    } catch {
      setError('Failed to archive applicant.')
    } finally {
      setDeleting(false)
    }
  }

  const confirmForceDelete = async () => {
    if (!forceTarget) return
    setForcing(true)
    try {
      await applicantAPI.forceDelete(token, forceTarget.id)
      setApplicants((prev) => prev.filter((a) => a.id !== forceTarget.id))
      setSelectedIds((prev) => prev.filter((id) => id !== forceTarget.id))
      setForceTarget(null)
      setSuccess('Applicant permanently deleted.')
      setToastType('danger')
      setTimeout(() => { setSuccess(null); setToastType('success') }, 4000)
    } catch {
      setError('Failed to permanently delete applicant.')
    } finally {
      setForcing(false)
    }
  }

  const handleRestore = (applicant, e) => {
    e.stopPropagation()
    setRestoreTarget({ id: applicant.id, name: `${toName(applicant.first_name)} ${toName(applicant.last_name)}` })
  }

  const confirmRestore = async () => {
    if (!restoreTarget) return
    setRestoring(true)
    try {
      await applicantAPI.restore(token, restoreTarget.id)
      setApplicants((prev) => prev.filter((a) => a.id !== restoreTarget.id))
      setSelectedIds((prev) => prev.filter((id) => id !== restoreTarget.id))
      setRestoreTarget(null)
      setSuccess('Applicant restored.')
      setTimeout(() => setSuccess(null), 4000)
    } catch {
      setError('Failed to restore applicant.')
    } finally {
      setRestoring(false)
    }
  }

  const toggleSelect = (id, e) => {
    e.stopPropagation()
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])
  }

  const toggleSelectAll = () => {
    if (selectedIds.length === applicants.length && applicants.length > 0) {
      setSelectedIds([])
    } else {
      setSelectedIds(applicants.map((a) => a.id))
    }
  }

  const confirmBulkDelete = async () => {
    if (!selectedIds.length) return
    const count = selectedIds.length
    setBulkDeleting(true)
    try {
      await applicantAPI.bulkDelete(token, selectedIds)
      setApplicants((prev) => prev.filter((a) => !selectedIds.includes(a.id)))
      setSelectedIds([])
      setShowBulkModal(false)
      setSuccess(`${count} applicant${count !== 1 ? 's' : ''} archived.`)
      setTimeout(() => setSuccess(null), 4000)
    } catch {
      setError('Failed to archive selected applicants.')
    } finally {
      setBulkDeleting(false)
    }
  }

  const confirmBulkRestore = async () => {
    if (!selectedIds.length) return
    setBulkRestoring(true)
    try {
      await applicantAPI.bulkRestore(token, selectedIds)
      setApplicants((prev) => prev.filter((a) => !selectedIds.includes(a.id)))
      setSelectedIds([])
      setShowBulkRestoreModal(false)
      setSuccess(`${selectedIds.length} applicant${selectedIds.length !== 1 ? 's' : ''} restored.`)
      setTimeout(() => setSuccess(null), 4000)
    } catch {
      setError('Failed to restore selected applicants.')
    } finally {
      setBulkRestoring(false)
    }
  }

  const confirmBulkForceDelete = async () => {
    if (!selectedIds.length) return
    setBulkForcing(true)
    try {
      await applicantAPI.bulkForceDelete(token, selectedIds)
      setApplicants((prev) => prev.filter((a) => !selectedIds.includes(a.id)))
      setSelectedIds([])
      setShowBulkForceModal(false)
      setSuccess(`${selectedIds.length} applicant${selectedIds.length !== 1 ? 's' : ''} permanently deleted.`)
      setToastType('danger')
      setTimeout(() => { setSuccess(null); setToastType('success') }, 4000)
    } catch {
      setError('Failed to permanently delete selected applicants.')
    } finally {
      setBulkForcing(false)
    }
  }

  const exportPDF = () => {
    const win = window.open('', '_blank')
    const rows = applicants.map((a) => `
      <tr>
        <td>${toName(a.first_name)} ${toName(a.last_name)}</td>
        <td>${safeValue(a.email_address)}</td>
        <td>${safeValue(a.contact_number)}</td>
        <td>${safeValue(a.age)}</td>
        <td>${safeValue(a.total_work_experience_years)}</td>
        <td>${formatCurrency(a.expected_salary)}</td>
        <td>${safeValue(a.position_applied_for)}</td>
        <td>${formatStatus(a.status)}</td>
        <td>${a.created_at ? new Date(a.created_at).toLocaleDateString() : 'N/A'}</td>
      </tr>`).join('')
    win.document.write(`<!DOCTYPE html><html lang="en"><head><title>Applicants Export – Page ${page}</title>
      <style>
        body { font-family: 'Inter', 'Segoe UI', Roboto, sans-serif; padding: 3rem; color: #1e293b; line-height: 1.5; }
        .report-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 2rem; border-bottom: 3px solid #0f3d2e; padding-bottom: 1rem; }
        .report-title { margin: 0; font-size: 1.5rem; color: #0f3d2e; font-weight: 700; }
        .report-meta { font-size: 0.8rem; color: #64748b; text-align: right; }
        table { width: 100%; border-collapse: collapse; font-size: 0.75rem; margin-top: 1rem; table-layout: auto; }
        th { text-align: left; padding: 0.75rem; border-bottom: 2px solid #e2e8f0; color: #475569; font-weight: 600; text-transform: uppercase; letter-spacing: 0.025em; }
        td { padding: 0.75rem; border-bottom: 1px solid #f1f5f9; color: #334155; }
        tr:nth-child(even) td { background: #f8fafc; }
        @media print { body { padding: 0; } .no-print { display: none; } }
      </style></head><body>
      <div class="report-header">
        <div>
          <h2 class="report-title">Applicant List Export</h2>
          <p style="margin: 0; color: #64748b; font-size: 0.9rem;">Generated by ATS Management System</p>
        </div>
        <div class="report-meta">
          Page ${page} of ${lastPage} &nbsp;·&nbsp; Total: ${total}<br/>
          Exported: ${new Date().toLocaleString()}
        </div>
      </div>
      <table>
        <thead><tr><th>Name</th><th>Email</th><th>Contact</th><th>Age</th><th>Exp (Yrs)</th><th>Salary</th><th>Position</th><th>Status</th><th>Submitted</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <script>window.onload = () => { window.print(); }</script>
      </body></html>`)
    win.document.close()
  }

  const exportCSV = () => {
    const headers = ['Name', 'Email', 'Contact', 'Age', 'Experience (Yrs)', 'Expected Salary', 'Position', 'Status', 'Submitted']
    const escape = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
    const rows = applicants.map(a => [
      escape(`${toName(a.first_name)} ${toName(a.last_name)}`),
      escape(a.email_address),
      escape(a.contact_number),
      a.age ?? '',
      a.total_work_experience_years ?? '',
      escape(formatCurrency(a.expected_salary)),
      escape(a.position_applied_for),
      escape(formatStatus(a.status)),
      new Date(a.created_at).toLocaleDateString()
    ].join(','))

    const csvContent = [headers.join(','), ...rows].join('\n')
    const blob = new Blob([`﻿${csvContent}`], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `applicants_export_p${page}.csv`)
    link.click()
    URL.revokeObjectURL(url)
  }

  const clearFilters = () => {
    setSearchTerm('')
    setStatusFilter('')
    setPositionFilter('')
    setStartDate('')
    setEndDate('')
    setUpdatedByFilter('')
    setGenderFilter('')
    setEducationFilter('')
    setVacancyFilter('')
    setLocationFilter('')
    setSalaryMin('')
    setSalaryMax('')
    setExperienceMin('')
    setExperienceMax('')
    setAgeRangeFilter('')
    setSearchParams({})
  }

  useEffect(() => {
    if (!user || !token) return
    loadPositions(token)
    userAPI.getAll(token).then(payload => {
      setUsers(Array.isArray(payload) ? payload : (payload.data || []))
    }).catch((err) => {
      console.error('Failed to load users', err)
    })
  }, [user, token])


  // Sync URL params when filters change
  useEffect(() => {
    const params = new URLSearchParams()

    if (searchTerm) params.set('search', searchTerm)
    if (statusFilter) params.set('status', statusFilter)
    if (positionFilter) params.set('position', positionFilter)
    if (updatedByFilter) params.set('updated_by', updatedByFilter)
    if (startDate) params.set('start_date', startDate)
    if (endDate) params.set('end_date', endDate)
    if (page > 1) params.set('page', String(page))
    if (sort) params.set('sort', sort)
    if (direction) params.set('direction', direction)
    if (viewMode !== 'active') params.set('view', viewMode)
    if (perPage !== 20) params.set('per_page', String(perPage))

    // Advanced filters
    if (genderFilter) params.set('gender', genderFilter)
    if (educationFilter) params.set('education', educationFilter)
    if (vacancyFilter) params.set('vacancy_source', vacancyFilter)
    if (locationFilter) params.set('location', locationFilter)
    if (salaryMin) params.set('salary_min', salaryMin)
    if (salaryMax) params.set('salary_max', salaryMax)
    if (experienceMin) params.set('experience_min', experienceMin)
    if (experienceMax) params.set('experience_max', experienceMax)
    if (ageRangeFilter) params.set('age_range', ageRangeFilter)

    // Use replace: true to not create a new history entry on every keystroke
    setSearchParams(params, { replace: true })
  }, [
    searchTerm, statusFilter, positionFilter, startDate, endDate,
    page, sort, direction, viewMode, perPage,
    genderFilter, educationFilter, vacancyFilter, locationFilter,
    salaryMin, salaryMax, experienceMin, experienceMax, ageRangeFilter,
    setSearchParams
  ])

  useEffect(() => {
    setPage(1)
    setSelectedIds([])
  }, [searchTerm, statusFilter, positionFilter, startDate, endDate, genderFilter, educationFilter, vacancyFilter, locationFilter, salaryMin, salaryMax, experienceMin, experienceMax, ageRangeFilter, perPage, viewMode])

  useEffect(() => {
    if (!user) return
    const timer = setTimeout(() => {
      loadApplicants(token, {
        search: searchTerm.trim() || undefined,
        status: statusFilter.trim() || undefined,
        position: positionFilter.trim() || undefined,
        updated_by: updatedByFilter.trim() || undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        gender: genderFilter.trim() || undefined,
        education: educationFilter.trim() || undefined,
        vacancy_source: vacancyFilter.trim() || undefined,
        location: locationFilter.trim() || undefined,
        salary_min: salaryMin || undefined,
        salary_max: salaryMax || undefined,
        experience_min: experienceMin || undefined,
        experience_max: experienceMax || undefined,
        age_min: selectedAgeRange.ageMin,
        age_max: selectedAgeRange.ageMax,
        archived: viewMode === 'archived' ? 'only' : undefined,
        sort,
        direction,
        page,
        per_page: perPage,
      })
    }, 300)
    return () => clearTimeout(timer)
  }, [user, searchTerm, statusFilter, positionFilter, updatedByFilter, startDate, endDate, genderFilter, educationFilter, vacancyFilter, locationFilter, salaryMin, salaryMax, experienceMin, experienceMax, ageRangeFilter, selectedAgeRange.ageMin, selectedAgeRange.ageMax, viewMode, sort, direction, page, perPage])

  const getGreeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 18) return 'Good afternoon'
    return 'Good evening'
  }

  const todayLabel = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })

  const firstItem = total === 0 ? 0 : (page - 1) * perPage + 1
  const lastItem  = Math.min(page * perPage, total)

  return (
    <AdminLayout pageTitle="Applicants">
      <div className="admin-welcome">
        <div className="admin-welcome-text">
          <h2>{getGreeting()}, {user?.name?.split(' ')[0] || 'there'} 👋</h2>
          <p>
            You have <strong>{total}</strong> {viewMode === 'archived' ? 'archived ' : ''}
            applicant{total !== 1 ? 's' : ''} in the system.
          </p>
        </div>
        <span className="admin-welcome-date">{todayLabel}</span>
      </div>

      <div className={`admin-card admin-card-mode-${viewMode}`}>
        <div className="admin-card-head">
          <div>
            <h2>{viewMode === 'archived' ? 'Archived applicants' : 'Active applicants'}</h2>
            <p>
              {total > 0
                ? `Showing ${firstItem}–${lastItem} of ${total} applicant${total !== 1 ? 's' : ''}`
                : `No ${viewMode} applicants found`}
            </p>
            <span className={`admin-mode-pill admin-mode-pill-${viewMode}`}>
              {viewMode === 'archived' ? 'Archive View' : 'Active View'}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
            <div className="admin-mode-switch" role="tablist" aria-label="Applicant list mode">
              <button
                type="button"
                role="tab"
                aria-selected={viewMode === 'active'}
                className={`admin-mode-switch-btn ${viewMode === 'active' ? 'is-active is-active-mode' : ''}`}
                onClick={() => setViewMode('active')}
              >
                Active
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={viewMode === 'archived'}
                className={`admin-mode-switch-btn ${viewMode === 'archived' ? 'is-active is-archived-mode' : ''}`}
                onClick={() => setViewMode('archived')}
              >
                Archived
              </button>
            </div>
            {activeFilterCount > 0 && (
              <button type="button" className="btn btn-sm btn-ghost" onClick={clearFilters}>
                Clear {activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''}  ✕
              </button>
            )}
            <button type="button" className="btn btn-outline btn-sm" onClick={exportCSV} disabled={!applicants.length}>
              ↓ Export CSV
            </button>
            <button type="button" className="btn btn-outline btn-sm" onClick={exportPDF} disabled={!applicants.length}>
              ↓ Export PDF
            </button>
            <button
              type="button"
              className="btn btn-sm"
              style={{ background: 'linear-gradient(135deg, #1a6644, #0f3d2e)', color: 'white', border: 'none' }}
              onClick={() => setShowAddModal(true)}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Add Applicant
            </button>
          </div>
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
              placeholder="Search applicants..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </label>
          <label>
            <span className="filter-label-text">Status</span>
            <select className="select select-bordered select-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All statuses</option>
              <optgroup label="Pipeline">
                {PIPELINE_STATUS_OPTIONS.map((o) => <option key={o} value={o}>{formatStatus(o)}</option>)}
              </optgroup>
              <optgroup label="End states">
                {TERMINAL_STATUS_OPTIONS.map((o) => <option key={o} value={o}>{formatStatus(o)}</option>)}
              </optgroup>
            </select>
          </label>
          <label>
            <span className="filter-label-text">Position</span>
            <select className="select select-bordered select-sm" value={positionFilter} onChange={(e) => setPositionFilter(e.target.value)}>
              <option value="">All positions</option>
              {positions.map((p) => <option key={p.id} value={p.title}>{p.title}</option>)}
            </select>
          </label>
          <label>
            <span className="filter-label-text">Updated By</span>
            <select className="select select-bordered select-sm" value={updatedByFilter} onChange={(e) => setUpdatedByFilter(e.target.value)}>
              <option value="">All users</option>
              {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </label>
          <div className="filter-date-group" style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem' }}>
            <label>
              <span className="filter-label-text">From</span>
              <input className="input input-bordered input-sm" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </label>
            <label>
              <span className="filter-label-text">To</span>
              <input className="input input-bordered input-sm" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </label>
          </div>
          <button
            type="button"
            className={`adv-filter-toggle ${showAdvanced ? 'active' : ''}`}
            onClick={() => setShowAdvanced((v) => !v)}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="10" y1="18" x2="14" y2="18"/></svg>
            Filters{advancedFilterCount > 0 ? ` (${advancedFilterCount})` : ''}
            <span className={`adv-filter-chevron ${showAdvanced ? 'open' : ''}`}>▾</span>
          </button>
        </div>

        {/* ── Advanced filter panel ── */}
        {showAdvanced && (
          <div className="adv-filter-panel">
            <div className="adv-filter-grid">
              <label>
                <span>Gender</span>
                <select className="select select-bordered" value={genderFilter} onChange={(e) => setGenderFilter(e.target.value)}>
                  <option value="">Any</option>
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
              </label>
              <label>
                <span>Education</span>
                <select className="select select-bordered" value={educationFilter} onChange={(e) => setEducationFilter(e.target.value)}>
                  <option value="">Any</option>
                  <option>Elementary</option>
                  <option>High School</option>
                  <option>Senior High</option>
                  <option>Vocational</option>
                  <option>College</option>
                  <option>Post Grad</option>
                </select>
              </label>
              <label>
                <span>Vacancy source</span>
                <select className="select select-bordered" value={vacancyFilter} onChange={(e) => setVacancyFilter(e.target.value)}>
                  <option value="">Any</option>
                  <option>JobStreet</option>
                  <option>LinkedIn</option>
                  <option>Indeed</option>
                  <option>Kalibrr</option>
                  <option>Facebook / Social Media</option>
                  <option>Company Website</option>
                  <option>Referral from Employee</option>
                  <option>Job Fair</option>
                  <option>Walk-in</option>
                  <option>Other</option>
                </select>
              </label>
              <label>
                <span>Work location</span>
                <input
                  className="input input-bordered"
                  type="text"
                  placeholder="e.g. Makati"
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                />
              </label>
              <label>
                <span>Min salary (₱)</span>
                <input
                  className="input input-bordered"
                  type="number"
                  min="0"
                  placeholder="e.g. 20000"
                  value={salaryMin}
                  onChange={(e) => setSalaryMin(e.target.value)}
                />
              </label>
              <label>
                <span>Max salary (₱)</span>
                <input
                  className="input input-bordered"
                  type="number"
                  min="0"
                  placeholder="e.g. 80000"
                  value={salaryMax}
                  onChange={(e) => setSalaryMax(e.target.value)}
                />
              </label>
              <label>
                <span>Age range</span>
                <select className="select select-bordered" value={ageRangeFilter} onChange={(e) => setAgeRangeFilter(e.target.value)}>
                  <option value="">Any</option>
                  <option value="below_30">Below 30</option>
                  <option value="age_30_45">30-45</option>
                  <option value="age_46_61">46-61</option>
                  <option value="age_61_plus">61 and above</option>
                </select>
              </label>
              <label>
                <span>Min experience (yrs)</span>
                <input
                  className="input input-bordered"
                  type="number"
                  min="0"
                  placeholder="e.g. 2"
                  value={experienceMin}
                  onChange={(e) => setExperienceMin(e.target.value)}
                />
              </label>
              <label>
                <span>Max experience (yrs)</span>
                <input
                  className="input input-bordered"
                  type="number"
                  min="0"
                  placeholder="e.g. 10"
                  value={experienceMax}
                  onChange={(e) => setExperienceMax(e.target.value)}
                />
              </label>
              <label>
                <span>Sort by</span>
                <select className="select select-bordered" value={sort} onChange={(e) => { setSort(e.target.value); setPage(1) }}>
                  <option value="created_at">Date submitted</option>
                  <option value="last_name">Last name</option>
                  <option value="first_name">First name</option>
                  <option value="status">Status</option>
                  <option value="expected_salary">Expected salary</option>
                  <option value="total_work_experience_years">Experience</option>
                </select>
              </label>
              <label>
                <span>Order</span>
                <select className="select select-bordered" value={direction} onChange={(e) => { setDirection(e.target.value); setPage(1) }}>
                  <option value="desc">Descending</option>
                  <option value="asc">Ascending</option>
                </select>
              </label>
              <label>
                <span>Per page</span>
                <select className="select select-bordered" value={perPage} onChange={(e) => setPerPage(Number(e.target.value))}>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </label>
            </div>
            {advancedFilterCount > 0 && (
              <button type="button" className="adv-filter-clear" onClick={clearFilters}>
                Clear all filters ✕
              </button>
            )}
          </div>
        )}

        {error ? <div className="admin-alert error">{error}</div> : null}

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                {canDelete && (
                  <th style={{ width: '36px' }}>
                    <input
                      type="checkbox"
                      className="bulk-checkbox"
                      checked={applicants.length > 0 && selectedIds.length === applicants.length}
                      ref={(el) => { if (el) el.indeterminate = selectedIds.length > 0 && selectedIds.length < applicants.length }}
                      onChange={toggleSelectAll}
                      title="Select all on this page"
                    />
                  </th>
                )}
                <th style={{ width: '40px' }}></th>
                <th>
                  <button type="button" className="admin-th-sort" onClick={() => handleSort('last_name')}>
                    Name {sort === 'last_name' ? (direction === 'asc' ? '▲' : '▼') : <span className="sort-icon">↕</span>}
                  </button>
                </th>
                <th>Position</th>
                <th>
                  <button type="button" className="admin-th-sort" onClick={() => handleSort('status')}>
                    Status {sort === 'status' ? (direction === 'asc' ? '▲' : '▼') : <span className="sort-icon">↕</span>}
                  </button>
                </th>
                <th className="col-contact">Contact</th>
                <th className="col-age">
                  <button type="button" className="admin-th-sort" onClick={() => handleSort('age')}>
                    Age {sort === 'age' ? (direction === 'asc' ? '▲' : '▼') : <span className="sort-icon">↕</span>}
                  </button>
                </th>
                <th className="col-experience">
                  <button type="button" className="admin-th-sort" onClick={() => handleSort('total_work_experience_years')}>
                    Experience {sort === 'total_work_experience_years' ? (direction === 'asc' ? '▲' : '▼') : <span className="sort-icon">↕</span>}
                  </button>
                </th>
                <th className="col-salary">
                  <button type="button" className="admin-th-sort" onClick={() => handleSort('expected_salary')}>
                    Salary {sort === 'expected_salary' ? (direction === 'asc' ? '▲' : '▼') : <span className="sort-icon">↕</span>}
                  </button>
                </th>
                <th>
                  <button type="button" className="admin-th-sort" onClick={() => handleSort('updated_by')}>
                    Updated By {sort === 'updated_by' ? (direction === 'asc' ? '▲' : '▼') : <span className="sort-icon">↕</span>}
                  </button>
                </th>
                <th>
                  <button type="button" className="admin-th-sort" onClick={() => handleSort('created_at')}>
                    Submitted {sort === 'created_at' ? (direction === 'asc' ? '▲' : '▼') : <span className="sort-icon">↕</span>}
                  </button>
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={`skel-${i}`} style={{ opacity: 1 - i * 0.08 }}>
                    {Array.from({ length: canDelete ? 11 : 10 }).map((__, j) => (
                      <td key={j}>
                        <div style={{
                          height: '14px', borderRadius: '6px',
                          background: 'linear-gradient(90deg, rgba(200,164,65,0.08) 25%, rgba(200,164,65,0.18) 50%, rgba(200,164,65,0.08) 75%)',
                          backgroundSize: '800px 100%',
                          animation: 'shimmer 1.4s ease-in-out infinite',
                          animationDelay: `${i * 0.07}s`,
                          width: j === 0 ? '32px' : j === 1 ? '120px' : '80px',
                        }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : applicants.length ? (
                applicants.map((applicant) => (
                  <tr
                    key={applicant.id}
                    className={`admin-table-row-clickable${selectedIds.includes(applicant.id) ? ' row-selected' : ''}`}
                    onClick={() => {
                      if (viewMode === 'active') {
                        navigate(`/admin?applicant=${applicant.id}`)
                      }
                    }}
                  >
                    {canDelete && (
                      <td onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          className="bulk-checkbox"
                          checked={selectedIds.includes(applicant.id)}
                          onChange={(e) => toggleSelect(applicant.id, e)}
                        />
                      </td>
                    )}
                    <td>
                      <div className="admin-table-avatar" style={getAvatarColor(applicant.first_name, applicant.last_name)}>
                        {getInitials(applicant.first_name, applicant.last_name)}
                      </div>
                    </td>
                    <td>
                      <div className="admin-table-name">
                        <strong>{toName(applicant.first_name)} {toName(applicant.last_name)}</strong>
                        <span className="admin-table-email">{applicant.email_address}</span>
                      </div>
                    </td>
                    <td title={applicant.position_applied_for}>{applicant.position_applied_for}</td>
                    <td onClick={(e) => e.stopPropagation()} style={{ position: 'relative' }}>
                      <button
                        type="button"
                        className={`status-chip-wrap status-${applicant.status}${updatingId === applicant.id ? ' status-chip-saving' : ''}${(!canEdit || viewMode === 'archived') ? ' status-chip-readonly' : ''}${openDropdownId === applicant.id ? ' status-chip-open' : ''}`}
                        onClick={(e) => canEdit && viewMode === 'active' && !updatingId && toggleDropdown(e, applicant.id)}
                        disabled={!canEdit || viewMode === 'archived' || !!updatingId}
                      >
                        {updatingId === applicant.id ? (
                          <><span className="status-spinner" /><span className="status-chip-saving-label">Saving…</span></>
                        ) : (
                          <>
                            <span className="status-dot" />
                            <span>{shortStatus(applicant.status)}</span>
                            {canEdit && viewMode === 'active' && <svg className={`status-chip-chevron${openDropdownId === applicant.id ? ' open' : ''}`} width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>}
                          </>
                        )}
                      </button>
                    </td>
                    <td className="col-contact">{applicant.contact_number}</td>
                    <td className="col-age">{applicant.age ?? '—'}</td>
                    <td className="col-experience">{applicant.total_work_experience_years != null ? `${applicant.total_work_experience_years} yr` : '—'}</td>
                    <td className="col-salary">{formatCurrency(applicant.expected_salary)}</td>
                    <td title={applicant.updated_by_name ? `${applicant.updated_by_name} (updated ${new Date(applicant.updated_at).toLocaleString()})` : 'No updates'}>
                      {applicant.updated_by_name || '—'}
                    </td>
                    <td title={new Date(applicant.created_at).toLocaleString()}>{timeAgo(applicant.created_at)}</td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div className="tbl-action-group">
                        {viewMode === 'active' ? (
                          <>
                            <button
                              type="button"
                              className="tbl-view-btn"
                              onClick={(e) => handleView(applicant.id, e)}
                              title="View applicant details"
                              aria-label="View applicant details"
                            >
                              View
                            </button>
                            {canDelete && (
                              <button
                                type="button"
                                className="tbl-delete-btn"
                                onClick={(e) => handleDelete(applicant, e)}
                                title="Archive applicant"
                                aria-label="Archive applicant"
                              >
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                              </button>
                            )}
                          </>
                        ) : (
                          <>
                            {canDelete && (
                              <button
                                type="button"
                                className="tbl-view-btn"
                                onClick={(e) => handleRestore(applicant, e)}
                                title="Restore applicant"
                                aria-label="Restore applicant"
                              >
                                Restore
                              </button>
                            )}
                            {canDelete && (
                              <button
                                type="button"
                                className="tbl-delete-btn"
                                onClick={(e) => handleForceDelete(applicant, e)}
                                title="Delete permanently"
                                aria-label="Delete permanently"
                              >
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={canDelete ? 11 : 10}>
                    <div className="admin-empty-state">
                      <div className="admin-empty-icon">🔍</div>
                      <p>No applicants found</p>
                      <span>Try adjusting your filters or search term.</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

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
      {openDropdownId && createPortal((() => {
        const activeApplicant = applicants.find((a) => a.id === openDropdownId)
        if (!activeApplicant) return null
        return (
          <div
            className={`status-dropdown status-dropdown-portal${dropdownPos.above ? ' above' : ''}`}
            style={{
              top: dropdownPos.top,
              left: dropdownPos.left,
            }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="status-dropdown-header">Pipeline</div>
            {PIPELINE_STATUS_OPTIONS.map((o) => (
              <button
                key={o}
                type="button"
                className={`status-dropdown-option status-dd-${o}${activeApplicant.status === o ? ' active' : ''}`}
                onClick={(e) => { e.stopPropagation(); handleStatusChange(activeApplicant.id, o, e) }}
              >
                <span className="status-dropdown-dot" />
                <span>{formatStatus(o)}</span>
                {activeApplicant.status === o && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 'auto', flexShrink: 0, opacity: 0.7 }}><polyline points="20 6 9 17 4 12"/></svg>
                )}
              </button>
            ))}
            <div className="status-dropdown-divider" />
            <div className="status-dropdown-header">End states</div>
            {TERMINAL_STATUS_OPTIONS.map((o) => (
              <button
                key={o}
                type="button"
                className={`status-dropdown-option status-dd-${o}${activeApplicant.status === o ? ' active' : ''}`}
                onClick={(e) => { e.stopPropagation(); handleStatusChange(activeApplicant.id, o, e) }}
              >
                <span className="status-dropdown-dot" />
                <span>{formatStatus(o)}</span>
                {activeApplicant.status === o && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 'auto', flexShrink: 0, opacity: 0.7 }}><polyline points="20 6 9 17 4 12"/></svg>
                )}
              </button>
            ))}
          </div>
        )
      })(), document.body)}
      {/* ── Bulk action bar ── */}
      {canDelete && selectedIds.length > 0 && createPortal(
        <div className="bulk-action-bar">
          <span className="bulk-action-count">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            {selectedIds.length} selected
          </span>
          <div className="bulk-action-btns">
            <button type="button" className="bulk-action-clear" onClick={() => setSelectedIds([])}>
              Deselect all
            </button>
            {viewMode === 'active' ? (
              <button type="button" className="bulk-action-delete" onClick={() => setShowBulkModal(true)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                Archive {selectedIds.length} applicant{selectedIds.length !== 1 ? 's' : ''}
              </button>
            ) : (
              <>
                <button type="button" className="bulk-action-delete" onClick={() => setShowBulkRestoreModal(true)}>
                  Restore {selectedIds.length} applicant{selectedIds.length !== 1 ? 's' : ''}
                </button>
                <button type="button" className="bulk-action-delete" onClick={() => setShowBulkForceModal(true)}>
                  Delete permanently
                </button>
              </>
            )}
          </div>
        </div>,
        document.body
      )}
      {viewTargetId && createPortal((
        <div className="avm-backdrop" onMouseDown={closeViewModal}>
          <div className="avm" onMouseDown={(e) => e.stopPropagation()}>
            {/* ── Banner ── */}
            <div className="avm-banner">
              <div className="avm-banner-inner">
                {viewApplicant ? (
                  <div className="avm-avatar-lg" style={getAvatarColor(viewApplicant.first_name, viewApplicant.last_name)}>
                    {getInitials(viewApplicant.first_name, viewApplicant.last_name)}
                  </div>
                ) : (
                  <div className="avm-avatar-lg avm-avatar-loading">...</div>
                )}
                <div className="avm-banner-text">
                  <div className="avm-eyebrow">Applicant profile</div>
                  <h3 className="avm-name">
                    {viewApplicant ? `${toName(viewApplicant.first_name)} ${toName(viewApplicant.last_name)}` : 'Loading applicant...'}
                  </h3>
                  <div className="avm-position">
                    <span>{viewApplicant ? safeValue(viewApplicant.position_applied_for) : 'Please wait...'}</span>
                    {viewApplicant?.status && (
                      <span className={`admin-chip ${viewApplicant.status}`}>{formatStatus(viewApplicant.status)}</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="avm-banner-actions">
                {viewApplicant?.cv_path ? (
                  <button
                    type="button"
                    className="avm-cv-btn"
                    onClick={() => handleDownloadCv(viewApplicant)}
                  >
                    Download CV
                  </button>
                ) : null}
                <button
                  type="button"
                  className="avm-close-btn"
                  onClick={closeViewModal}
                  aria-label="Close applicant view"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
            </div>
            {/* ── Body ── */}
            <div className="avm-body">
              {viewLoading ? (
                <div className="avm-loading">
                  <span className="login-spinner" />
                  <span>Loading applicant details…</span>
                </div>
              ) : viewError ? (
                <div className="admin-alert error">{viewError}</div>
              ) : viewApplicant ? (
                <>
                  {/* Contact bar */}
                  <div className="avm-contact-bar">
                    <div className="avm-contact-item">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                      <span>{safeValue(viewApplicant.email_address)}</span>
                    </div>
                    <div className="avm-contact-divider" />
                    <div className="avm-contact-item">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.18 2 2 0 0 1 3.59 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.56a16 16 0 0 0 6 6l.92-.92a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                      <span>{safeValue(viewApplicant.contact_number)}</span>
                    </div>
                    <div className="avm-contact-divider" />
                    <div className="avm-contact-item">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                      <span>Applied {formatDate(viewApplicant.created_at)}</span>
                    </div>
                    <div className="avm-contact-divider" />
                    <div className="avm-contact-item">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                      <span>{safeValue(formatText(viewApplicant.preferred_work_location))}</span>
                    </div>
                  </div>

                  {/* KPI strip */}
                  <div className="avm-kpi-row">
                    <div className="avm-kpi">
                      <span className="avm-kpi-label">Experience</span>
                      <strong className="avm-kpi-value">{safeValue(viewApplicant.total_work_experience_years)} yr(s)</strong>
                    </div>
                    <div className="avm-kpi">
                      <span className="avm-kpi-label">Expected salary</span>
                      <strong className="avm-kpi-value">{formatCurrency(viewApplicant.expected_salary)}</strong>
                    </div>
                    <div className="avm-kpi">
                      <span className="avm-kpi-label">Education</span>
                      <strong className="avm-kpi-value">{safeValue(viewApplicant.highest_education_level)}</strong>
                    </div>
                    <div className="avm-kpi">
                      <span className="avm-kpi-label">Vacancy source</span>
                      <strong className="avm-kpi-value">{safeValue(viewApplicant.vacancy_source)}</strong>
                    </div>
                  </div>

                  {/* Detail cards grid */}
                  <div className="avm-grid">
                    <div className="avm-card">
                      <div className="avm-card-head">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                        Application
                      </div>
                      <div className="avm-pairs">
                        <div className="avm-pair"><span>Status</span><span className={`admin-chip ${viewApplicant.status} avm-pair-chip`}>{formatStatus(viewApplicant.status)}</span></div>
                        <div className="avm-pair"><span>Position</span><strong>{safeValue(viewApplicant.position_applied_for)}</strong></div>
                        <div className="avm-pair"><span>Preferred location</span><strong>{safeValue(formatText(viewApplicant.preferred_work_location))}</strong></div>
                        <div className="avm-pair"><span>Vacancy source</span><strong>{safeValue(viewApplicant.vacancy_source)}</strong></div>
                      </div>
                    </div>

                    <div className="avm-card">
                      <div className="avm-card-head">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                        Personal
                      </div>
                      <div className="avm-pairs">
                        <div className="avm-pair"><span>Permanent Address</span><strong>{safeValue(formatText(viewApplicant.permanent_address))}</strong></div>
                        <div className="avm-pair"><span>Current Address</span><strong>{safeValue(formatText(viewApplicant.current_address))}</strong></div>
                        <div className="avm-pair"><span>Gender</span><strong>{safeValue(viewApplicant.gender)}</strong></div>
                        <div className="avm-pair"><span>Civil status</span><strong>{safeValue(viewApplicant.civil_status)}</strong></div>
                        <div className="avm-pair"><span>Birthdate</span><strong>{formatDate(viewApplicant.birthdate)}</strong></div>
                        <div className="avm-pair"><span>Age</span><strong>{safeValue(viewApplicant.age)}</strong></div>
                      </div>
                    </div>

                    <div className="avm-card">
                      <div className="avm-card-head">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
                        Education
                      </div>
                      <div className="avm-pairs">
                        <div className="avm-pair"><span>Highest level</span><strong>{safeValue(viewApplicant.highest_education_level)}</strong></div>
                        <div className="avm-pair"><span>Course / Degree</span><strong>{safeValue(formatText(viewApplicant.bachelors_degree_course))}</strong></div>
                        <div className="avm-pair"><span>School</span><strong>{safeValue(formatText(viewApplicant.last_school_attended))}</strong></div>
                        <div className="avm-pair"><span>Year graduated</span><strong>{safeValue(viewApplicant.year_graduated)}</strong></div>
                      </div>
                    </div>

                    <div className="avm-card">
                      <div className="avm-card-head">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
                        Professional
                      </div>
                      <div className="avm-pairs">
                        <div className="avm-pair"><span>PRC license</span><strong>{safeValue(viewApplicant.prc_license)}</strong></div>
                        <div className="avm-pair"><span>Work experience</span><strong>{safeValue(viewApplicant.total_work_experience_years)} year(s)</strong></div>
                        <div className="avm-pair"><span>Expected salary</span><strong>{formatCurrency(viewApplicant.expected_salary)}</strong></div>
                      </div>
                    </div>

                    {/* Pipeline Timeline */}
                    <ApplicantTimeline applicantId={viewApplicant.id} token={token} />
                  </div>

                  {/* HR Notes */}
                  <div className="avm-card avm-notes-card">
                    <div className="avm-card-head">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                      HR Notes
                      <span className="avm-notes-count">{viewNotes.length}</span>
                    </div>
                    {viewNotes.length ? (
                      <ul className="avm-notes-list">
                        {viewNotes.map(note => (
                          <li key={note.id} className="avm-note">
                            <div className="avm-note-avatar">
                              {(note.user?.name || 'R')[0].toUpperCase()}
                            </div>
                            <div className="avm-note-body">
                              <div className="avm-note-meta">
                                <strong>{safeValue(note.user?.name || 'Recruiter')}</strong>
                                <span>{formatDateTime(note.created_at)}</span>
                              </div>
                              <p>{safeValue(note.note)}</p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="avm-empty">No HR notes on record.</div>
                    )}
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>
      ), document.body)}
      {/* ── Archive confirmation modal ── */}
      {deleteTarget && createPortal((
        <div className="del-modal-backdrop" onMouseDown={() => !deleting && setDeleteTarget(null)}>
          <div
            className="del-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Archive applicant confirmation"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="del-modal-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
            </div>
            <h3 className="del-modal-title">Archive applicant?</h3>
            <p className="del-modal-body">
              <strong>{deleteTarget.name}</strong> will be moved to archive and hidden from active applicants.
            </p>
            <div className="del-modal-actions">
              <button
                type="button"
                className="del-modal-cancel"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="del-modal-confirm"
                onClick={confirmDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <><span className="login-spinner" style={{ borderTopColor: '#fff', borderColor: 'rgba(255,255,255,0.3)' }} />Archiving…</>
                ) : (
                  <>Archive applicant</>
                )}
              </button>
            </div>
          </div>
        </div>
      ), document.body)}
      {restoreTarget && createPortal((
        <div className="del-modal-backdrop" onMouseDown={() => !restoring && setRestoreTarget(null)}>
          <div
            className="del-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Restore applicant confirmation"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="del-modal-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <h3 className="del-modal-title">Restore applicant?</h3>
            <p className="del-modal-body">
              <strong>{restoreTarget.name}</strong> will be returned to the active applicant list.
            </p>
            <div className="del-modal-actions">
              <button
                type="button"
                className="del-modal-cancel"
                onClick={() => setRestoreTarget(null)}
                disabled={restoring}
              >
                Cancel
              </button>
              <button
                type="button"
                className="del-modal-confirm"
                onClick={confirmRestore}
                disabled={restoring}
              >
                {restoring ? (
                  <><span className="login-spinner" style={{ borderTopColor: '#fff', borderColor: 'rgba(255,255,255,0.3)' }} />Restoring…</>
                ) : (
                  <>Restore applicant</>
                )}
              </button>
            </div>
          </div>
        </div>
      ), document.body)}
      {forceTarget && createPortal((
        <div className="del-modal-backdrop" onMouseDown={() => !forcing && setForceTarget(null)}>
          <div
            className="del-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Permanent delete applicant confirmation"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="del-modal-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
            </div>
            <h3 className="del-modal-title">Delete permanently?</h3>
            <p className="del-modal-body">
              <strong>{forceTarget.name}</strong> will be permanently removed from the system, including CV files and notes. This cannot be undone.
            </p>
            <div className="del-modal-actions">
              <button
                type="button"
                className="del-modal-cancel"
                onClick={() => setForceTarget(null)}
                disabled={forcing}
              >
                Cancel
              </button>
              <button
                type="button"
                className="del-modal-confirm"
                onClick={confirmForceDelete}
                disabled={forcing}
              >
                {forcing ? (
                  <><span className="login-spinner" style={{ borderTopColor: '#fff', borderColor: 'rgba(255,255,255,0.3)' }} />Deleting…</>
                ) : (
                  <>Delete permanently</>
                )}
              </button>
            </div>
          </div>
        </div>
      ), document.body)}
      {/* ── Bulk archive confirmation modal ── */}
      {showBulkModal && createPortal((
        <div className="del-modal-backdrop" onMouseDown={() => !bulkDeleting && setShowBulkModal(false)}>
          <div
            className="del-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Bulk archive applicants confirmation"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="del-modal-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
            </div>
            <h3 className="del-modal-title">Archive {selectedIds.length} applicant{selectedIds.length !== 1 ? 's' : ''}?</h3>
            <p className="del-modal-body">
              <strong>{selectedIds.length} applicant{selectedIds.length !== 1 ? 's' : ''}</strong> will be moved to archive and hidden from active applicants.
            </p>
            <div className="del-modal-actions">
              <button
                type="button"
                className="del-modal-cancel"
                onClick={() => setShowBulkModal(false)}
                disabled={bulkDeleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="del-modal-confirm"
                onClick={confirmBulkDelete}
                disabled={bulkDeleting}
              >
                {bulkDeleting ? (
                  <><span className="login-spinner" style={{ borderTopColor: '#fff', borderColor: 'rgba(255,255,255,0.3)' }} />Archiving…</>
                ) : (
                  <>Archive {selectedIds.length} applicant{selectedIds.length !== 1 ? 's' : ''}</>
                )}
              </button>
            </div>
          </div>
        </div>
      ), document.body)}
      {showBulkRestoreModal && createPortal((
        <div className="del-modal-backdrop" onMouseDown={() => !bulkRestoring && setShowBulkRestoreModal(false)}>
          <div
            className="del-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Bulk restore applicants confirmation"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="del-modal-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <h3 className="del-modal-title">Restore {selectedIds.length} applicant{selectedIds.length !== 1 ? 's' : ''}?</h3>
            <p className="del-modal-body">
              <strong>{selectedIds.length} applicant{selectedIds.length !== 1 ? 's' : ''}</strong> will be restored to the active list.
            </p>
            <div className="del-modal-actions">
              <button
                type="button"
                className="del-modal-cancel"
                onClick={() => setShowBulkRestoreModal(false)}
                disabled={bulkRestoring}
              >
                Cancel
              </button>
              <button
                type="button"
                className="del-modal-confirm"
                onClick={confirmBulkRestore}
                disabled={bulkRestoring}
              >
                {bulkRestoring ? (
                  <><span className="login-spinner" style={{ borderTopColor: '#fff', borderColor: 'rgba(255,255,255,0.3)' }} />Restoring…</>
                ) : (
                  <>Restore applicants</>
                )}
              </button>
            </div>
          </div>
        </div>
      ), document.body)}
      {showBulkForceModal && createPortal((
        <div className="del-modal-backdrop" onMouseDown={() => !bulkForcing && setShowBulkForceModal(false)}>
          <div
            className="del-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Bulk permanent delete applicants confirmation"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="del-modal-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
            </div>
            <h3 className="del-modal-title">Delete {selectedIds.length} applicant{selectedIds.length !== 1 ? 's' : ''} permanently?</h3>
            <p className="del-modal-body">
              <strong>{selectedIds.length} applicant{selectedIds.length !== 1 ? 's' : ''}</strong> will be permanently removed from the system, including their CV files and notes. This cannot be undone.
            </p>
            <div className="del-modal-actions">
              <button
                type="button"
                className="del-modal-cancel"
                onClick={() => setShowBulkForceModal(false)}
                disabled={bulkForcing}
              >
                Cancel
              </button>
              <button
                type="button"
                className="del-modal-confirm"
                onClick={confirmBulkForceDelete}
                disabled={bulkForcing}
              >
                {bulkForcing ? (
                  <><span className="login-spinner" style={{ borderTopColor: '#fff', borderColor: 'rgba(255,255,255,0.3)' }} />Deleting…</>
                ) : (
                  <>Delete permanently</>
                )}
              </button>
            </div>
          </div>
        </div>
      ), document.body)}
      {showAddModal && createPortal((
        <div className="del-modal-backdrop" onMouseDown={() => setShowAddModal(false)}>
          <div
            className="del-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Add new applicant"
            onMouseDown={(e) => e.stopPropagation()}
            style={{ maxWidth: '700px', width: '90%', maxHeight: '90vh', overflowY: 'auto' }}
          >
            <div className="del-modal-icon" style={{ color: 'var(--p)', background: 'var(--p-content)' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            </div>
            <h3 className="del-modal-title">Add New Applicant</h3>

            <form onSubmit={handleAddSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div className="form-control">
                  <label className="label-text" style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px' }}>Position Applied For *</label>
                  <select name="position_applied_for" value={addForm.position_applied_for} onChange={handleAddChange} required className="select select-bordered select-sm w-full">
                    <option value="">Select Position</option>
                    {positions.map(p => <option key={p.id} value={p.title}>{p.title}</option>)}
                  </select>
                </div>
                <div className="form-control">
                  <label className="label-text" style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px' }}>First Name *</label>
                  <input name="first_name" value={addForm.first_name} onChange={handleAddChange} required className="input input-bordered input-sm w-full" />
                </div>
                <div className="form-control">
                  <label className="label-text" style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px' }}>Last Name *</label>
                  <input name="last_name" value={addForm.last_name} onChange={handleAddChange} required className="input input-bordered input-sm w-full" />
                </div>
                <div className="form-control">
                  <label className="label-text" style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px' }}>Middle Name</label>
                  <input name="middle_name" value={addForm.middle_name} onChange={handleAddChange} className="input input-bordered input-sm w-full" />
                </div>
                <div className="form-control">
                  <label className="label-text" style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px' }}>Email *</label>
                  <input name="email_address" type="email" value={addForm.email_address} onChange={handleAddChange} required className="input input-bordered input-sm w-full" />
                </div>
                <div className="form-control">
                  <label className="label-text" style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px' }}>Contact Number *</label>
                  <input name="contact_number" value={addForm.contact_number} onChange={handleAddChange} required className="input input-bordered input-sm w-full" />
                </div>
                <div className="form-control">
                  <label className="label-text" style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px' }}>Birthdate *</label>
                  <input name="birthdate" type="date" value={addForm.birthdate} onChange={handleAddChange} required className="input input-bordered input-sm w-full" />
                </div>
                <div className="form-control">
                  <label className="label-text" style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px' }}>Gender *</label>
                  <select name="gender" value={addForm.gender} onChange={handleAddChange} required className="select select-bordered select-sm w-full">
                    <option value="">Select Gender</option>
                    {GENDER_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div className="form-control">
                  <label className="label-text" style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px' }}>Civil Status *</label>
                  <select name="civil_status" value={addForm.civil_status} onChange={handleAddChange} required className="select select-bordered select-sm w-full">
                    <option value="">Select Status</option>
                    {CIVIL_STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-control">
                  <label className="label-text" style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px' }}>Permanent Address *</label>
                  <textarea name="permanent_address" value={addForm.permanent_address} onChange={handleAddChange} required className="textarea textarea-bordered textarea-sm w-full" rows="2" />
                </div>
                <div className="form-control">
                  <label className="label-text" style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px' }}>Current Address *</label>
                  <textarea name="current_address" value={addForm.current_address} onChange={handleAddChange} required className="textarea textarea-bordered textarea-sm w-full" rows="2" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div className="form-control">
                  <label className="label-text" style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px' }}>Highest Education *</label>
                  <select name="highest_education_level" value={addForm.highest_education_level} onChange={handleAddChange} required className="select select-bordered select-sm w-full">
                    <option value="">Select Education</option>
                    {EDUCATION_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div className="form-control">
                  <label className="label-text" style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px' }}>Degree / Course</label>
                  <input name="bachelors_degree_course" value={addForm.bachelors_degree_course} onChange={handleAddChange} className="input input-bordered input-sm w-full" />
                </div>
                <div className="form-control">
                  <label className="label-text" style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px' }}>Year Graduated *</label>
                  <input name="year_graduated" type="number" value={addForm.year_graduated} onChange={handleAddChange} required className="input input-bordered input-sm w-full" />
                </div>
                <div className="form-control">
                  <label className="label-text" style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px' }}>Last School Attended *</label>
                  <input name="last_school_attended" value={addForm.last_school_attended} onChange={handleAddChange} required className="input input-bordered input-sm w-full" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div className="form-control">
                  <label className="label-text" style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px' }}>PRC License</label>
                  <input name="prc_license" value={addForm.prc_license} onChange={handleAddChange} className="input input-bordered input-sm w-full" />
                </div>
                <div className="form-control">
                  <label className="label-text" style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px' }}>Work Experience (Yrs) *</label>
                  <input name="total_work_experience_years" type="number" step="0.1" value={addForm.total_work_experience_years} onChange={handleAddChange} required className="input input-bordered input-sm w-full" />
                </div>
                <div className="form-control">
                  <label className="label-text" style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px' }}>Expected Salary</label>
                  <input name="expected_salary" type="number" value={addForm.expected_salary} onChange={handleAddChange} className="input input-bordered input-sm w-full" />
                </div>
                <div className="form-control">
                  <label className="label-text" style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px' }}>Preferred Location *</label>
                  <input name="preferred_work_location" value={addForm.preferred_work_location} onChange={handleAddChange} required className="input input-bordered input-sm w-full" />
                </div>
              </div>

              <div className="form-control">
                <label className="label-text" style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px' }}>Vacancy Source *</label>
                <select name="vacancy_source" value={addForm.vacancy_source} onChange={handleAddChange} required className="select select-bordered select-sm w-full">
                  <option value="">Select Source</option>
                  {VACANCY_SOURCE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>

              <div className="del-modal-actions">
                <button
                  type="button"
                  className="del-modal-cancel"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="del-modal-confirm"
                  disabled={adding}
                >
                  {adding ? 'Adding...' : 'Add Applicant'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ), document.body)}
    </AdminLayout>
  )
}

export default AdminApplicantsPage

