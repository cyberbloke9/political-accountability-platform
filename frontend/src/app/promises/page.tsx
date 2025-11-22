'use client'

import { useState, useEffect, useCallback } from 'react'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { PromiseCard } from '@/components/promises/PromiseCard'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, Plus, X, ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { searchPromises } from '@/lib/searchPromises'
import { FilterPanel, type FilterState } from '@/components/promises/FilterPanel'

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

export default function PromisesPage() {
  const [promises, setPromises] = useState<Promise[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [filters, setFilters] = useState<FilterState>({ status: [], party: [], tags: [] })
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalResults, setTotalResults] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const fetchPromises = useCallback(async () => {
    setLoading(true)
    try {
      const searchFilters = {
        query: debouncedQuery,
        ...filters,
        status: statusFilter === 'all' ? filters.status : [statusFilter],
        sortBy,
        page: currentPage,
        pageSize: 12
      }

      const result = await searchPromises(searchFilters)
      setPromises(result.promises)
      setTotalResults(result.total)
      setTotalPages(result.totalPages)
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
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 container py-8">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Political Promises</h1>
              <p className="text-muted-foreground">Track and verify promises from political leaders</p>
            </div>
            <Link href="/promises/new">
              <Button><Plus className="mr-2 h-4 w-4" />Submit Promise</Button>
            </Link>
          </div>
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search promises, politicians, or parties..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 pr-10" />
              {searchQuery && (<button onClick={clearSearch} className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>)}
            </div>
            <div className="flex gap-2">
              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                </SelectContent>
              </Select>
              <FilterPanel filters={filters} onChange={setFilters} />
            </div>
          </div>
          <Tabs defaultValue="all" onValueChange={setStatusFilter}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="in_progress">In Progress</TabsTrigger>
              <TabsTrigger value="fulfilled">Fulfilled</TabsTrigger>
              <TabsTrigger value="broken">Broken</TabsTrigger>
            </TabsList>
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
              <div className="flex items-center justify-between"><p className="text-sm text-muted-foreground">Found {totalResults} promise{totalResults !== 1 ? 's' : ''}</p></div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{promises.map((promise) => (<PromiseCard key={promise.id} promise={promise} />))}</div>
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6">
                  <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}><ChevronLeft className="h-4 w-4 mr-1" />Previous</Button>
                  <div className="flex items-center gap-1">{[...Array(Math.min(5, totalPages))].map((_, i) => {const pageNum = i + 1; return (<Button key={pageNum} variant={currentPage === pageNum ? 'default' : 'outline'} size="sm" onClick={() => setCurrentPage(pageNum)} className="w-9">{pageNum}</Button>)})}{totalPages > 5 && <span className="text-muted-foreground px-2">...</span>}</div>
                  <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Next<ChevronRight className="h-4 w-4 ml-1" /></Button>
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
