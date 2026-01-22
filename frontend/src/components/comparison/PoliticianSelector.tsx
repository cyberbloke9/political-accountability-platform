'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Search, X, Plus, Loader2 } from 'lucide-react'
import { searchPoliticiansForComparison, getPopularPoliticiansForComparison, ComparisonSearchResult } from '@/lib/comparison'
import { cn } from '@/lib/utils'

interface PoliticianSelectorProps {
  selectedSlugs: string[]
  onSelect: (slug: string) => void
  onRemove: (slug: string) => void
  maxSelections?: number
  className?: string
}

export function PoliticianSelector({
  selectedSlugs,
  onSelect,
  onRemove,
  maxSelections = 4,
  className
}: PoliticianSelectorProps) {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<ComparisonSearchResult[]>([])
  const [suggestions, setSuggestions] = useState<ComparisonSearchResult[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<NodeJS.Timeout>()

  // Fetch suggestions on mount
  useEffect(() => {
    async function fetchSuggestions() {
      const { data } = await getPopularPoliticiansForComparison(selectedSlugs, 8)
      if (data) setSuggestions(data)
    }
    fetchSuggestions()
  }, [selectedSlugs])

  // Handle click outside
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
  const handleSearch = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setResults([])
      return
    }

    setIsLoading(true)
    try {
      const { data } = await searchPoliticiansForComparison(searchQuery, selectedSlugs)
      setResults(data || [])
    } catch {
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }, [selectedSlugs])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setQuery(value)
    setIsOpen(true)

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => handleSearch(value), 200)
  }

  const handleSelect = (politician: ComparisonSearchResult) => {
    if (selectedSlugs.length >= maxSelections) return
    onSelect(politician.slug)
    setQuery('')
    setResults([])
    setIsOpen(false)
  }

  const canAddMore = selectedSlugs.length < maxSelections
  const displayResults = query.length >= 2 ? results : suggestions.filter(s => !selectedSlugs.includes(s.slug))

  return (
    <div className={cn('relative', className)}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          placeholder={canAddMore ? 'Search politicians to compare...' : 'Maximum selections reached'}
          disabled={!canAddMore}
          className="pl-10 pr-4"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {/* Dropdown */}
      {isOpen && canAddMore && (displayResults.length > 0 || query.length >= 2) && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-lg shadow-lg z-50 max-h-[300px] overflow-y-auto"
        >
          {query.length < 2 && suggestions.length > 0 && (
            <div className="px-3 py-2 text-xs text-muted-foreground uppercase tracking-wider border-b">
              Popular Politicians
            </div>
          )}

          {displayResults.length > 0 ? (
            displayResults.map((politician) => (
              <button
                key={politician.id}
                onClick={() => handleSelect(politician)}
                className="w-full px-3 py-2 flex items-center gap-3 hover:bg-muted transition-colors"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={politician.image_url || undefined} />
                  <AvatarFallback>{politician.name[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1 text-left min-w-0">
                  <div className="font-medium truncate">{politician.name}</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-2">
                    {politician.party && <span>{politician.party}</span>}
                    {politician.total_promises > 0 && (
                      <span>{politician.total_promises} promises</span>
                    )}
                  </div>
                </div>
                <Plus className="h-4 w-4 text-muted-foreground" />
              </button>
            ))
          ) : query.length >= 2 && !isLoading ? (
            <div className="px-3 py-6 text-center text-muted-foreground text-sm">
              No politicians found
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}

// Selected politicians chips display
interface SelectedPoliticiansProps {
  politicians: { slug: string; name: string; party?: string | null }[]
  onRemove: (slug: string) => void
  className?: string
}

export function SelectedPoliticians({ politicians, onRemove, className }: SelectedPoliticiansProps) {
  if (politicians.length === 0) return null

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {politicians.map((politician) => (
        <Badge
          key={politician.slug}
          variant="secondary"
          className="pl-3 pr-1 py-1.5 gap-2"
        >
          <span>{politician.name}</span>
          {politician.party && (
            <span className="text-xs text-muted-foreground">({politician.party})</span>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 hover:bg-destructive/20 hover:text-destructive"
            onClick={() => onRemove(politician.slug)}
          >
            <X className="h-3 w-3" />
          </Button>
        </Badge>
      ))}
    </div>
  )
}
