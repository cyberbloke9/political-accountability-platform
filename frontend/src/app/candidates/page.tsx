'use client'

import { useEffect, useState } from 'react'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Users,
  UserCheck,
  UserPlus,
  MapPin,
  TrendingUp,
  ChevronRight,
  Megaphone
} from 'lucide-react'
import {
  PotentialCandidate,
  CandidacyStatus,
  getAnnouncedCandidates,
  getAllPotentialCandidates
} from '@/lib/candidates'
import { getIndianStates } from '@/lib/elections'
import { toast } from 'sonner'

export default function CandidatesPage() {
  const [candidates, setCandidates] = useState<PotentialCandidate[]>([])
  const [announcedCandidates, setAnnouncedCandidates] = useState<PotentialCandidate[]>([])
  const [loading, setLoading] = useState(true)
  const [totalCount, setTotalCount] = useState(0)

  // Filters
  const [filters, setFilters] = useState<CandidateFilters>({
    stateCode: null,
    partyId: null,
    status: null,
    search: ''
  })

  // Pagination
  const [page, setPage] = useState(0)
  const pageSize = 12

  const indianStates = getIndianStates()

  // Fetch announced candidates
  useEffect(() => {
    const fetchAnnounced = async () => {
      try {
        const { data } = await getAnnouncedCandidates({}, 6)
        if (data) setAnnouncedCandidates(data)
      } catch (error) {
        console.error('Error fetching announced candidates:', error)
      }
    }
    fetchAnnounced()
  }, [])

  // Fetch all candidates with filters
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

  const totalPages = Math.ceil(totalCount / pageSize)

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 container py-6 md:py-8 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Page Header */}
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold">Candidates</h1>
            </div>
            <p className="text-muted-foreground max-w-2xl">
              Track potential and announced candidates for upcoming elections.
              Filter by state to see who might run in your constituency.
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{totalCount}</p>
                    <p className="text-sm text-muted-foreground">Total</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <Megaphone className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{announcedCandidates.length}</p>
                    <p className="text-sm text-muted-foreground">Announced</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <UserCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{indianStates.length}</p>
                    <p className="text-sm text-muted-foreground">States</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {candidates.filter((c) => c.candidacy_status === 'confirmed').length}
                    </p>
                    <p className="text-sm text-muted-foreground">Confirmed</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Links */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/candidates/potential">
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardContent className="pt-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <UserPlus className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">Potential Candidates</span>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>

            <Link href="/elections/upcoming">
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardContent className="pt-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Megaphone className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">Upcoming Elections</span>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>

            <Link href="/politicians">
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardContent className="pt-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">All Politicians</span>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>

            <Link href="/compare">
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardContent className="pt-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">Compare</span>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
          </div>

          {/* Recently Announced */}
          {announcedCandidates.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Megaphone className="h-5 w-5 text-purple-500" />
                  Recently Announced
                </h2>
                <Link href="/candidates/potential?status=announced">
                  <Button variant="ghost" size="sm">
                    View All
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {announcedCandidates.slice(0, 3).map((candidate) => (
                  <PotentialCandidateCard
                    key={candidate.id}
                    candidate={candidate}
                    showDetails={false}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Filters */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Filter Candidates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <CandidatesByStateFilter
                filters={filters}
                onFiltersChange={(newFilters) => {
                  setFilters(newFilters)
                  setPage(0)
                }}
              />
            </CardContent>
          </Card>

          {/* All Candidates */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">All Candidates</h2>
              <p className="text-sm text-muted-foreground">
                {totalCount} total candidates
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
                  <p className="text-muted-foreground">
                    No candidates match your current filters.
                  </p>
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

          {/* Browse by State */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Browse by State
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                {indianStates.slice(0, 15).map((state) => (
                  <Link
                    key={state}
                    href={`/candidates/by-state/${encodeURIComponent(state)}`}
                    className="px-3 py-2 text-sm rounded-lg border hover:bg-muted transition-colors text-center truncate"
                  >
                    {state}
                  </Link>
                ))}
                <Link
                  href="/candidates/potential"
                  className="px-3 py-2 text-sm rounded-lg border hover:bg-muted transition-colors text-center text-primary font-medium"
                >
                  View All →
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  )
}
