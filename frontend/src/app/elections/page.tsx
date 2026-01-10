'use client'

import { useEffect, useState } from 'react'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { ElectionCard } from '@/components/elections/ElectionCard'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Vote,
  Filter,
  Search,
  Calendar,
  MapPin,
  Building2,
  TrendingUp
} from 'lucide-react'
import {
  Election,
  ElectionType,
  ElectionStatus,
  getElections,
  getUpcomingElections,
  getIndianStates,
  formatElectionType
} from '@/lib/elections'
import { toast } from 'sonner'

export default function ElectionsPage() {
  const [elections, setElections] = useState<Election[]>([])
  const [upcomingElections, setUpcomingElections] = useState<Election[]>([])
  const [loading, setLoading] = useState(true)
  const [totalCount, setTotalCount] = useState(0)

  // Filters
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [stateFilter, setStateFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Pagination
  const [page, setPage] = useState(0)
  const pageSize = 12

  const indianStates = getIndianStates()

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        // Fetch upcoming elections for featured section
        const { data: upcoming } = await getUpcomingElections(3)
        if (upcoming) setUpcomingElections(upcoming)

        // Fetch all elections with filters
        const { data, count, error } = await getElections(
          {
            type: typeFilter !== 'all' ? typeFilter as ElectionType : undefined,
            status: statusFilter !== 'all' ? statusFilter as ElectionStatus : undefined,
            state: stateFilter !== 'all' ? stateFilter : undefined
          },
          pageSize,
          page * pageSize
        )

        if (error) {
          toast.error('Failed to load elections')
          return
        }

        setElections(data || [])
        setTotalCount(count)
      } catch (error) {
        console.error('Error fetching elections:', error)
        toast.error('Failed to load elections')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [typeFilter, statusFilter, stateFilter, page])

  const filteredElections = elections.filter(election =>
    election.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const totalPages = Math.ceil(totalCount / pageSize)

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 container py-6 md:py-8 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Page Header */}
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Vote className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold">Elections</h1>
            </div>
            <p className="text-muted-foreground max-w-2xl">
              Track elections across India. View candidates, manifestos, and results.
              Hold politicians accountable to their campaign promises.
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{upcomingElections.length}</p>
                    <p className="text-sm text-muted-foreground">Upcoming</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{totalCount}</p>
                    <p className="text-sm text-muted-foreground">Total Tracked</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <MapPin className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{indianStates.length}</p>
                    <p className="text-sm text-muted-foreground">States/UTs</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                    <Building2 className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">543</p>
                    <p className="text-sm text-muted-foreground">LS Seats</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Upcoming Elections Featured */}
          {upcomingElections.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-orange-500" />
                <h2 className="text-xl font-semibold">Upcoming Elections</h2>
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                {upcomingElections.map((election) => (
                  <ElectionCard key={election.id} election={election} />
                ))}
              </div>
            </div>
          )}

          {/* Filters */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filter Elections
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search elections..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>

                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Election Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="lok_sabha">Lok Sabha</SelectItem>
                    <SelectItem value="state_assembly">State Assembly</SelectItem>
                    <SelectItem value="rajya_sabha">Rajya Sabha</SelectItem>
                    <SelectItem value="municipal">Municipal</SelectItem>
                    <SelectItem value="panchayat">Panchayat</SelectItem>
                    <SelectItem value="by_election">By-Election</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="announced">Announced</SelectItem>
                    <SelectItem value="nominations_open">Nominations Open</SelectItem>
                    <SelectItem value="campaigning">Campaigning</SelectItem>
                    <SelectItem value="polling">Polling</SelectItem>
                    <SelectItem value="counting">Counting</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={stateFilter} onValueChange={setStateFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="State/UT" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All States</SelectItem>
                    {indianStates.map((state) => (
                      <SelectItem key={state} value={state}>
                        {state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Active Filters */}
              {(typeFilter !== 'all' || statusFilter !== 'all' || stateFilter !== 'all') && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {typeFilter !== 'all' && (
                    <Badge variant="secondary" className="cursor-pointer" onClick={() => setTypeFilter('all')}>
                      {formatElectionType(typeFilter as ElectionType)} ×
                    </Badge>
                  )}
                  {statusFilter !== 'all' && (
                    <Badge variant="secondary" className="cursor-pointer" onClick={() => setStatusFilter('all')}>
                      {statusFilter} ×
                    </Badge>
                  )}
                  {stateFilter !== 'all' && (
                    <Badge variant="secondary" className="cursor-pointer" onClick={() => setStateFilter('all')}>
                      {stateFilter} ×
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setTypeFilter('all')
                      setStatusFilter('all')
                      setStateFilter('all')
                    }}
                  >
                    Clear All
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Elections Grid */}
          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-6 bg-muted rounded w-3/4" />
                    <div className="h-4 bg-muted rounded w-1/2 mt-2" />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="h-4 bg-muted rounded w-full" />
                      <div className="h-4 bg-muted rounded w-2/3" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredElections.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Vote className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Elections Found</h3>
                <p className="text-muted-foreground">
                  {searchQuery || typeFilter !== 'all' || statusFilter !== 'all' || stateFilter !== 'all'
                    ? 'Try adjusting your filters to find elections.'
                    : 'No elections have been added to the system yet.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {filteredElections.length} of {totalCount} elections
                </p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredElections.map((election) => (
                  <ElectionCard key={election.id} election={election} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setPage(p => Math.max(0, p - 1))}
                    disabled={page === 0}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {page + 1} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                    disabled={page >= totalPages - 1}
                  >
                    Next
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
