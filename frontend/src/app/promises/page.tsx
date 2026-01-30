'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { PromiseCard } from '@/components/promises/PromiseCard'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, Plus, X, ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { advancedSearch } from '@/lib/search'
import { FilterPanel, type FilterState } from '@/components/promises/FilterPanel'
import { highlightSearchTerms } from '@/lib/search'

interface Promise {
  id: string
  politician_name: string
  promise_text: string
  promise_date: string
  party?: string
  category?: string
  status: 'pending' | 'in_progress' | 'fulfilled' | 'broken' | 'stalled'
  view_count?: number
  verification_count?: number
  created_at: string
  tags?: any[]
}

function PromisesContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  // Initialize search query from URL
  const initialQuery = searchParams.get('search') || ''

  const [promises, setPromises] = useState<Promise[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState(initialQuery)
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [filters, setFilters] = useState<FilterState>({ status: [], party: [], tags: [] })
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'most_viewed'>('newest')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalResults, setTotalResults] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [searchTime, setSearchTime] = useState(0)

  // Update search query when URL changes
  useEffect(() => {
    const urlQuery = searchParams.get('search') || ''
    if (urlQuery !== searchQuery) {
      setSearchQuery(urlQuery)
      setDebouncedQuery(urlQuery)
    }
  }, [searchParams])

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery)
      // Update URL when query changes
      if (searchQuery !== initialQuery) {
        const params = new URLSearchParams(searchParams.toString())
        if (searchQuery) {
          params.set('search', searchQuery)
        } else {
          params.delete('search')
        }
        router.replace(`/promises?${params.toString()}`, { scroll: false })
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const fetchPromises = useCallback(async () => {
    setLoading(true)
    try {
      const searchFilters = {
        query: debouncedQuery,
        party: filters.party,
        status: statusFilter === 'all' ? filters.status : [statusFilter],
        sortBy: sortBy as 'relevance' | 'newest' | 'oldest' | 'most_viewed',
        page: currentPage,
        pageSize: 12
      }

      const result = await advancedSearch(searchFilters)
      setPromises(result.promises)
      setTotalResults(result.total)
      setTotalPages(result.totalPages)
      setSearchTime(result.searchTime)
    } catch (error) {
      console.error('Error fetching promises:', error)
    } finally {
      setLoading(false)
    }
  }, [debouncedQuery, statusFilter, filters, sortBy, currentPage])

  useEffect(() => {
    fetchPromises()
  }, [fetchPromises])

  const clearSearch = () => {
    setSearchQuery('')
    router.replace('/promises', { scroll: false })
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 container py-4 sm:py-8 px-4 sm:px-6">
        <div className="space-y-4 sm:space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Political Promises</h1>
              <p className="text-sm sm:text-base text-muted-foreground">Track and verify promises from political leaders</p>
            </div>
            <Link href="/promises/new" className="w-full sm:w-auto">
              <Button className="w-full sm:w-auto"><Plus className="mr-2 h-4 w-4" />Submit Promise</Button>
            </Link>
          </div>
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search promises, politicians, or parties..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 pr-10" />
              {searchQuery && (<button onClick={clearSearch} className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>)}
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger className="w-full sm:w-[160px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="most_viewed">Most Viewed</SelectItem>
                </SelectContent>
              </Select>
              <FilterPanel filters={filters} onChange={setFilters} />
            </div>
          </div>
          <Tabs defaultValue="all" onValueChange={setStatusFilter}>
            <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
              <TabsList className="w-full sm:w-auto inline-flex min-w-max">
                <TabsTrigger value="all" className="text-xs sm:text-sm">All</TabsTrigger>
                <TabsTrigger value="pending" className="text-xs sm:text-sm">Pending</TabsTrigger>
                <TabsTrigger value="in_progress" className="text-xs sm:text-sm">In Progress</TabsTrigger>
                <TabsTrigger value="fulfilled" className="text-xs sm:text-sm">Fulfilled</TabsTrigger>
                <TabsTrigger value="broken" className="text-xs sm:text-sm">Broken</TabsTrigger>
              </TabsList>
            </div>
          </Tabs>
          {loading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{[...Array(6)].map((_, i) => (<div key={i} className="h-64 rounded-lg border bg-card animate-pulse" />))}</div>
          ) : promises.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg">
              <Search className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">No promises found</h3>
              <p className="text-sm text-muted-foreground mt-2">{searchQuery || statusFilter !== 'all' ? 'Try adjusting your search or filters' : 'No promises have been submitted yet'}</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Found {totalResults} promise{totalResults !== 1 ? 's' : ''}
                  {debouncedQuery && searchTime > 0 && (
                    <span className="ml-2 text-xs">({(searchTime / 1000).toFixed(2)}s)</span>
                  )}
                </p>
              </div>
              <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">{promises.map((promise) => (<PromiseCard key={promise.id} promise={promise} />))}</div>
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-1 sm:gap-2 mt-6 flex-wrap">
                  <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-2 sm:px-3">
                    <ChevronLeft className="h-4 w-4" />
                    <span className="hidden sm:inline ml-1">Previous</span>
                  </Button>
                  <div className="flex items-center gap-1">
                    {[...Array(Math.min(5, totalPages))].map((_, i) => {
                      const pageNum = i + 1
                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setCurrentPage(pageNum)}
                          className="w-8 sm:w-9 px-0"
                        >
                          {pageNum}
                        </Button>
                      )
                    })}
                    {totalPages > 5 && <span className="text-muted-foreground px-1 sm:px-2">...</span>}
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-2 sm:px-3">
                    <span className="hidden sm:inline mr-1">Next</span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}

// Wrap in Suspense for useSearchParams
export default function PromisesPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 container py-8">
          <div className="space-y-6">
            <div className="h-10 w-64 bg-muted rounded animate-pulse" />
            <div className="h-10 w-full bg-muted rounded animate-pulse" />
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-64 rounded-lg border bg-card animate-pulse" />
              ))}
            </div>
          </div>
        </main>
        <Footer />
      </div>
    }>
      <PromisesContent />
    </Suspense>
  )
}
