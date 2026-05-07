# Frontend Refactoring - Code Organization Guide

This document outlines the refactored code organization for the ATS-CZM frontend application.

## Overview

The frontend has been refactored to eliminate code duplication and improve maintainability by consolidating:
- Constants and configuration options
- API calls into a service layer
- Common utility functions
- Custom React hooks
- Shared form handling logic

## Directory Structure

```
src/
├── utils/
│   ├── constants.js          # All constants and options
│   ├── helpers.js            # Formatting and validation utilities
│   ├── apiBase.js            # API base configuration
│   └── installFetchDefaults.js
├── services/
│   └── api.js                # Centralized API service layer
├── hooks/
│   └── index.js              # Custom React hooks
├── context/
├── components/
├── pages/
└── ...
```

---

## 1. Constants (`src/utils/constants.js`)

All constants have been consolidated into a single file. Import what you need:

```javascript
import {
  STATUS_OPTIONS,
  PIPELINE_STATUS_OPTIONS,
  TERMINAL_STATUS_OPTIONS,
  SHORT_STATUS,
  ROLE_LABELS,
  ROLE_OPTIONS,
  ROLE_MAP,
  EDUCATION_OPTIONS,
  GENDER_OPTIONS,
  VACANCY_SOURCE_OPTIONS,
  CIVIL_STATUS_OPTIONS,
  AGE_RANGE_BOUNDS,
  PER_PAGE_OPTIONS,
  PERIOD_OPTIONS,
  MOBILE_BREAKPOINT,
} from '../utils/constants'
```

### Available Constants

| Constant | Purpose | Usage |
|----------|---------|-------|
| `STATUS_OPTIONS` | All applicant statuses | Building status selects, filtering |
| `PIPELINE_STATUS_OPTIONS` | Pipeline statuses (first 6) | Status options in progress |
| `TERMINAL_STATUS_OPTIONS` | Terminal statuses (hired/rejected/withdrawn) | Final status options |
| `SHORT_STATUS` | Status label map | `SHORT_STATUS[status]` for short labels |
| `ROLE_LABELS` | Role display names | Display user roles |
| `ROLE_OPTIONS` | Complete role configuration | Admin role management UI |
| `ROLE_MAP` | Role configuration lookup | `ROLE_MAP[role].color` |
| `EDUCATION_OPTIONS` | Education level options | Application form selects |
| `GENDER_OPTIONS` | Gender options | Application form |
| `VACANCY_SOURCE_OPTIONS` | How applicant found job | Application form |
| `CIVIL_STATUS_OPTIONS` | Civil status options | Application form |
| `AGE_RANGE_BOUNDS` | Age range configuration | Advanced filtering |
| `PER_PAGE_OPTIONS` | Pagination options | Pagination controls |
| `PERIOD_OPTIONS` | Analytics period options | Date range selects |

---

## 2. API Service Layer (`src/services/api.js`)

All API calls are now centralized. No more duplicated fetch logic!

### Usage Pattern

```javascript
import { applicantAPI, authAPI, positionAPI, userAPI } from '../services/api'

// Example: Fetch applicants
const applicants = await applicantAPI.getAll(token, { status: 'hired', page: 1 })

// Example: Update applicant
await applicantAPI.update(token, id, { status: 'hired' })

// Example: Create position
await positionAPI.create(token, { title: 'Manager', location: 'Manila' })
```

### Available Services

#### `authAPI`
- `login(email, password)` - User login
- `logout(token)` - User logout
- `getCurrentUser(token)` - Fetch current user profile
- `getPermissions(token)` - Fetch user permissions
- `forgotPassword(email)` - Request password reset
- `resetPassword(token, password, passwordConfirmation)` - Reset password

#### `applicantAPI`
- `getAll(token, params)` - Get all applicants with filters/pagination
- `getById(token, id)` - Get single applicant
- `create(data)` - Create new applicant (public endpoint)
- `update(token, id, data)` - Update applicant
- `delete(token, id)` - Soft delete applicant
- `restore(token, id)` - Restore deleted applicant
- `forceDelete(token, id)` - Permanently delete applicant
- `getCv(token, id)` - Download applicant CV

#### `noteAPI`
- `getByApplicant(token, applicantId)` - Get notes for applicant
- `create(token, applicantId, content)` - Create note

#### `positionAPI`
- `getAll(token)` - Get all positions
- `getPaginated(token, page)` - Get paginated positions
- `create(token, data)` - Create position
- `update(token, id, data)` - Update position
- `delete(token, id)` - Delete position
- `bulkDelete(token, ids)` - Delete multiple positions
- `toggle(token, id, isActive)` - Toggle position active status

#### `userAPI`
- `getAll(token)` - Get all users
- `create(token, data)` - Create user
- `update(token, id, data)` - Update user
- `delete(token, id)` - Delete user
- `updatePermissions(token, permissions)` - Update permissions

#### `notificationAPI`
- `getAll(token)` - Get notifications
- `markRead(token, id)` - Mark single notification as read
- `markAllRead(token)` - Mark all notifications as read

#### `auditLogAPI`
- `getAll(token, params)` - Get audit logs with filters

#### `analyticsAPI`
- `getDashboard(token, params)` - Get analytics dashboard data

---

## 3. Helper Functions (`src/utils/helpers.js`)

### String Formatting

```javascript
import {
  formatStatus,        // "interview_scheduled" → "Interview Scheduled"
  shortStatus,         // Get short label from map
  toName,              // "john doe" → "John Doe"
  formatDate,          // "2026-01-25" → "January 25, 2026"
  formatDateTime,      // With time
  formatCurrency,      // 5000 → "PHP 5,000"
  safeValue,           // Fallback to "N/A"
  timeAgo,             // "2024-12-25" → "30d ago"
  formatNotifTime,     // Notification format
  formatNotifTimeAgo,  // Notification time ago
} from '../utils/helpers'
```

### Error Handling

```javascript
import { extractError, extractXhrError } from '../utils/helpers'

// In fetch handler
const error = await extractError(response)

// In XHR handler
const error = extractXhrError(xhr)
```

### Form Utilities

```javascript
import { cleanFilters, isValidEmail, isValidPhone, isValidFileSize, isValidFileType } from '../utils/helpers'

// Clean empty filter values
const cleanParams = cleanFilters({ status: '', page: 1 })

// Validation
if (!isValidEmail(email)) throw new Error('Invalid email')
if (!isValidPhone(phone)) throw new Error('Invalid phone')
if (!isValidFileSize(file)) throw new Error('File too large')
if (!isValidFileType(file)) throw new Error('Invalid file type')
```

---

## 4. Custom Hooks (`src/hooks/index.js`)

### useAsync - Async State Management

```javascript
import { useAsync } from '../hooks'

function MyComponent() {
  const { loading, data, error, execute } = useAsync(
    () => fetch('/api/data').then(r => r.json()),
    true, // immediate
    [] // dependencies
  )

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>
  return <div>{data}</div>
}
```

### useForm - Form State Management

```javascript
import { useForm } from '../hooks'

function LoginForm() {
  const form = useForm(
    { email: '', password: '' },
    async (values) => {
      await loginAPI(values.email, values.password)
    }
  )

  return (
    <form onSubmit={form.handleSubmit}>
      <input
        name="email"
        value={form.values.email}
        onChange={form.handleChange}
        onBlur={form.handleBlur}
      />
      {form.touched.email && form.errors.email && <span>{form.errors.email}</span>}
      <button type="submit" disabled={form.isSubmitting}>
        Login
      </button>
    </form>
  )
}
```

### useLocalStorage - Persist State

```javascript
import { useLocalStorage } from '../hooks'

function Theme() {
  const [theme, setTheme] = useLocalStorage('theme', 'light')

  return (
    <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
      Toggle Theme
    </button>
  )
}
```

### useDebounce - Debounced Values

```javascript
import { useDebounce } from '../hooks'

function SearchUsers() {
  const [searchTerm, setSearchTerm] = useState('')
  const debouncedTerm = useDebounce(searchTerm, 500)

  useEffect(() => {
    if (debouncedTerm) {
      searchAPI(debouncedTerm)
    }
  }, [debouncedTerm])

  return <input onChange={(e) => setSearchTerm(e.target.value)} />
}
```

### useModal - Modal State

```javascript
import { useModal } from '../hooks'

function App() {
  const modal = useModal(false)

  return (
    <>
      <button onClick={modal.open}>Open Modal</button>
      {modal.isOpen && <Modal onClose={modal.close} />}
    </>
  )
}
```

### usePagination - Pagination State

```javascript
import { usePagination } from '../hooks'

function UserList() {
  const pagination = usePagination(1, 20)

  return (
    <div>
      <button onClick={pagination.prevPage}>Previous</button>
      <span>Page {pagination.page}</span>
      <button onClick={pagination.nextPage}>Next</button>
      <select onChange={(e) => pagination.changePerPage(Number(e.target.value))}>
        <option value="20">20 per page</option>
        <option value="50">50 per page</option>
      </select>
    </div>
  )
}
```

### useMediaQuery - Responsive Design

```javascript
import { useMediaQuery } from '../hooks'

function ResponsiveComponent() {
  const isMobile = useMediaQuery('(max-width: 900px)')

  return <div>{isMobile ? 'Mobile View' : 'Desktop View'}</div>
}
```

---

## Migration Guide

### Before (Duplicated Code)

```javascript
// In AdminPage.jsx
const statusOptions = ['new', 'reviewed', 'shortlisted', ...]
const extractError = async (response) => { ... }
const formatDate = (dateStr) => { ... }

// In AdminApplicantsPage.jsx
const statusOptions = ['new', 'reviewed', 'shortlisted', ...]  // DUPLICATE!
const extractError = async (response) => { ... }  // DUPLICATE!

// Multiple fetch calls
const res = await fetch(`${apiBase}/api/applicants`, { ... })
```

### After (Using New Utilities)

```javascript
import { STATUS_OPTIONS, ROLE_LABELS } from '../utils/constants'
import { formatDate, extractError } from '../utils/helpers'
import { applicantAPI } from '../services/api'

// Get applicants
const applicants = await applicantAPI.getAll(token, params)

// Format date
const date = formatDate(applicant.created_at)

// Handle errors
const error = await extractError(response)
```

---

## Benefits

✅ **Single Source of Truth** - Constants defined once, used everywhere
✅ **Reduced Duplication** - No more copied code across pages
✅ **Better Maintainability** - Change once, updates everywhere
✅ **Improved Testability** - Isolated, reusable functions
✅ **Cleaner Components** - Less boilerplate, more focus on UI
✅ **Better Performance** - No duplicate API logic
✅ **Type Safety** - Clear function signatures

---

## Next Steps

1. Update existing pages to use the new API service layer
2. Replace inline constants with imported ones from `constants.js`
3. Use custom hooks instead of inline state management
4. Test thoroughly before committing

---

## Questions?

Refer to specific files:
- Constants: `src/utils/constants.js`
- API Services: `src/services/api.js`
- Helpers: `src/utils/helpers.js`
- Hooks: `src/hooks/index.js`
