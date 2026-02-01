'use client'

import { useEffect, useState } from 'react'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { ElectionCalendar, ElectionTimeline } from '@/components/elections/ElectionCalendar'
import { ElectionLevelTabs } from '@/components/elections/ElectionLevelTabs'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Calendar,
  List,
  MapPin,
  Clock,
  ChevronLeft
} from 'lucide-react'
import Link from 'next/link'
import {
  ElectionLevel,
  ElectionCalendarEvent,
  getUpcomingElectionEvents,
  getIndianStates
} from '@/lib/elections'
import { toast } from 'sonner'

export default function UpcomingElectionsPage() {
  const [events, setEvents] = useState<ElectionCalendarEvent[]>([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [levelFilter, setLevelFilter] = useState<ElectionLevel | 'all'>('all')
  const [stateFilter, setStateFilter] = useState<string>('all')
  const [daysAhead, setDaysAhead] = useState<number>(90)
  const [viewMode, setViewMode] = useState<'calendar' | 'timeline'>('timeline')

  const indianStates = getIndianStates()

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true)
      try {
        const { data, error } = await getUpcomingElectionEvents(
          {
            level: levelFilter !== 'all' ? levelFilter : undefined,
            stateCode: stateFilter !== 'all' ? stateFilter : undefined,
            daysAhead: daysAhead
          },
          100
        )

        if (error) {
          toast.error('Failed to load upcoming events')
          return
        }

        setEvents(data || [])
      } catch (error) {
        console.error('Error fetching events:', error)
        toast.error('Failed to load upcoming events')
      } finally {
        setLoading(false)
      }
    }

    fetchEvents()
  }, [levelFilter, stateFilter, daysAhead])

  // Group events by month for calendar view
  const eventsByMonth = events.reduce((acc, event) => {
    const date = new Date(event.event_date)
    const key = `${date.getFullYear()}-${date.getMonth() + 1}`
    if (!acc[key]) {
      acc[key] = []
    }
    acc[key].push(event)
    return acc
  }, {} as Record<string, ElectionCalendarEvent[]>)

  // Get stats
  const pollingEvents = events.filter(
    (e) => e.event_type === 'polling_day' || e.event_type === 'polling_phase'
  )
  const thisWeekEvents = events.filter((e) => {
    const daysUntil = e.days_until ?? Math.ceil(
      (new Date(e.event_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    )
    return daysUntil >= 0 && daysUntil <= 7
  })

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
            <span className="text-foreground">Upcoming</span>
          </div>

          {/* Page Header */}
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Calendar className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold">Upcoming Elections</h1>
            </div>
            <p className="text-muted-foreground max-w-2xl">
              Stay informed about upcoming elections and important dates.
              Never miss a polling day or nomination deadline.
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
                    <p className="text-2xl font-bold">{events.length}</p>
                    <p className="text-sm text-muted-foreground">Events</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                    <Clock className="h-5 w-5 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{thisWeekEvents.length}</p>
                    <p className="text-sm text-muted-foreground">This Week</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <Calendar className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{pollingEvents.length}</p>
                    <p className="text-sm text-muted-foreground">Polling Days</p>
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
                    <p className="text-2xl font-bold">
                      {new Set(events.map((e) => e.election_id)).size}
                    </p>
                    <p className="text-sm text-muted-foreground">Elections</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Level Tabs */}
          <ElectionLevelTabs
            selectedLevel={levelFilter}
            onLevelChange={setLevelFilter}
          />

          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-4 items-center">
                <Select value={stateFilter} onValueChange={setStateFilter}>
                  <SelectTrigger className="w-[200px]">
                    <MapPin className="h-4 w-4 mr-2" />
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

                <Select
                  value={daysAhead.toString()}
                  onValueChange={(v) => setDaysAhead(parseInt(v))}
                >
                  <SelectTrigger className="w-[180px]">
                    <Clock className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Time Range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">Next 30 days</SelectItem>
                    <SelectItem value="60">Next 60 days</SelectItem>
                    <SelectItem value="90">Next 90 days</SelectItem>
                    <SelectItem value="180">Next 6 months</SelectItem>
                    <SelectItem value="365">Next year</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex-1" />

                <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'calendar' | 'timeline')}>
                  <TabsList>
                    <TabsTrigger value="timeline" className="flex items-center gap-2">
                      <List className="h-4 w-4" />
                      Timeline
                    </TabsTrigger>
                    <TabsTrigger value="calendar" className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Calendar
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardContent>
          </Card>

          {/* Content */}
          {loading ? (
            <Card>
              <CardContent className="py-12">
                <div className="flex items-center justify-center gap-3">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                  <span className="text-muted-foreground">Loading events...</span>
                </div>
              </CardContent>
            </Card>
          ) : events.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Upcoming Events</h3>
                <p className="text-muted-foreground">
                  There are no election events scheduled in the selected time range.
                </p>
              </CardContent>
            </Card>
          ) : viewMode === 'timeline' ? (
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Upcoming Events
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ElectionTimeline events={events} maxEvents={50} />
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar with this week's events */}
              <div className="space-y-6">
                {thisWeekEvents.length > 0 && (
                  <Card className="border-red-200 dark:border-red-800">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2 text-red-600 dark:text-red-400">
                        <Clock className="h-4 w-4" />
                        This Week
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {thisWeekEvents.slice(0, 5).map((event) => (
                          <Link
                            key={event.id}
                            href={`/elections/${event.election_id}`}
                            className="block p-3 rounded-lg bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-950/50 transition-colors"
                          >
                            <p className="font-medium text-sm">{event.election_name}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(event.event_date).toLocaleDateString('en-IN', {
                                weekday: 'short',
                                day: 'numeric',
                                month: 'short'
                              })}
                              {' - '}
                              {event.event_type.replace(/_/g, ' ')}
                            </p>
                          </Link>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Quick Links</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Link href="/elections/national">
                        <Button variant="outline" className="w-full justify-start">
                          National Elections
                        </Button>
                      </Link>
                      <Link href="/elections/state">
                        <Button variant="outline" className="w-full justify-start">
                          State Elections
                        </Button>
                      </Link>
                      <Link href="/elections/municipal">
                        <Button variant="outline" className="w-full justify-start">
                          Municipal Elections
                        </Button>
                      </Link>
                      <Link href="/elections/local">
                        <Button variant="outline" className="w-full justify-start">
                          Local Elections
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            <ElectionCalendar
              events={events}
              onMonthChange={(year, month) => {
                // Optionally fetch events for specific month
              }}
            />
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
