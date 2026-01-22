'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Clock,
  Activity,
  FileText,
  RefreshCw,
  Calendar,
  TrendingUp,
  Loader2
} from 'lucide-react'
import { VerticalTimeline } from './VerticalTimeline'
import {
  getPoliticianTimeline,
  getPoliticianTimelineStats,
  PoliticianTimelineEvent,
  PoliticianTimelineStats
} from '@/lib/timeline'
import { cn } from '@/lib/utils'

interface PoliticianTimelineProps {
  politicianName: string
  maxEvents?: number
  showFilters?: boolean
  showStats?: boolean
  className?: string
}

export function PoliticianTimeline({
  politicianName,
  maxEvents = 20,
  showFilters = true,
  showStats = true,
  className
}: PoliticianTimelineProps) {
  const [events, setEvents] = useState<PoliticianTimelineEvent[]>([])
  const [stats, setStats] = useState<PoliticianTimelineStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'status_change' | 'verification'>('all')

  const fetchTimeline = useCallback(async () => {
    setLoading(true)
    try {
      const eventTypes = filter === 'all' ? undefined : [filter]

      const [timelineResult, statsResult] = await Promise.all([
        getPoliticianTimeline(politicianName, { limit: maxEvents, eventTypes }),
        showStats ? getPoliticianTimelineStats(politicianName) : Promise.resolve({ data: null })
      ])

      if (timelineResult.data) {
        setEvents(timelineResult.data)
      }
      if (statsResult.data) {
        setStats(statsResult.data)
      }
    } catch (error) {
      console.error('Error fetching timeline:', error)
    } finally {
      setLoading(false)
    }
  }, [politicianName, maxEvents, filter, showStats])

  useEffect(() => {
    fetchTimeline()
  }, [fetchTimeline])

  return (
    <div className={cn('space-y-6', className)}>
      {/* Stats Cards */}
      {showStats && stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            icon={Activity}
            label="Total Events"
            value={stats.total_events}
            color="text-blue-500"
          />
          <StatCard
            icon={RefreshCw}
            label="Status Changes"
            value={stats.status_changes}
            color="text-purple-500"
          />
          <StatCard
            icon={FileText}
            label="Verifications"
            value={stats.verifications}
            color="text-green-500"
          />
          <StatCard
            icon={TrendingUp}
            label="This Month"
            value={stats.events_this_month}
            color="text-orange-500"
          />
        </div>
      )}

      {/* Filters */}
      {showFilters && (
        <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
          <TabsList>
            <TabsTrigger value="all">All Events</TabsTrigger>
            <TabsTrigger value="status_change">Status Changes</TabsTrigger>
            <TabsTrigger value="verification">Verifications</TabsTrigger>
          </TabsList>
        </Tabs>
      )}

      {/* Timeline */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : events.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">
              {filter === 'all'
                ? 'No timeline events yet'
                : `No ${filter === 'status_change' ? 'status changes' : 'verifications'} yet`}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <VerticalTimeline
              events={events}
              showGaps={true}
              showPromiseLinks={true}
              maxVisible={10}
            />
          </CardContent>
        </Card>
      )}

      {/* Activity Summary */}
      {stats && stats.avg_days_between_events !== null && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Avg. activity:</span>
                <span className="font-medium">
                  Every {Math.round(stats.avg_days_between_events)} days
                </span>
              </div>
              {stats.most_active_month && (
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Most active:</span>
                  <span className="font-medium">{stats.most_active_month}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  color
}: {
  icon: React.ElementType
  label: string
  value: number
  color: string
}) {
  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-center gap-3">
          <div className={cn('p-2 rounded-lg bg-muted', color)}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
