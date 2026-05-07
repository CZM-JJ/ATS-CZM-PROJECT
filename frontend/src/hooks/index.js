import { useEffect, useState } from 'react'

/**
 * Hook for managing async loading state and errors
 * Usage: const { loading, error, data, setError } = useAsync(fetchFn, [deps])
 */
export const useAsync = (asyncFunction, immediate = true, deps = []) => {
  const [status, setStatus] = useState('idle')
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  const execute = useState(async () => {
    setStatus('pending')
    setData(null)
    setError(null)
    try {
      const result = await asyncFunction()
      setData(result)
      setStatus('success')
      return result
    } catch (err) {
      setError(err)
      setStatus('error')
      throw err
    }
  })[0]

  useEffect(() => {
    if (immediate) execute()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps || [])

  return { loading: status === 'pending', data, error, setError, execute }
}

/**
 * Hook for managing form state and validation
 * Usage: const form = useForm(initialValues, onSubmit)
 */
export const useForm = (initialValues, onSubmit) => {
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setValues((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleBlur = (e) => {
    const { name } = e.target
    setTouched((prev) => ({ ...prev, [name]: true }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await onSubmit(values)
    } catch (err) {
      setErrors({ submit: err.message })
    } finally {
      setIsSubmitting(false)
    }
  }

  const reset = () => {
    setValues(initialValues)
    setErrors({})
    setTouched({})
  }

  return {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    reset,
    setValues,
    setErrors,
  }
}

/**
 * Hook for managing local storage
 * Usage: const [value, setValue] = useLocalStorage('key', defaultValue)
 */
export const useLocalStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      console.error(error)
      return initialValue
    }
  })

  const setValue = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value
      setStoredValue(valueToStore)
      window.localStorage.setItem(key, JSON.stringify(valueToStore))
    } catch (error) {
      console.error(error)
    }
  }

  return [storedValue, setValue]
}

/**
 * Hook for managing debounced values
 * Usage: const debouncedValue = useDebounce(value, delay)
 */
export const useDebounce = (value, delay = 500) => {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => clearTimeout(handler)
  }, [value, delay])

  return debouncedValue
}

/**
 * Hook for managing modal/dialog state
 * Usage: const modal = useModal()
 */
export const useModal = (initialOpen = false) => {
  const [isOpen, setIsOpen] = useState(initialOpen)

  const open = () => setIsOpen(true)
  const close = () => setIsOpen(false)
  const toggle = () => setIsOpen((prev) => !prev)

  return { isOpen, open, close, toggle }
}

/**
 * Hook for managing pagination
 * Usage: const pagination = usePagination(initialPage, itemsPerPage)
 */
export const usePagination = (initialPage = 1, itemsPerPage = 20) => {
  const [page, setPage] = useState(initialPage)
  const [perPage, setPerPage] = useState(itemsPerPage)

  const goToPage = (pageNum) => setPage(Math.max(1, pageNum))
  const nextPage = () => setPage((p) => p + 1)
  const prevPage = () => setPage((p) => Math.max(1, p - 1))
  const changePerPage = (newPerPage) => {
    setPerPage(newPerPage)
    setPage(1)
  }

  return {
    page,
    perPage,
    setPage: goToPage,
    nextPage,
    prevPage,
    changePerPage,
  }
}

/**
 * Hook for managing responsive breakpoints
 * Usage: const isMobile = useMediaQuery('(max-width: 900px)')
 */
export const useMediaQuery = (query) => {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const media = window.matchMedia(query)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMatches(media.matches)

    const listener = () => setMatches(media.matches)
    media.addEventListener('change', listener)
    return () => media.removeEventListener('change', listener)
  }, [query])

  return matches
}
