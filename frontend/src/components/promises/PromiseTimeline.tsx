'use client'

import { useState, useEffect } from 'react'
import { format, formatDistanceToNow } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Plus,
  ArrowRight,
  FileText,
  Loader2,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  getPromiseTimeline,
  getPromiseLifecycle,
  formatTimelineEvent,
  type TimelineEvent,
  type PromiseLifecycle
} from '@/lib/timeline'
import Link from 'next/link'

interface PromiseTimelineProps {
  promiseId: string
  showLifecycle?: boolean
  maxEvents?: number
}

const iconMap: Record<string, any> = {
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Plus,
  ArrowRight,
  FileText
}

function getEventIcon(event: TimelineEvent) {
  if (event.event_type === 'verification') {
    const verdictIcons: Record<string, { icon: any; color: string; bgColor: string }> = {
      fulfilled: { icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-100' },
      broken: { icon: XCircle, color: 'text-red-600', bgColor: 'bg-red-100' },
      in_progress: { icon: Clock, color: 'text-blue-600', bgColor: 'bg-blue-100' },
      stalled: { icon: AlertCircle, color: 'text-yellow-600', bgColor: 'bg-yellow-100' }
    }
    return verdictIcons[event.verdict || 'in_progress'] || verdictIcons.in_progress
  }

  if (event.change_source === 'creation') {
    return { icon: Plus, color: 'text-purple-600', bgColor: 'bg-purple-100' }
  }

  const statusIcons: Record<string, { icon: any; color: string; bgColor: string }> = {
    pending: { icon: Clock, color: 'text-gray-600', bgColor: 'bg-gray-100' },
    fulfilled: { icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-100' },
    broken: { icon: XCircle, color: 'text-red-600', bgColor: 'bg-red-100' },
    in_progress: { icon: ArrowRight, color: 'text-blue-600', bgColor: 'bg-blue-100' },
    stalled: { icon: AlertCircle, color: 'text-yellow-600', bgColor: 'bg-yellow-100' }
  }

  return statusIcons[event.new_status] || statusIcons.pending
}

export function PromiseTimeline({
  promiseId,
  showLifecycle = true,
  maxEvents = 10
}: PromiseTimelineProps) {
  const [timeline, setTimeline] = useState<TimelineEvent[]>([])
  const [lifecycle, setLifecycle] = useState<PromiseLifecycle | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      setError(null)

      try {
        const [timelineResult, lifecycleResult] = await Promise.all([
          getPromiseTimeline(promiseId),
          showLifecycle ? getPromiseLifecycle(promiseId) : Promise.resolve({ data: null })
        ])

        if (timelineResult.error) {
          setError(timelineResult.error)
        } else {
          setTimeline(timelineResult.data || [])
        }

        if (lifecycleResult.data) {
          setLifecycle(lifecycleResult.data)
        }
      } catch (err) {
        setError('Failed to load timeline')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [promiseId, showLifecycle])

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          {error}
        </CardContent>
      </Card>
    )
  }

  const displayedEvents = expanded ? timeline : timeline.slice(0, maxEvents)
  const hasMore = timeline.length > maxEvents

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Promise Timeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Lifecycle Summary */}
        {showLifecycle && lifecycle && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6 p-4 bg-muted/50 rounded-lg">
            <div className="text-center">
              <p className="text-2xl font-bold">{lifecycle.days_since_created}</p>
              <p className="text-xs text-muted-foreground">Days Old</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{lifecycle.total_status_changes}</p>
              <p className="text-xs text-muted-foreground">Status Changes</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{lifecycle.total_verifications}</p>
              <p className="text-xs text-muted-foreground">Verifications</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{lifecycle.days_in_current_status}</p>
              <p className="text-xs text-muted-foreground">Days in Status</p>
            </div>
          </div>
        )}

        {/* Timeline */}
        {timeline.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">
            No timeline events yet
          </p>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />

            {/* Events */}
            <div className="space-y-6">
              {displayedEvents.map((event, index) => {
                const { icon: Icon, color, bgColor } = getEventIcon(event)
                const { title, description } = formatTimelineEvent(event)

                return (
                  <div key={event.event_id} className="relative pl-10">
                    {/* Icon */}
                    <div className={`absolute left-0 p-2 rounded-full ${bgColor}`}>
                      <Icon className={`h-4 w-4 ${color}`} />
                    </div>

                    {/* Content */}
                    <div className="bg-card border rounded-lg p-4">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-medium">{title}</span>
                        {event.event_type === 'verification' && (
                          <Badge variant="outline" className="text-xs">
                            {event.verdict}
                          </Badge>
                        )}
                      </div>

                      <p className="text-sm text-muted-foreground mb-2">
                        {description}
                      </p>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span>
                          {format(new Date(event.created_at), 'MMM d, yyyy h:mm a')}
                        </span>
                        <span>•</span>
                        <span>
                          {formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}
                        </span>
                        {event.actor_name && (
                          <>
                            <span>•</span>
                            <span>by {event.actor_name}</span>
                          </>
                        )}
                        {event.event_type === 'verification' && (
                          <Link
                            href={`/verifications/${event.event_id}`}
                            className="text-primary hover:underline"
                          >
                            View Details
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Show More/Less Button */}
            {hasMore && (
              <div className="mt-4 text-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setExpanded(!expanded)}
                >
                  {expanded ? (
                    <>
                      <ChevronUp className="h-4 w-4 mr-1" />
                      Show Less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4 mr-1" />
                      Show {timeline.length - maxEvents} More Events
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Compact timeline for cards/lists
export function PromiseTimelineCompact({ promiseId }: { promiseId: string }) {
  const [timeline, setTimeline] = useState<TimelineEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchTimeline() {
      const result = await getPromiseTimeline(promiseId)
      if (result.data) {
        setTimeline(result.data.slice(-3)) // Last 3 events
      }
      setLoading(false)
    }
    fetchTimeline()
  }, [promiseId])

  if (loading || timeline.length === 0) return null

  return (
    <div className="flex items-center gap-1 mt-2">
      {timeline.map((event, index) => {
        const { icon: Icon, color, bgColor } = getEventIcon(event)
        return (
          <div
            key={event.event_id}
            className={`p-1 rounded-full ${bgColor}`}
            title={formatTimelineEvent(event).title}
          >
            <Icon className={`h-3 w-3 ${color}`} />
          </div>
        )
      })}
      {timeline.length > 0 && (
        <span className="text-xs text-muted-foreground ml-1">
          {timeline.length} events
        </span>
      )}
    </div>
  )
}
