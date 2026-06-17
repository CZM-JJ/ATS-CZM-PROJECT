// ============================================================================
// APPLICANT STATUS OPTIONS
// ============================================================================
export const STATUS_OPTIONS = [
  'new',
  'reviewed',
  'shortlisted',
  'interview_scheduled',
  'offer_extended',
  'hired',
  'rejected',
  'withdrawn',
]

export const PIPELINE_STATUS_OPTIONS = STATUS_OPTIONS.slice(0, 6)
export const TERMINAL_STATUS_OPTIONS = STATUS_OPTIONS.slice(6)

export const SHORT_STATUS = {
  new: 'New',
  reviewed: 'Reviewed',
  shortlisted: 'Shortlist',
  interview_scheduled: 'Interview',
  offer_extended: 'Offer',
  hired: 'Hired',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn',
}

// ============================================================================
// ROLE OPTIONS
// ============================================================================
export const ROLE_LABELS = {
  admin: 'Administrator',
  hr_manager: 'HR Manager',
  hr_supervisor: 'HR Supervisor',
  recruiter_lead: 'Recruiter Lead',
  recruiter: 'Recruiter',
}

export const ROLE_OPTIONS = [
    {
      value: 'admin',
      label: 'Administrator',
      desc: 'Full access to everything — users, positions, analytics, all applicant actions.',
      icon: '👑',
      activeBg: 'rgba(15,61,46,0.12)',
      color: '#0f3d2e',
      border: 'rgba(15,61,46,0.30)',
    },
    {
      value: 'hr_manager',
      label: 'HR Manager',
      desc: 'Manage applicants, change status, view analytics, and manage job positions.',
      icon: '🏢',
      activeBg: 'rgba(74,127,191,0.14)',
      color: '#2d5f8a',
      border: 'rgba(74,127,191,0.35)',
    },
    {
      value: 'hr_supervisor',
      label: 'HR Supervisor',
      desc: 'Review applicants, add notes, view analytics, and manage job positions.',
      icon: '🔍',
      activeBg: 'rgba(120,80,180,0.12)',
      color: '#5b3d99',
      border: 'rgba(120,80,180,0.30)',
    },
    {
      value: 'recruiter_lead',
      label: 'Recruiter Lead',
      desc: 'Same as Recruiter, but can also manage job positions.',
      icon: '🌟',
      activeBg: 'rgba(200,164,65,0.20)',
      color: '#8a6a16',
      border: 'rgba(200,164,65,0.50)',
    },
    {
      value: 'recruiter',
      label: 'Recruiter',
      desc: 'View applicants and add notes only. No edit, delete, or management access.',
      icon: '📋',
      activeBg: 'rgba(200,164,65,0.14)',
      color: '#8a6a16',
      border: 'rgba(200,164,65,0.40)',
    },
  ]

export const ROLE_MAP = Object.fromEntries(ROLE_OPTIONS.map(r => [r.value, r]))

// ============================================================================
// APPLICATION FORM OPTIONS
// ============================================================================
export const EDUCATION_OPTIONS = [
  { value: '', label: 'Select' },
  { value: 'Elementary school', label: 'Elementary school' },
  { value: 'High School', label: 'High School' },
  { value: 'Senior high school', label: 'Senior high school' },
  { value: 'Vocational', label: 'Vocational' },
  { value: 'College undergraduate', label: 'College undergraduate' },
  { value: 'Bachelor\'s degree', label: 'Bachelor\'s degree' },
  { value: 'Master\'s degree', label: 'Master\'s degree' },
  { value: 'Doctorate', label: 'Doctorate' },
  { value: 'Post Graduate', label: 'Post Graduate' },
]

export const GENDER_OPTIONS = [
  { value: '', label: 'Select' },
  { value: 'Male', label: 'Male' },
  { value: 'Female', label: 'Female' },
  { value: 'Other', label: 'Other / Prefer to self-describe' },
]

export const VACANCY_SOURCE_OPTIONS = [
  { value: '', label: 'Select' },
  { value: 'JobStreet', label: '💼 JobStreet' },
  { value: 'LinkedIn', label: '🔗 LinkedIn' },
  { value: 'Indeed', label: '🔍 Indeed' },
  { value: 'Kalibrr', label: '🎯 Kalibrr' },
  { value: 'Facebook / Social Media', label: '📱 Facebook / Social Media' },
  { value: 'Company Website', label: '🌐 Company Website' },
  { value: 'Referral from Employee', label: '🤝 Referral from an Employee' },
  { value: 'Job Fair', label: '🏢 Job Fair / Recruitment Event' },
  { value: 'Walk-in', label: '🚶 Walk-in' },
  { value: 'Other', label: '✏️ Other' },
]

export const CIVIL_STATUS_OPTIONS = [
  { value: '', label: 'Select' },
  { value: 'Single', label: 'Single' },
  { value: 'Married', label: 'Married' },
  { value: 'Widowed', label: 'Widowed / Widower' },
  { value: 'Legally Separated', label: 'Legally Separated' },
  { value: 'Annulled', label: 'Annulled' },
]

// ============================================================================
// PERMISSIONS
// ============================================================================
export const PERMISSION_DEFAULTS = {
  canEdit:            ['admin', 'hr_manager', 'hr_supervisor'],
  canDelete:          ['admin', 'hr_manager', 'hr_supervisor'],
  canManagePositions: ['admin', 'hr_manager', 'hr_supervisor', 'recruiter_lead'],
  canViewAnalytics:   ['admin', 'hr_manager', 'hr_supervisor'],
  canManageUsers:     ['admin'],
}

// ============================================================================
export const AGE_RANGE_BOUNDS = {
  below_30: { ageMin: undefined, ageMax: 29 },
  age_30_45: { ageMin: 30, ageMax: 45 },
  age_46_61: { ageMin: 46, ageMax: 61 },
  age_61_plus: { ageMin: 61, ageMax: undefined },
}

export const PER_PAGE_OPTIONS = [20, 30, 50, 100]

export const PERIOD_OPTIONS = [
  { label: 'Last 7 Days', value: 7, shortLabel: '7D' },
  { label: 'Last 30 Days', value: 30, shortLabel: '30D' },
  { label: 'Last 90 Days', value: 90, shortLabel: '90D' },
  { label: 'Last 12 Months', value: 365, shortLabel: '12M' },
  { label: 'All Time', value: 0, shortLabel: 'ALL' },
]

// ============================================================================
// RESPONSIVE BREAKPOINTS
// ============================================================================
export const MOBILE_BREAKPOINT = 900
