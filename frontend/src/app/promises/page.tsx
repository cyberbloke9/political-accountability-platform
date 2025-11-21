'use client'

import { useState, useEffect, useCallback } from 'react'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { PromiseCard } from '@/components/promises/PromiseCard'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Search, Filter, Plus } from 'lucide-react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

interface Promise {
  id: string
  politician_name: string
  promise_text: string
  promise_date: string
  category?: string
  status: 'pending' | 'in_progress' | 'fulfilled' | 'broken' | 'stalled'
  view_count?: number
  verification_count?: number
  created_at: string
}

export default function PromisesPage() {
  const [promises, setPromises] = useState<Promise[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const fetchPromises = useCallback(async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('promises')
        .select('*')
        .order('created_at', { ascending: false })

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter)
      }

      const { data, error } = await query

      if (error) throw error

      // Fetch verification counts separately
      const promisesWithCounts = await Promise.all(
        (data || []).map(async (promise) => {
          const { count } = await supabase
            .from('verifications')
            .select('*', { count: 'exact', head: true })
            .eq('promise_id', promise.id)

          return {
            ...promise,
            verification_count: count || 0
          }
        })
      )

      setPromises(promisesWithCounts)
    } catch (error) {
      console.error('Error fetching promises:', error)
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => {
    fetchPromises()
  }, [fetchPromises])

  const filteredPromises = promises.filter((promise) =>
    promise.politician_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    promise.promise_text.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 container py-8">
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Political Promises
              </h1>
              <p className="text-muted-foreground">
                Track and verify promises from political leaders
              </p>
            </div>
            <Link href="/promises/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Submit Promise
              </Button>
            </Link>
          </div>

          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search promises or politicians..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Filters
            </Button>
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
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="h-64 rounded-lg border bg-card animate-pulse"
                />
              ))}
            </div>
          ) : filteredPromises.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg">
              <Search className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">No promises found</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Try adjusting your search or filters
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {filteredPromises.length} promise{filteredPromises.length !== 1 ? 's' : ''}
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredPromises.map((promise) => (
                  <PromiseCard key={promise.id} promise={promise} />
                ))}
              </div>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
