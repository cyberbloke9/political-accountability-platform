'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { PotentialCandidateCard } from '@/components/candidates/PotentialCandidateCard'
import { CandidateStatusQuickFilter } from '@/components/candidates/CandidatesByStateFilter'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Users,
  MapPin,
  ChevronLeft,
  Building,
  Vote,
  UserCheck,
  TrendingUp
} from 'lucide-react'
import {
  PotentialCandidate,
  CandidacyStatus,
  CandidateStatusSummary,
  getPotentialCandidatesByState,
  getCandidateStatusSummaryByState
} from '@/lib/candidates'
import { getParties } from '@/lib/elections'
import { toast } from 'sonner'

export default function CandidatesByStatePage() {
  const params = useParams()
  const stateCode = decodeURIComponent(params.stateCode as string)

  const [candidates, setCandidates] = useState<PotentialCandidate[]>([])
  const [statusSummary, setStatusSummary] = useState<CandidateStatusSummary[]>([])
  const [parties, setParties] = useState<{ id: string; name: string; short_name: string }[]>([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [statusFilter, setStatusFilter] = useState<CandidacyStatus | null>(null)
  const [partyFilter, setPartyFilter] = useState<string>('all')

  // Fetch parties
  useEffect(() => {
    const fetchParties = async () => {
      const { data } = await getParties({ isActive: true })
      if (data) {
        setParties(data.map((p) => ({ id: p.id, name: p.name, short_name: p.short_name })))
      }
    }
    fetchParties()
  }, [])

  // Fetch status summary
  useEffect(() => {
    const fetchSummary = async () => {
      const { data } = await getCandidateStatusSummaryByState(stateCode)
      if (data) setStatusSummary(data)
    }
    fetchSummary()
  }, [stateCode])

  // Fetch candidates
  useEffect(() => {
    const fetchCandidates = async () => {
      setLoading(true)
      try {
        const { data, error } = await getPotentialCandidatesByState(stateCode, {
          status: statusFilter || undefined,
          partyId: partyFilter !== 'all' ? partyFilter : undefined
        })

        if (error) {
          toast.error('Failed to load candidates')
          return
        }

        setCandidates(data || [])
      } catch (error) {
        console.error('Error fetching candidates:', error)
        toast.error('Failed to load candidates')
      } finally {
        setLoading(false)
      }
    }

    fetchCandidates()
  }, [stateCode, statusFilter, partyFilter])

  // Calculate stats
  const totalCandidates = statusSummary.reduce((acc, s) => acc + s.count, 0)
  const announcedCount = statusSummary.find((s) => s.candidacy_status === 'announced')?.count || 0
  const confirmedCount = statusSummary.find((s) => s.candidacy_status === 'confirmed')?.count || 0

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
            <span className="text-foreground">{stateCode}</span>
          </div>

          {/* Page Header */}
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <MapPin className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold">Candidates in {stateCode}</h1>
            </div>
            <p className="text-muted-foreground max-w-2xl">
              View all potential and confirmed candidates who can contest elections
              in {stateCode}. Filter by party or candidacy status.
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
                    <p className="text-2xl font-bold">{totalCandidates}</p>
                    <p className="text-sm text-muted-foreground">Total</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <Vote className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{announcedCount}</p>
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
                    <p className="text-2xl font-bold">{confirmedCount}</p>
                    <p className="text-sm text-muted-foreground">Confirmed</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                    <Building className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {new Set(candidates.map((c) => c.party_name).filter(Boolean)).size}
                    </p>
                    <p className="text-sm text-muted-foreground">Parties</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Status Breakdown */}
          {statusSummary.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Status Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {statusSummary.map((summary) => (
                    <Badge
                      key={summary.candidacy_status}
                      variant="outline"
                      className="cursor-pointer hover:bg-muted"
                      onClick={() =>
                        setStatusFilter(
                          statusFilter === summary.candidacy_status
                            ? null
                            : summary.candidacy_status
                        )
                      }
                    >
                      {summary.candidacy_status}: {summary.count}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-4 items-center">
                <CandidateStatusQuickFilter
                  selectedStatus={statusFilter}
                  onStatusChange={setStatusFilter}
                />

                <div className="flex-1" />

                <Select value={partyFilter} onValueChange={setPartyFilter}>
                  <SelectTrigger className="w-[200px]">
                    <Building className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter by party" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Parties</SelectItem>
                    {parties.map((party) => (
                      <SelectItem key={party.id} value={party.id}>
                        {party.short_name} - {party.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Candidates List */}
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
                  No candidates found in {stateCode} matching your filters.
                </p>
                <div className="flex justify-center gap-2">
                  <Button variant="outline" onClick={() => setStatusFilter(null)}>
                    Clear Status
                  </Button>
                  <Button variant="outline" onClick={() => setPartyFilter('all')}>
                    Clear Party
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Showing {candidates.length} candidates
                {statusFilter && ` with status "${statusFilter}"`}
              </p>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {candidates.map((candidate) => (
                  <PotentialCandidateCard key={candidate.id} candidate={candidate} />
                ))}
              </div>
            </div>
          )}

          {/* Other States */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Browse Other States</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {['Maharashtra', 'Karnataka', 'Tamil Nadu', 'Uttar Pradesh', 'Gujarat', 'Delhi']
                  .filter((s) => s !== stateCode)
                  .map((state) => (
                    <Link key={state} href={`/candidates/by-state/${encodeURIComponent(state)}`}>
                      <Badge variant="outline" className="cursor-pointer hover:bg-muted">
                        {state}
                      </Badge>
                    </Link>
                  ))}
                <Link href="/candidates">
                  <Badge variant="outline" className="cursor-pointer hover:bg-muted">
                    View All →
                  </Badge>
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
