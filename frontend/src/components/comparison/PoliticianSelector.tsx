'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Search, X, Plus, Loader2, AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

interface PoliticianResult {
  id: string
  name: string
  slug: string
  party: string | null
  position: string | null
  state: string | null
  image_url: string | null
  total_promises?: number
}

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
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(true)
  const [results, setResults] = useState<PoliticianResult[]>([])
  const [suggestions, setSuggestions] = useState<PoliticianResult[]>([])
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<NodeJS.Timeout>()

  // Fetch suggestions on mount - query politicians table directly as fallback
  useEffect(() => {
    async function fetchSuggestions() {
      setIsLoadingSuggestions(true)
      setError(null)

      try {
        // Try the view first
        let { data, error: viewError } = await supabase
          .from('politician_comparison_data')
          .select('id, name, slug, party, position, state, image_url, total_promises')
          .eq('is_active', true)
          .order('total_promises', { ascending: false })
          .limit(8)

        // If view fails, fallback to politicians table directly
        if (viewError || !data || data.length === 0) {
          console.log('Fallback to politicians table')
          const { data: fallbackData, error: fallbackError } = await supabase
            .from('politicians')
            .select('id, name, slug, party, position, state, image_url')
            .eq('is_active', true)
            .order('name')
            .limit(8)

          if (fallbackError) {
            console.error('Politicians fetch error:', fallbackError)
            setError('Failed to load politicians')
            return
          }

          data = fallbackData?.map(p => ({ ...p, total_promises: 0 })) || []
        }

        // Filter out already selected
        const filtered = data.filter(p => !selectedSlugs.includes(p.slug))
        setSuggestions(filtered)
      } catch (err) {
        console.error('Suggestions error:', err)
        setError('Failed to load politicians')
      } finally {
        setIsLoadingSuggestions(false)
      }
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
      // Search politicians table directly
      const { data, error: searchError } = await supabase
        .from('politicians')
        .select('id, name, slug, party, position, state, image_url')
        .eq('is_active', true)
        .or(`name.ilike.%${searchQuery}%,party.ilike.%${searchQuery}%,state.ilike.%${searchQuery}%`)
        .not('slug', 'in', `(${selectedSlugs.length > 0 ? selectedSlugs.join(',') : 'null'})`)
        .order('name')
        .limit(10)

      if (searchError) {
        console.error('Search error:', searchError)
        setResults([])
        return
      }

      setResults(data?.map(p => ({ ...p, total_promises: 0 })) || [])
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

  const handleSelect = (politician: PoliticianResult) => {
    if (selectedSlugs.length >= maxSelections) return
    onSelect(politician.slug)
    setQuery('')
    setResults([])
    setIsOpen(false)
  }

  const canAddMore = selectedSlugs.length < maxSelections
  const displayResults = query.length >= 2 ? results : suggestions
  const showDropdown = isOpen && canAddMore

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
        {(isLoading || isLoadingSuggestions) && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-lg shadow-lg z-50 max-h-[300px] overflow-y-auto"
        >
          {/* Error State */}
          {error && (
            <div className="px-3 py-4 text-center text-destructive text-sm flex items-center justify-center gap-2">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          {/* Loading State */}
          {isLoadingSuggestions && !error && (
            <div className="px-3 py-6 text-center text-muted-foreground text-sm">
              <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
              Loading politicians...
            </div>
          )}

          {/* Results */}
          {!isLoadingSuggestions && !error && (
            <>
              {query.length < 2 && displayResults.length > 0 && (
                <div className="px-3 py-2 text-xs text-muted-foreground uppercase tracking-wider border-b bg-muted/50">
                  Popular Politicians
                </div>
              )}

              {displayResults.length > 0 ? (
                displayResults.map((politician) => (
                  <button
                    key={politician.id}
                    onClick={() => handleSelect(politician)}
                    className="w-full px-3 py-3 flex items-center gap-3 hover:bg-muted transition-colors text-left"
                  >
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarImage src={politician.image_url || undefined} />
                      <AvatarFallback className="text-sm">{politician.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{politician.name}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
                        {politician.party && <span>{politician.party}</span>}
                        {politician.state && <span>• {politician.state}</span>}
                      </div>
                    </div>
                    <Plus className="h-5 w-5 text-primary shrink-0" />
                  </button>
                ))
              ) : query.length >= 2 && !isLoading ? (
                <div className="px-3 py-6 text-center text-muted-foreground text-sm">
                  No politicians found for "{query}"
                </div>
              ) : query.length < 2 && displayResults.length === 0 ? (
                <div className="px-3 py-6 text-center text-muted-foreground text-sm">
                  Type at least 2 characters to search
                </div>
              ) : null}
            </>
          )}
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
          className="pl-3 pr-1 py-1.5 gap-2 text-sm"
        >
          <span className="truncate max-w-[150px] sm:max-w-none">{politician.name}</span>
          {politician.party && (
            <span className="text-xs text-muted-foreground hidden sm:inline">({politician.party})</span>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 hover:bg-destructive/20 hover:text-destructive ml-1"
            onClick={() => onRemove(politician.slug)}
          >
            <X className="h-3 w-3" />
          </Button>
        </Badge>
      ))}
    </div>
  )
}
