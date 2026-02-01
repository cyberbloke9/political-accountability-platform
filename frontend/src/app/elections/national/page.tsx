'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { ElectionCard } from '@/components/elections/ElectionCard'
import { Button } from '@/components/ui/button'
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
  Landmark,
  ChevronLeft,
  Calendar,
  Vote,
  Users,
  Globe
} from 'lucide-react'
import {
  Election,
  ElectionStatus,
  getElectionsByLevel,
  getCountries
} from '@/lib/elections'
import { toast } from 'sonner'

export default function NationalElectionsPage() {
  const [elections, setElections] = useState<Election[]>([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [countryFilter, setCountryFilter] = useState<string>('IND')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [yearFilter, setYearFilter] = useState<string>('all')

  // Generate years for filter
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i)

  useEffect(() => {
    const fetchElections = async () => {
      setLoading(true)
      try {
        const { data, error } = await getElectionsByLevel('national', {
          countryCode: countryFilter,
          status: statusFilter !== 'all' ? (statusFilter as ElectionStatus) : undefined,
          year: yearFilter !== 'all' ? parseInt(yearFilter) : undefined
        })

        if (error) {
          toast.error('Failed to load national elections')
          return
        }

        setElections(data || [])
      } catch (error) {
        console.error('Error fetching elections:', error)
        toast.error('Failed to load national elections')
      } finally {
        setLoading(false)
      }
    }

    fetchElections()
  }, [countryFilter, statusFilter, yearFilter])

  // Stats
  const upcomingCount = elections.filter(
    (e) => !['completed', 'cancelled'].includes(e.status)
  ).length
  const completedCount = elections.filter((e) => e.status === 'completed').length

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
            <span className="text-foreground">National</span>
          </div>

          {/* Page Header */}
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Landmark className="h-8 w-8 text-indigo-600" />
              <h1 className="text-3xl font-bold">National Elections</h1>
              <Badge className="bg-indigo-100 text-indigo-800">National</Badge>
            </div>
            <p className="text-muted-foreground max-w-2xl">
              Track national elections including Parliamentary, Presidential, and
              Lok Sabha/Rajya Sabha elections. Monitor candidates and promises at
              the highest level of government.
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                    <Vote className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{elections.length}</p>
                    <p className="text-sm text-muted-foreground">Total</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
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
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <Users className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{completedCount}</p>
                    <p className="text-sm text-muted-foreground">Completed</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <Globe className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">543</p>
                    <p className="text-sm text-muted-foreground">LS Seats</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-4">
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
                    <SelectItem value="counting">Counting</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={yearFilter} onValueChange={setYearFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Years</SelectItem>
                    {years.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
          ) : elections.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Landmark className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No National Elections Found</h3>
                <p className="text-muted-foreground">
                  No national elections match your current filters.
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
