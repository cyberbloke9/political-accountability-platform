'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  ElectionCalendarEvent,
  formatCalendarEventType,
  getCalendarEventColor,
  formatElectionLevel
} from '@/lib/elections'
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  MapPin,
  Vote,
  Bell
} from 'lucide-react'

interface ElectionCalendarProps {
  events: ElectionCalendarEvent[]
  className?: string
  onMonthChange?: (year: number, month: number) => void
}

export function ElectionCalendar({
  events,
  className,
  onMonthChange
}: ElectionCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startPadding = firstDay.getDay()
    const totalDays = lastDay.getDate()

    const days: (Date | null)[] = []

    // Add padding for days before the first of the month
    for (let i = 0; i < startPadding; i++) {
      days.push(null)
    }

    // Add all days of the month
    for (let i = 1; i <= totalDays; i++) {
      days.push(new Date(year, month, i))
    }

    return days
  }, [year, month])

  // Group events by date
  const eventsByDate = useMemo(() => {
    const grouped: Record<string, ElectionCalendarEvent[]> = {}
    events.forEach((event) => {
      const dateKey = event.event_date.split('T')[0]
      if (!grouped[dateKey]) {
        grouped[dateKey] = []
      }
      grouped[dateKey].push(event)
    })
    return grouped
  }, [events])

  const goToPreviousMonth = () => {
    const newDate = new Date(year, month - 1, 1)
    setCurrentDate(newDate)
    onMonthChange?.(newDate.getFullYear(), newDate.getMonth() + 1)
  }

  const goToNextMonth = () => {
    const newDate = new Date(year, month + 1, 1)
    setCurrentDate(newDate)
    onMonthChange?.(newDate.getFullYear(), newDate.getMonth() + 1)
  }

  const goToToday = () => {
    const today = new Date()
    setCurrentDate(today)
    onMonthChange?.(today.getFullYear(), today.getMonth() + 1)
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  const today = new Date()
  const isToday = (date: Date | null) => {
    if (!date) return false
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    )
  }

  const getDateKey = (date: Date) => {
    return date.toISOString().split('T')[0]
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {monthNames[month]} {year}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={goToToday}>
              Today
            </Button>
            <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={goToNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Day names header */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {dayNames.map((day) => (
            <div
              key={day}
              className="text-center text-xs font-medium text-muted-foreground py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((date, index) => {
            if (!date) {
              return <div key={`empty-${index}`} className="min-h-[80px]" />
            }

            const dateKey = getDateKey(date)
            const dayEvents = eventsByDate[dateKey] || []
            const hasEvents = dayEvents.length > 0

            return (
              <div
                key={dateKey}
                className={cn(
                  'min-h-[80px] p-1 border rounded-lg transition-colors',
                  isToday(date)
                    ? 'bg-primary/5 border-primary'
                    : hasEvents
                    ? 'bg-muted/50 border-muted-foreground/20'
                    : 'border-transparent hover:bg-muted/30'
                )}
              >
                <div
                  className={cn(
                    'text-sm font-medium mb-1',
                    isToday(date) ? 'text-primary' : 'text-foreground'
                  )}
                >
                  {date.getDate()}
                </div>
                <div className="space-y-1">
                  {dayEvents.slice(0, 2).map((event) => (
                    <Link
                      key={event.id}
                      href={`/elections/${event.election_id}`}
                      className={cn(
                        'block px-1 py-0.5 rounded text-xs truncate',
                        getCalendarEventColor(event.event_type),
                        'text-white hover:opacity-80 transition-opacity'
                      )}
                      title={`${event.election_name || 'Election'} - ${formatCalendarEventType(event.event_type)}`}
                    >
                      {event.phase_number ? `P${event.phase_number}: ` : ''}
                      {formatCalendarEventType(event.event_type)}
                    </Link>
                  ))}
                  {dayEvents.length > 2 && (
                    <div className="text-xs text-muted-foreground px-1">
                      +{dayEvents.length - 2} more
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

// Timeline view for upcoming events
export function ElectionTimeline({
  events,
  className,
  maxEvents = 10
}: {
  events: ElectionCalendarEvent[]
  className?: string
  maxEvents?: number
}) {
  const sortedEvents = useMemo(() => {
    return [...events]
      .filter((e) => new Date(e.event_date) >= new Date())
      .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime())
      .slice(0, maxEvents)
  }, [events, maxEvents])

  if (sortedEvents.length === 0) {
    return (
      <div className={cn('text-center py-8 text-muted-foreground', className)}>
        <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p>No upcoming events</p>
      </div>
    )
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const getDaysUntil = (dateStr: string) => {
    const date = new Date(dateStr)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    date.setHours(0, 0, 0, 0)
    return Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  }

  return (
    <div className={cn('relative', className)}>
      {/* Timeline line */}
      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />

      {/* Events */}
      <div className="space-y-4">
        {sortedEvents.map((event, index) => {
          const daysUntil = getDaysUntil(event.event_date)
          const isImminent = daysUntil <= 7
          const isPolling = event.event_type === 'polling_day' || event.event_type === 'polling_phase'

          return (
            <div key={event.id} className="relative pl-10">
              {/* Timeline dot */}
              <div
                className={cn(
                  'absolute left-2.5 top-2 w-3 h-3 rounded-full border-2 border-background',
                  getCalendarEventColor(event.event_type)
                )}
              />

              <Link href={`/elections/${event.election_id}`}>
                <div
                  className={cn(
                    'p-3 rounded-lg border transition-colors hover:bg-muted/50',
                    isImminent && isPolling && 'border-red-200 bg-red-50 dark:bg-red-950/20',
                    isImminent && !isPolling && 'border-orange-200 bg-orange-50 dark:bg-orange-950/20'
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {event.election_name || 'Election'}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Vote className="h-3 w-3" />
                        {formatCalendarEventType(event.event_type)}
                        {event.phase_number && ` (Phase ${event.phase_number})`}
                      </p>
                    </div>
                    {daysUntil <= 0 ? (
                      <Badge variant="destructive" className="text-xs">Today</Badge>
                    ) : daysUntil === 1 ? (
                      <Badge variant="destructive" className="text-xs">Tomorrow</Badge>
                    ) : daysUntil <= 7 ? (
                      <Badge variant="outline" className="text-xs text-orange-600 border-orange-300">
                        {daysUntil} days
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs">
                        {daysUntil} days
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(event.event_date)}
                    </span>
                    {event.event_time && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {event.event_time}
                      </span>
                    )}
                  </div>

                  {event.is_tentative && (
                    <p className="text-xs text-yellow-600 mt-1 flex items-center gap-1">
                      <Bell className="h-3 w-3" />
                      Date is tentative
                    </p>
                  )}
                </div>
              </Link>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Compact list view
export function ElectionEventsList({
  events,
  className
}: {
  events: ElectionCalendarEvent[]
  className?: string
}) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short'
    })
  }

  return (
    <div className={cn('space-y-2', className)}>
      {events.map((event) => (
        <Link
          key={event.id}
          href={`/elections/${event.election_id}`}
          className="flex items-center justify-between p-2 rounded-lg hover:bg-muted transition-colors"
        >
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'w-2 h-2 rounded-full',
                getCalendarEventColor(event.event_type)
              )}
            />
            <div>
              <p className="text-sm font-medium truncate max-w-[200px]">
                {event.election_name || 'Election'}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatCalendarEventType(event.event_type)}
              </p>
            </div>
          </div>
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {formatDate(event.event_date)}
          </span>
        </Link>
      ))}
    </div>
  )
}
