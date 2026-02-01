'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { ElectionCard } from '@/components/elections/ElectionCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
  Home,
  ChevronLeft,
  Calendar,
  Vote,
  MapPin,
  Users,
  TreePine
} from 'lucide-react'
import {
  Election,
  ElectionStatus,
  getLocalElectionsByState,
  getElectionsByLevel,
  getIndianStates
} from '@/lib/elections'
import { toast } from 'sonner'

export default function LocalElectionsPage() {
  const [elections, setElections] = useState<Election[]>([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [stateFilter, setStateFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')

  const indianStates = getIndianStates()

  const localElectionTypes = [
    { value: 'panchayat', label: 'Panchayat' },
    { value: 'gram_sabha', label: 'Gram Sabha' },
    { value: 'block_council', label: 'Block Council' },
    { value: 'zilla_parishad', label: 'Zilla Parishad' }
  ]

  useEffect(() => {
    const fetchElections = async () => {
      setLoading(true)
      try {
        let data: Election[] | null = null
        let error: string | undefined

        if (stateFilter !== 'all') {
          // Use state-specific query
          const result = await getLocalElectionsByState(
            stateFilter,
            'IND',
            typeFilter !== 'all' ? [typeFilter] : undefined
          )
          data = result.data
          error = result.error
        } else {
          // Get all local elections
          const result = await getElectionsByLevel('local', {
            status: statusFilter !== 'all' ? (statusFilter as ElectionStatus) : undefined
          })
          data = result.data
          error = result.error
        }

        if (error) {
          toast.error('Failed to load local elections')
          return
        }

        // Filter by status if not using state filter
        if (statusFilter !== 'all' && data) {
          data = data.filter((e) => e.status === statusFilter)
        }

        setElections(data || [])
      } catch (error) {
        console.error('Error fetching elections:', error)
        toast.error('Failed to load local elections')
      } finally {
        setLoading(false)
      }
    }

    fetchElections()
  }, [stateFilter, statusFilter, typeFilter])

  // Stats
  const upcomingCount = elections.filter(
    (e) => !['completed', 'cancelled'].includes(e.status)
  ).length
  const panchayatCount = elections.filter(
    (e) => e.election_type === 'panchayat'
  ).length

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 container py-6 md:py-8 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link href="/elections" className="hover:text-foreground flex items-center gap-1">
              <ChevronLeft className="h-4 w-4" />
              Elections
            </Link>
            <span>/</span>
            <span className="text-foreground">Local</span>
          </div>

          {/* Page Header */}
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Home className="h-8 w-8 text-green-600" />
              <h1 className="text-3xl font-bold">Local Elections</h1>
              <Badge className="bg-green-100 text-green-800">Local</Badge>
            </div>
            <p className="text-muted-foreground max-w-2xl">
              Track Panchayat, Gram Sabha, and village-level elections.
              Monitor grassroots democracy and local development promises
              in rural India.
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <Vote className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{elections.length}</p>
                    <p className="text-sm text-muted-foreground">Elections</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                    <Calendar className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{upcomingCount}</p>
                    <p className="text-sm text-muted-foreground">Upcoming</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <TreePine className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{panchayatCount}</p>
                    <p className="text-sm text-muted-foreground">Panchayat</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">2.5L+</p>
                    <p className="text-sm text-muted-foreground">Panchayats</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-4">
                <Select value={stateFilter} onValueChange={setStateFilter}>
                  <SelectTrigger className="w-[220px]">
                    <MapPin className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Select State" />
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

                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Election Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {localElectionTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="announced">Announced</SelectItem>
                    <SelectItem value="nominations_open">Nominations Open</SelectItem>
                    <SelectItem value="campaigning">Campaigning</SelectItem>
                    <SelectItem value="polling">Polling</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Info Cards */}
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
              <CardContent className="pt-6">
                <h3 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                  Three-Tier Panchayati Raj
                </h3>
                <p className="text-sm text-green-700 dark:text-green-300">
                  India's local governance follows a three-tier system: Gram Panchayat
                  (village level), Panchayat Samiti (block level), and Zilla Parishad
                  (district level). These bodies handle local development, social welfare,
                  and rural infrastructure.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
              <CardContent className="pt-6">
                <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                  Why Track Local Elections?
                </h3>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Local representatives directly impact daily life - from roads and
                  sanitation to schools and healthcare. Tracking their promises helps
                  ensure accountability at the grassroots level where change is most felt.
                </p>
              </CardContent>
            </Card>
          </div>

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
          ) : elections.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Home className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Local Elections Found</h3>
                <p className="text-muted-foreground">
                  No local elections match your current filters.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {elections.map((election) => (
                <ElectionCard key={election.id} election={election} />
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
