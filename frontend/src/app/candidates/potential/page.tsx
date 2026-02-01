'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { PotentialCandidateCard } from '@/components/candidates/PotentialCandidateCard'
import {
  CandidatesByStateFilter,
  CandidateFilters,
  CandidateStatusQuickFilter
} from '@/components/candidates/CandidatesByStateFilter'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Users,
  UserPlus,
  ChevronLeft,
  Filter,
  Megaphone
} from 'lucide-react'
import {
  PotentialCandidate,
  CandidacyStatus,
  getAllPotentialCandidates,
  getAnnouncedCandidates
} from '@/lib/candidates'
import { toast } from 'sonner'

export default function PotentialCandidatesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [candidates, setCandidates] = useState<PotentialCandidate[]>([])
  const [announcedCandidates, setAnnouncedCandidates] = useState<PotentialCandidate[]>([])
  const [loading, setLoading] = useState(true)
  const [totalCount, setTotalCount] = useState(0)

  // Get initial filters from URL
  const initialStatus = searchParams.get('status') as CandidacyStatus | null
  const initialState = searchParams.get('state')

  // Filters
  const [filters, setFilters] = useState<CandidateFilters>({
    stateCode: initialState,
    partyId: null,
    status: initialStatus,
    search: ''
  })

  // Pagination
  const [page, setPage] = useState(0)
  const pageSize = 12

  // Update URL when filters change
  const updateURL = (newFilters: CandidateFilters) => {
    const params = new URLSearchParams()
    if (newFilters.status) params.set('status', newFilters.status)
    if (newFilters.stateCode) params.set('state', newFilters.stateCode)
    router.push(`/candidates/potential?${params.toString()}`, { scroll: false })
  }

  // Fetch announced candidates for featured section
  useEffect(() => {
    const fetchAnnounced = async () => {
      try {
        const { data } = await getAnnouncedCandidates({}, 10)
        if (data) setAnnouncedCandidates(data)
      } catch (error) {
        console.error('Error fetching announced:', error)
      }
    }
    fetchAnnounced()
  }, [])

  // Fetch candidates
  useEffect(() => {
    const fetchCandidates = async () => {
      setLoading(true)
      try {
        const { data, count, error } = await getAllPotentialCandidates(
          {
            stateCode: filters.stateCode || undefined,
            partyId: filters.partyId || undefined,
            status: filters.status || undefined,
            search: filters.search || undefined
          },
          pageSize,
          page * pageSize
        )

        if (error) {
          toast.error('Failed to load candidates')
          return
        }

        setCandidates(data || [])
        setTotalCount(count)
      } catch (error) {
        console.error('Error fetching candidates:', error)
        toast.error('Failed to load candidates')
      } finally {
        setLoading(false)
      }
    }

    fetchCandidates()
  }, [filters, page])

  const handleFiltersChange = (newFilters: CandidateFilters) => {
    setFilters(newFilters)
    setPage(0)
    updateURL(newFilters)
  }

  const totalPages = Math.ceil(totalCount / pageSize)

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 container py-6 md:py-8 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link href="/candidates" className="hover:text-foreground flex items-center gap-1">
              <ChevronLeft className="h-4 w-4" />
              Candidates
            </Link>
            <span>/</span>
            <span className="text-foreground">Potential</span>
          </div>

          {/* Page Header */}
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <UserPlus className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold">Potential Candidates</h1>
            </div>
            <p className="text-muted-foreground max-w-2xl">
              Track potential candidates who could run for upcoming elections.
              See who has announced, who is considering, and who might run.
            </p>
          </div>

          {/* Status Quick Filter */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Quick Filter by Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CandidateStatusQuickFilter
                selectedStatus={filters.status}
                onStatusChange={(status) => handleFiltersChange({ ...filters, status })}
              />
            </CardContent>
          </Card>

          {/* Recently Announced Section */}
          {!filters.status && announcedCandidates.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Megaphone className="h-5 w-5 text-purple-500" />
                <h2 className="text-xl font-semibold">Recently Announced</h2>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {announcedCandidates.slice(0, 6).map((candidate) => (
                  <PotentialCandidateCard
                    key={candidate.id}
                    candidate={candidate}
                    compact
                  />
                ))}
              </div>
            </div>
          )}

          {/* Advanced Filters */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Advanced Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <CandidatesByStateFilter
                filters={filters}
                onFiltersChange={handleFiltersChange}
                showStatusFilter={false}
              />
            </CardContent>
          </Card>

          {/* Results */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                {filters.status
                  ? `${filters.status.charAt(0).toUpperCase() + filters.status.slice(1)} Candidates`
                  : 'All Potential Candidates'}
              </h2>
              <p className="text-sm text-muted-foreground">
                {totalCount} candidates found
              </p>
            </div>

            {loading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader>
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-muted rounded-full" />
                        <div className="flex-1">
                          <div className="h-5 bg-muted rounded w-3/4" />
                          <div className="h-4 bg-muted rounded w-1/2 mt-2" />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="h-4 bg-muted rounded w-full" />
                        <div className="h-4 bg-muted rounded w-2/3" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : candidates.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Candidates Found</h3>
                  <p className="text-muted-foreground mb-4">
                    No candidates match your current filters.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() =>
                      handleFiltersChange({
                        stateCode: null,
                        partyId: null,
                        status: null,
                        search: ''
                      })
                    }
                  >
                    Clear Filters
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {candidates.map((candidate) => (
                    <PotentialCandidateCard key={candidate.id} candidate={candidate} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setPage((p) => Math.max(0, p - 1))}
                      disabled={page === 0}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Page {page + 1} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                      disabled={page >= totalPages - 1}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
