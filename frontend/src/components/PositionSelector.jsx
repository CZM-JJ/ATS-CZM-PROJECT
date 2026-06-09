import React, { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'

/**
 * PositionSelector
 * A searchable dropdown for selecting a job position.
 * Renders the menu in a portal so it isn't clipped by parent overflow.
 */
export default function PositionSelector({
  value,
  onChange,
  positions = [],
  placeholder = 'Select position...',
  required = false
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 })

  const triggerRef = useRef(null)
  const dropdownRef = useRef(null)

  const updateCoords = () => {
    if (!triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    setCoords({
      top: rect.bottom,
      left: rect.left,
      width: rect.width,
    })
  }

  const openDropdown = () => {
    updateCoords()
    setIsOpen(true)
  }

  const closeDropdown = () => {
    setIsOpen(false)
    setSearchQuery('')
    setHighlightedIndex(0)
  }

  const toggleDropdown = () => {
    if (isOpen) {
      closeDropdown()
    } else {
      openDropdown()
    }
  }

  useEffect(() => {
    if (!isOpen) return

    const handleResizeScroll = () => updateCoords()
    window.addEventListener('resize', handleResizeScroll)
    window.addEventListener('scroll', handleResizeScroll, true)
    return () => {
      window.removeEventListener('resize', handleResizeScroll)
      window.removeEventListener('scroll', handleResizeScroll, true)
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (event) => {
      const inTrigger = triggerRef.current?.contains(event.target)
      const inDropdown = dropdownRef.current?.contains(event.target)
      if (!inTrigger && !inDropdown) {
        closeDropdown()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  const filteredPositions = (() => {
    const query = searchQuery.toLowerCase().trim()

    const filtered = positions.filter(pos => {
      const title = (pos.title || '').toLowerCase()
      const company = (pos.company?.name || pos.company || '').toLowerCase()
      const location = (pos.location || '').toLowerCase()
      return title.includes(query) || company.includes(query) || location.includes(query)
    })

    const seen = new Set()
    const unique = []
    for (const pos of filtered) {
      if (!seen.has(pos.title)) {
        seen.add(pos.title)
        unique.push(pos)
      }
    }

    return unique.sort((a, b) => (a.title || '').localeCompare(b.title || ''))
  })()

  const handleSelect = (positionTitle) => {
    onChange({ target: { name: 'position_applied_for', value: positionTitle } })
    closeDropdown()
  }

  const selectedPosition = positions.find((pos) => pos.title === value)
  const selectedCompany = selectedPosition?.company?.name || selectedPosition?.company || null
  const selectedLocation = selectedPosition?.location || null
  const selectedDetails = [selectedCompany, selectedLocation].filter(Boolean).join(' · ')

  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === 'ArrowDown') {
        e.preventDefault()
        openDropdown()
      }
      return
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (filteredPositions.length === 0) return
      setHighlightedIndex(prev => (prev + 1) % filteredPositions.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (filteredPositions.length === 0) return
      setHighlightedIndex(prev => (prev - 1 + filteredPositions.length) % filteredPositions.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (filteredPositions[highlightedIndex]) {
        handleSelect(filteredPositions[highlightedIndex].title)
      }
    } else if (e.key === 'Escape') {
      closeDropdown()
    }
  }

  return (
    <div className="relative w-full max-w-full">
      <div
        ref={triggerRef}
        className={`
          relative flex items-center w-full px-4 py-3
          bg-white border rounded-xl cursor-pointer
          transition-all duration-200 ease-out
          hover:-translate-y-0.5 focus-within:-translate-y-0.5 focus-within:shadow-lg
          ${isOpen ? 'ring-2 ring-[#0f3d2e] border-transparent' : 'border-base-300'}
          ${required && !value ? 'border-error/30' : ''}
        `}
        onClick={toggleDropdown}
        onKeyDown={handleKeyDown}
        tabIndex={0}
      >
        <span className={`flex-1 min-w-0 ${!value ? 'text-gray-400' : 'text-base-content'}`}>
          {value ? (
            <span className="flex flex-col min-w-0">
              <span className="font-medium truncate">{value}</span>
              {selectedDetails ? (
                <span className="text-xs text-gray-500 truncate">{selectedDetails}</span>
              ) : null}
            </span>
          ) : (
            placeholder
          )}
        </span>
        <div className="flex items-center gap-2 ml-2">
          <svg
            className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {isOpen && createPortal(
        <div
          ref={dropdownRef}
          className="fixed z-[9999] bg-white border border-base-300 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-100"
          style={{
            top: `${coords.top + 4}px`,
            left: `${coords.left}px`,
            width: `${coords.width}px`,
          }}
        >
          <div className="p-2 border-b border-base-200 bg-gray-50/50">
            <input
              type="text"
              className="w-full px-3 py-2 text-sm bg-white border border-base-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0f3d2e]/20 focus:border-[#0f3d2e] transition-all"
              placeholder="Search position, company, or location..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setHighlightedIndex(0)
              }}
              onClick={(e) => e.stopPropagation()}
              autoFocus
            />
          </div>

          <div className="max-h-64 overflow-y-auto p-1">
            {filteredPositions.length > 0 ? (
              filteredPositions.map((pos, index) => (
                <div
                  key={pos.id || index}
                  className={`
                    group flex flex-col px-3 py-2 rounded-lg cursor-pointer transition-colors
                    ${highlightedIndex === index ? 'bg-[#0f3d2e] text-white' : 'text-base-content hover:bg-gray-100'}
                  `}
                  onClick={() => handleSelect(pos.title)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                >
                  <span className="font-semibold text-sm truncate">
                    {pos.title}
                  </span>
                  <span className={`text-xs truncate ${highlightedIndex === index ? 'text-gray-200' : 'text-gray-500'}`}>
                    {pos.company?.name || pos.company || 'Unknown Company'} · {pos.location || 'Remote/Unknown'}
                  </span>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-sm text-gray-500 italic px-4">
                No positions found matching your search.
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
