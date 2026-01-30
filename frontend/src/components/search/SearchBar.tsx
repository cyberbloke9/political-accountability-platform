'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Search,
  X,
  Loader2,
  User,
  FileText,
  Building2,
  Tag,
  MapPin,
  Clock,
  TrendingUp
} from 'lucide-react'
import {
  searchAll,
  getAutocompleteSuggestions,
  getPopularSearches,
  SearchResult,
  AutocompleteSuggestion
} from '@/lib/search'
import { cn } from '@/lib/utils'

interface SearchBarProps {
  placeholder?: string
  className?: string
  autoFocus?: boolean
  onSearch?: (query: string) => void
  showPopularSearches?: boolean
  variant?: 'default' | 'compact' | 'hero'
}

export function SearchBar({
  placeholder = 'Search promises, politicians, parties...',
  className,
  autoFocus = false,
  onSearch,
  showPopularSearches = true,
  variant = 'default'
}: SearchBarProps) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<AutocompleteSuggestion[]>([])
  const [results, setResults] = useState<SearchResult[]>([])
  const [popularSearches, setPopularSearches] = useState<{ query: string; count: number }[]>([])
  const [selectedIndex, setSelectedIndex] = useState(-1)

  // Debounce timer
  const debounceRef = useRef<NodeJS.Timeout>()

  // Fetch popular searches on mount
  useEffect(() => {
    if (showPopularSearches) {
      getPopularSearches().then(setPopularSearches)
    }
  }, [showPopularSearches])

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Debounced search
  const debouncedSearch = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setSuggestions([])
      setResults([])
      return
    }

    setIsLoading(true)

    try {
      const [suggestionsData, resultsData] = await Promise.all([
        getAutocompleteSuggestions(searchQuery, 5),
        searchAll(searchQuery, 5)
      ])

      setSuggestions(suggestionsData)
      setResults(resultsData)
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setQuery(value)
    setSelectedIndex(-1)

    // Clear existing timer
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    // Set new debounced search
    debounceRef.current = setTimeout(() => {
      debouncedSearch(value)
    }, 200)

    if (value.length >= 1) {
      setIsOpen(true)
    }
  }

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const totalItems = suggestions.length + results.length + (query.length >= 2 ? 1 : 0)

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => (prev < totalItems - 1 ? prev + 1 : prev))
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1))
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex === -1 || selectedIndex === 0) {
          handleSearch(query)
        } else if (selectedIndex <= suggestions.length) {
          const suggestion = suggestions[selectedIndex - 1]
          if (suggestion) {
            setQuery(suggestion.suggestion)
            handleSearch(suggestion.suggestion)
          }
        } else {
          const result = results[selectedIndex - suggestions.length - 1]
          if (result) {
            router.push(result.url)
            setIsOpen(false)
          }
        }
        break
      case 'Escape':
        setIsOpen(false)
        inputRef.current?.blur()
        break
    }
  }

  // Handle search submission
  const handleSearch = (searchQuery: string) => {
    if (!searchQuery.trim()) return

    if (onSearch) {
      onSearch(searchQuery)
    } else {
      router.push(`/promises?search=${encodeURIComponent(searchQuery)}`)
    }
    setIsOpen(false)
  }

  // Handle result click
  const handleResultClick = (result: SearchResult) => {
    router.push(result.url)
    setIsOpen(false)
  }

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion)
    handleSearch(suggestion)
  }

  // Get icon for suggestion type
  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'politician':
        return <User className="h-4 w-4 text-blue-500" />
      case 'party':
        return <Building2 className="h-4 w-4 text-purple-500" />
      case 'category':
        return <Tag className="h-4 w-4 text-green-500" />
      case 'state':
        return <MapPin className="h-4 w-4 text-orange-500" />
      case 'recent':
        return <Clock className="h-4 w-4 text-gray-500" />
      default:
        return <Search className="h-4 w-4 text-gray-400" />
    }
  }

  // Get icon for result type
  const getResultIcon = (type: string) => {
    switch (type) {
      case 'politician':
        return <User className="h-4 w-4" />
      case 'promise':
        return <FileText className="h-4 w-4" />
      default:
        return <Search className="h-4 w-4" />
    }
  }

  const showDropdown = isOpen && (
    query.length >= 2 ||
    (query.length === 0 && popularSearches.length > 0 && showPopularSearches)
  )

  return (
    <div className={cn('relative', className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className={cn(
            'pl-10 pr-10',
            variant === 'hero' && 'h-12 text-lg',
            variant === 'compact' && 'h-8 text-sm'
          )}
        />
        {query && (
          <button
            onClick={() => {
              setQuery('')
              setSuggestions([])
              setResults([])
              inputRef.current?.focus()
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        {isLoading && (
          <Loader2 className="absolute right-10 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-lg shadow-lg z-50 max-h-[60vh] sm:max-h-[400px] overflow-y-auto"
        >
          {/* No query - show popular searches */}
          {query.length === 0 && popularSearches.length > 0 && (
            <div className="p-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <TrendingUp className="h-4 w-4" />
                Popular Searches
              </div>
              <div className="flex flex-wrap gap-2">
                {popularSearches.map((item, idx) => (
                  <Badge
                    key={idx}
                    variant="secondary"
                    className="cursor-pointer hover:bg-secondary/80"
                    onClick={() => handleSuggestionClick(item.query)}
                  >
                    {item.query}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Search all option */}
          {query.length >= 2 && (
            <button
              onClick={() => handleSearch(query)}
              className={cn(
                'w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-muted transition-colors border-b',
                selectedIndex === 0 && 'bg-muted'
              )}
            >
              <Search className="h-4 w-4 text-primary" />
              <span>
                Search for "<strong>{query}</strong>"
              </span>
            </button>
          )}

          {/* Autocomplete suggestions */}
          {suggestions.length > 0 && (
            <div className="border-b">
              <div className="px-4 py-2 text-xs text-muted-foreground uppercase tracking-wider">
                Suggestions
              </div>
              {suggestions.map((suggestion, idx) => (
                <button
                  key={`suggestion-${idx}`}
                  onClick={() => handleSuggestionClick(suggestion.suggestion)}
                  className={cn(
                    'w-full px-4 py-2 text-left flex items-center gap-3 hover:bg-muted transition-colors',
                    selectedIndex === idx + 1 && 'bg-muted'
                  )}
                >
                  {getSuggestionIcon(suggestion.type)}
                  <span className="flex-1">{suggestion.suggestion}</span>
                  <Badge variant="outline" className="text-xs">
                    {suggestion.type}
                  </Badge>
                </button>
              ))}
            </div>
          )}

          {/* Search results */}
          {results.length > 0 && (
            <div>
              <div className="px-4 py-2 text-xs text-muted-foreground uppercase tracking-wider">
                Results
              </div>
              {results.map((result, idx) => (
                <button
                  key={`result-${idx}`}
                  onClick={() => handleResultClick(result)}
                  className={cn(
                    'w-full px-4 py-3 text-left flex items-start gap-3 hover:bg-muted transition-colors',
                    selectedIndex === suggestions.length + idx + 1 && 'bg-muted'
                  )}
                >
                  <div className="mt-0.5 text-muted-foreground">
                    {getResultIcon(result.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{result.title}</div>
                    <div className="text-sm text-muted-foreground truncate">
                      {result.subtitle}
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs shrink-0">
                    {result.type}
                  </Badge>
                </button>
              ))}
            </div>
          )}

          {/* No results */}
          {query.length >= 2 && !isLoading && suggestions.length === 0 && results.length === 0 && (
            <div className="px-4 py-8 text-center text-muted-foreground">
              <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No results found for "{query}"</p>
              <p className="text-sm mt-1">Try different keywords</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
