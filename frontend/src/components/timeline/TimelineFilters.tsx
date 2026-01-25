'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  Filter,
  X,
  CalendarDays,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  HelpCircle,
  FileText,
  ArrowRight
} from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

export type EventType = 'status_change' | 'verification' | 'created' | 'all'
export type StatusFilter = 'fulfilled' | 'broken' | 'in_progress' | 'pending' | 'stalled' | 'all'
export type GroupBy = 'none' | 'month' | 'status'

export interface TimelineFiltersState {
  eventTypes: EventType[]
  statuses: StatusFilter[]
  dateFrom: Date | null
  dateTo: Date | null
  groupBy: GroupBy
}

interface TimelineFiltersProps {
  filters: TimelineFiltersState
  onChange: (filters: TimelineFiltersState) => void
  onReset: () => void
  variant?: 'default' | 'compact'
  className?: string
}

const EVENT_TYPE_OPTIONS = [
  { value: 'status_change', label: 'Status Changes', icon: ArrowRight },
  { value: 'verification', label: 'Verifications', icon: FileText },
  { value: 'created', label: 'Created', icon: CheckCircle2 },
]

const STATUS_OPTIONS = [
  { value: 'fulfilled', label: 'Fulfilled', icon: CheckCircle2, color: 'text-green-500' },
  { value: 'broken', label: 'Broken', icon: XCircle, color: 'text-red-500' },
  { value: 'in_progress', label: 'In Progress', icon: Clock, color: 'text-blue-500' },
  { value: 'pending', label: 'Pending', icon: HelpCircle, color: 'text-gray-500' },
  { value: 'stalled', label: 'Stalled', icon: AlertTriangle, color: 'text-yellow-500' },
]

export const DEFAULT_FILTERS: TimelineFiltersState = {
  eventTypes: [],
  statuses: [],
  dateFrom: null,
  dateTo: null,
  groupBy: 'none'
}

export function TimelineFilters({
  filters,
  onChange,
  onReset,
  variant = 'default',
  className
}: TimelineFiltersProps) {
  const [isOpen, setIsOpen] = useState(false)

  const hasActiveFilters =
    filters.eventTypes.length > 0 ||
    filters.statuses.length > 0 ||
    filters.dateFrom !== null ||
    filters.dateTo !== null ||
    filters.groupBy !== 'none'

  const activeFilterCount =
    filters.eventTypes.length +
    filters.statuses.length +
    (filters.dateFrom ? 1 : 0) +
    (filters.dateTo ? 1 : 0) +
    (filters.groupBy !== 'none' ? 1 : 0)

  const handleEventTypeToggle = (eventType: EventType) => {
    const newEventTypes = filters.eventTypes.includes(eventType)
      ? filters.eventTypes.filter(t => t !== eventType)
      : [...filters.eventTypes, eventType]
    onChange({ ...filters, eventTypes: newEventTypes })
  }

  const handleStatusToggle = (status: StatusFilter) => {
    const newStatuses = filters.statuses.includes(status)
      ? filters.statuses.filter(s => s !== status)
      : [...filters.statuses, status]
    onChange({ ...filters, statuses: newStatuses })
  }

  if (variant === 'compact') {
    return (
      <div className={cn('flex items-center gap-2 flex-wrap', className)}>
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-8">
              <Filter className="h-3.5 w-3.5 mr-1.5" />
              Filters
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-1.5 h-5 px-1.5">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="start">
            <FilterContent
              filters={filters}
              onChange={onChange}
              onReset={onReset}
              onEventTypeToggle={handleEventTypeToggle}
              onStatusToggle={handleStatusToggle}
            />
          </PopoverContent>
        </Popover>

        {/* Quick status filter badges */}
        {filters.statuses.map(status => {
          const opt = STATUS_OPTIONS.find(s => s.value === status)
          if (!opt) return null
          return (
            <Badge
              key={status}
              variant="secondary"
              className="cursor-pointer hover:bg-secondary/80"
              onClick={() => handleStatusToggle(status as StatusFilter)}
            >
              {opt.label}
              <X className="h-3 w-3 ml-1" />
            </Badge>
          )
        })}

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-muted-foreground"
            onClick={onReset}
          >
            Clear all
          </Button>
        )}
      </div>
    )
  }

  // Default variant - expanded
  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium flex items-center gap-2">
          <Filter className="h-4 w-4" />
          Filters
          {activeFilterCount > 0 && (
            <Badge variant="secondary">{activeFilterCount} active</Badge>
          )}
        </h3>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={onReset}>
            Clear all
          </Button>
        )}
      </div>

      <FilterContent
        filters={filters}
        onChange={onChange}
        onReset={onReset}
        onEventTypeToggle={handleEventTypeToggle}
        onStatusToggle={handleStatusToggle}
        expanded
      />
    </div>
  )
}

function FilterContent({
  filters,
  onChange,
  onReset,
  onEventTypeToggle,
  onStatusToggle,
  expanded = false
}: {
  filters: TimelineFiltersState
  onChange: (filters: TimelineFiltersState) => void
  onReset: () => void
  onEventTypeToggle: (type: EventType) => void
  onStatusToggle: (status: StatusFilter) => void
  expanded?: boolean
}) {
  return (
    <div className="space-y-4">
      {/* Event Types */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground uppercase tracking-wider">
          Event Type
        </Label>
        <div className={cn('gap-2', expanded ? 'flex flex-wrap' : 'grid grid-cols-1')}>
          {EVENT_TYPE_OPTIONS.map(({ value, label, icon: Icon }) => (
            <div
              key={value}
              className={cn(
                'flex items-center space-x-2 p-2 rounded-md cursor-pointer transition-colors',
                filters.eventTypes.includes(value as EventType)
                  ? 'bg-primary/10 border border-primary/20'
                  : 'hover:bg-muted'
              )}
              onClick={() => onEventTypeToggle(value as EventType)}
            >
              <Checkbox
                checked={filters.eventTypes.includes(value as EventType)}
                onCheckedChange={() => onEventTypeToggle(value as EventType)}
              />
              <Icon className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{label}</span>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* Status Filter */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground uppercase tracking-wider">
          Status
        </Label>
        <div className={cn('gap-2', expanded ? 'flex flex-wrap' : 'grid grid-cols-2')}>
          {STATUS_OPTIONS.map(({ value, label, icon: Icon, color }) => (
            <div
              key={value}
              className={cn(
                'flex items-center space-x-2 p-2 rounded-md cursor-pointer transition-colors',
                filters.statuses.includes(value as StatusFilter)
                  ? 'bg-primary/10 border border-primary/20'
                  : 'hover:bg-muted'
              )}
              onClick={() => onStatusToggle(value as StatusFilter)}
            >
              <Checkbox
                checked={filters.statuses.includes(value as StatusFilter)}
                onCheckedChange={() => onStatusToggle(value as StatusFilter)}
              />
              <Icon className={cn('h-4 w-4', color)} />
              <span className="text-sm">{label}</span>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* Date Range */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground uppercase tracking-wider">
          Date Range
        </Label>
        <div className="grid grid-cols-2 gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="justify-start text-left font-normal">
                <CalendarDays className="h-4 w-4 mr-2" />
                {filters.dateFrom ? format(filters.dateFrom, 'MMM d, yyyy') : 'From'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={filters.dateFrom || undefined}
                onSelect={(date) => onChange({ ...filters, dateFrom: date || null })}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="justify-start text-left font-normal">
                <CalendarDays className="h-4 w-4 mr-2" />
                {filters.dateTo ? format(filters.dateTo, 'MMM d, yyyy') : 'To'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={filters.dateTo || undefined}
                onSelect={(date) => onChange({ ...filters, dateTo: date || null })}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <Separator />

      {/* Group By */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground uppercase tracking-wider">
          Group By
        </Label>
        <Select
          value={filters.groupBy}
          onValueChange={(value) => onChange({ ...filters, groupBy: value as GroupBy })}
        >
          <SelectTrigger>
            <SelectValue placeholder="None" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            <SelectItem value="month">Month</SelectItem>
            <SelectItem value="status">Status</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

// Hook for managing filter state
export function useTimelineFilters(initialFilters?: Partial<TimelineFiltersState>) {
  const [filters, setFilters] = useState<TimelineFiltersState>({
    ...DEFAULT_FILTERS,
    ...initialFilters
  })

  const resetFilters = () => setFilters(DEFAULT_FILTERS)

  const applyFilters = <T extends { event_type?: string; new_status?: string; created_at: string }>(
    events: T[]
  ): T[] => {
    return events.filter(event => {
      // Filter by event type
      if (filters.eventTypes.length > 0) {
        const eventType = event.event_type || 'status_change'
        if (!filters.eventTypes.includes(eventType as EventType)) {
          return false
        }
      }

      // Filter by status
      if (filters.statuses.length > 0) {
        const status = event.new_status || 'pending'
        if (!filters.statuses.includes(status as StatusFilter)) {
          return false
        }
      }

      // Filter by date range
      const eventDate = new Date(event.created_at)
      if (filters.dateFrom && eventDate < filters.dateFrom) {
        return false
      }
      if (filters.dateTo && eventDate > filters.dateTo) {
        return false
      }

      return true
    })
  }

  return {
    filters,
    setFilters,
    resetFilters,
    applyFilters,
    hasActiveFilters: filters.eventTypes.length > 0 ||
      filters.statuses.length > 0 ||
      filters.dateFrom !== null ||
      filters.dateTo !== null ||
      filters.groupBy !== 'none'
  }
}
