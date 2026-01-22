'use client'

import { useState } from 'react'
import Link from 'next/link'
import { format, formatDistanceToNow } from 'date-fns'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  HelpCircle,
  Plus,
  ArrowRight,
  FileText,
  ChevronDown,
  ChevronUp,
  ExternalLink
} from 'lucide-react'
import {
  TimelineEvent,
  getTimelineIcon,
  formatTimelineEvent,
  calculateEventGaps,
  getStatusLabel,
  PoliticianTimelineEvent
} from '@/lib/timeline'
import { cn } from '@/lib/utils'

interface VerticalTimelineProps {
  events: (TimelineEvent | PoliticianTimelineEvent)[]
  variant?: 'default' | 'compact'
  showGaps?: boolean
  showPromiseLinks?: boolean
  maxVisible?: number
  className?: string
}

const ICON_MAP: Record<string, React.ElementType> = {
  CheckCircle: CheckCircle2,
  XCircle: XCircle,
  Clock: Clock,
  AlertCircle: AlertTriangle,
  Plus: Plus,
  ArrowRight: ArrowRight,
}

export function VerticalTimeline({
  events,
  variant = 'default',
  showGaps = true,
  showPromiseLinks = false,
  maxVisible = 5,
  className
}: VerticalTimelineProps) {
  const [showAll, setShowAll] = useState(false)

  if (events.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p>No timeline events yet</p>
      </div>
    )
  }

  const eventsWithGaps = calculateEventGaps(events)
  const visibleEvents = showAll ? eventsWithGaps : eventsWithGaps.slice(0, maxVisible)
  const hasMore = events.length > maxVisible

  return (
    <div className={cn('relative', className)}>
      {/* Timeline line */}
      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />

      {/* Events */}
      <div className="space-y-0">
        {visibleEvents.map(({ event, daysSincePrevious, isSignificantGap }, index) => {
          const iconConfig = getTimelineIcon(event)
          const Icon = ICON_MAP[iconConfig.icon] || Clock
          const { title, description } = formatTimelineEvent(event)
          const isPoliticianEvent = 'promise_text' in event

          return (
            <div key={`${event.event_id}-${index}`}>
              {/* Gap Indicator */}
              {showGaps && isSignificantGap && index > 0 && (
                <div className="flex items-center py-2 pl-10 text-xs text-muted-foreground">
                  <span className="bg-muted px-2 py-1 rounded">
                    {daysSincePrevious} days later
                  </span>
                </div>
              )}

              {/* Event */}
              <div className="relative flex gap-4 pb-6">
                {/* Icon */}
                <div
                  className={cn(
                    'relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                    iconConfig.bgColor
                  )}
                >
                  <Icon className={cn('h-4 w-4', iconConfig.color)} />
                </div>

                {/* Content */}
                <div className="flex-1 pt-0.5">
                  {variant === 'compact' ? (
                    <CompactEvent
                      title={title}
                      timestamp={event.created_at}
                      status={event.new_status}
                    />
                  ) : (
                    <DetailedEvent
                      title={title}
                      description={description}
                      timestamp={event.created_at}
                      eventType={event.event_type}
                      status={event.new_status}
                      actorName={event.actor_name}
                      promiseText={isPoliticianEvent ? (event as PoliticianTimelineEvent).promise_text : undefined}
                      promiseId={isPoliticianEvent ? (event as PoliticianTimelineEvent).promise_id : undefined}
                      showPromiseLink={showPromiseLinks && isPoliticianEvent}
                    />
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Show More Button */}
      {hasMore && (
        <div className="pl-12 pt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAll(!showAll)}
            className="text-muted-foreground"
          >
            {showAll ? (
              <>
                <ChevronUp className="h-4 w-4 mr-1" />
                Show Less
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-1" />
                Show {events.length - maxVisible} More Events
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  )
}

function CompactEvent({
  title,
  timestamp,
  status
}: {
  title: string
  timestamp: string
  status: string
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-sm font-medium truncate">{title}</span>
        <Badge variant="outline" className="text-xs shrink-0">
          {getStatusLabel(status)}
        </Badge>
      </div>
      <span className="text-xs text-muted-foreground shrink-0">
        {formatDistanceToNow(new Date(timestamp), { addSuffix: true })}
      </span>
    </div>
  )
}

function DetailedEvent({
  title,
  description,
  timestamp,
  eventType,
  status,
  actorName,
  promiseText,
  promiseId,
  showPromiseLink
}: {
  title: string
  description: string
  timestamp: string
  eventType: string
  status: string
  actorName: string | null
  promiseText?: string
  promiseId?: string
  showPromiseLink?: boolean
}) {
  const [expanded, setExpanded] = useState(false)
  const date = new Date(timestamp)

  return (
    <Card className="border-0 shadow-none bg-transparent">
      <CardContent className="p-0 space-y-2">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium">{title}</span>
              <Badge variant="outline" className="text-xs">
                {getStatusLabel(status)}
              </Badge>
              {eventType === 'verification' && (
                <Badge variant="secondary" className="text-xs">
                  <FileText className="h-3 w-3 mr-1" />
                  Verification
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{format(date, 'MMM d, yyyy')}</span>
              <span>at</span>
              <span>{format(date, 'h:mm a')}</span>
              {actorName && (
                <>
                  <span>by</span>
                  <span className="font-medium">{actorName}</span>
                </>
              )}
            </div>
          </div>
          <span className="text-xs text-muted-foreground shrink-0">
            {formatDistanceToNow(date, { addSuffix: true })}
          </span>
        </div>

        {/* Promise Context (for politician timeline) */}
        {showPromiseLink && promiseText && promiseId && (
          <Link
            href={`/promises/${promiseId}`}
            className="block p-2 rounded bg-muted/50 hover:bg-muted transition-colors text-sm group"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-muted-foreground line-clamp-2">
                "{promiseText}"
              </p>
              <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-foreground" />
            </div>
          </Link>
        )}

        {/* Description */}
        {description && description !== title && (
          <div>
            <p className={cn(
              'text-sm text-muted-foreground',
              !expanded && description.length > 150 && 'line-clamp-2'
            )}>
              {description}
            </p>
            {description.length > 150 && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="text-xs text-primary hover:underline mt-1"
              >
                {expanded ? 'Show less' : 'Read more'}
              </button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Compact timeline for cards/previews
export function TimelinePreview({
  events,
  maxEvents = 3,
  className
}: {
  events: TimelineEvent[]
  maxEvents?: number
  className?: string
}) {
  const recentEvents = events.slice(0, maxEvents)

  if (recentEvents.length === 0) {
    return null
  }

  return (
    <div className={cn('space-y-2', className)}>
      {recentEvents.map((event, index) => {
        const iconConfig = getTimelineIcon(event)
        const Icon = ICON_MAP[iconConfig.icon] || Clock

        return (
          <div key={index} className="flex items-center gap-2 text-sm">
            <Icon className={cn('h-4 w-4', iconConfig.color)} />
            <span className="truncate flex-1">{getStatusLabel(event.new_status)}</span>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}
            </span>
          </div>
        )
      })}
    </div>
  )
}
