'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { getIndianStates } from '@/lib/elections'
import { getParties } from '@/lib/elections'
import {
  CandidacyStatus,
  getCandidacyStatuses,
  getActiveCandidacyStatuses
} from '@/lib/candidates'
import {
  Search,
  MapPin,
  Building,
  Filter,
  X,
  RefreshCw
} from 'lucide-react'

export interface CandidateFilters {
  stateCode: string | null
  partyId: string | null
  status: CandidacyStatus | null
  search: string
}

interface CandidatesByStateFilterProps {
  filters: CandidateFilters
  onFiltersChange: (filters: CandidateFilters) => void
  showStateFilter?: boolean
  showPartyFilter?: boolean
  showStatusFilter?: boolean
  showSearch?: boolean
  className?: string
  compact?: boolean
}

export function CandidatesByStateFilter({
  filters,
  onFiltersChange,
  showStateFilter = true,
  showPartyFilter = true,
  showStatusFilter = true,
  showSearch = true,
  className,
  compact = false
}: CandidatesByStateFilterProps) {
  const [parties, setParties] = useState<{ id: string; name: string; short_name: string }[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const states = getIndianStates()
  const statuses = getCandidacyStatuses()

  // Fetch parties
  useEffect(() => {
    const fetchParties = async () => {
      setIsLoading(true)
      try {
        const { data } = await getParties({ isActive: true })
        if (data) {
          setParties(data.map((p) => ({ id: p.id, name: p.name, short_name: p.short_name })))
        }
      } catch (error) {
        console.error('Error fetching parties:', error)
      }
      setIsLoading(false)
    }
    fetchParties()
  }, [])

  const updateFilter = (key: keyof CandidateFilters, value: any) => {
    onFiltersChange({ ...filters, [key]: value })
  }

  const clearFilters = () => {
    onFiltersChange({
      stateCode: null,
      partyId: null,
      status: null,
      search: ''
    })
  }

  const hasActiveFilters =
    filters.stateCode || filters.partyId || filters.status || filters.search

  if (compact) {
    return (
      <div className={cn('flex flex-wrap gap-2', className)}>
        {showSearch && (
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search candidates..."
              value={filters.search}
              onChange={(e) => updateFilter('search', e.target.value)}
              className="pl-9"
            />
          </div>
        )}

        {showStateFilter && (
          <Select
            value={filters.stateCode || 'all'}
            onValueChange={(value) => updateFilter('stateCode', value === 'all' ? null : value)}
          >
            <SelectTrigger className="w-[180px]">
              <MapPin className="h-4 w-4 mr-2" />
              <SelectValue placeholder="State" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All States</SelectItem>
              {states.map((state) => (
                <SelectItem key={state} value={state}>
                  {state}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {showStatusFilter && (
          <Select
            value={filters.status || 'all'}
            onValueChange={(value) =>
              updateFilter('status', value === 'all' ? null : (value as CandidacyStatus))
            }
          >
            <SelectTrigger className="w-[150px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {statuses.map((status) => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {hasActiveFilters && (
          <Button variant="ghost" size="icon" onClick={clearFilters} title="Clear filters">
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Search */}
      {showSearch && (
        <div>
          <Label htmlFor="search" className="sr-only">
            Search
          </Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="search"
              placeholder="Search candidates by name..."
              value={filters.search}
              onChange={(e) => updateFilter('search', e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      )}

      {/* Filters Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {showStateFilter && (
          <div className="space-y-2">
            <Label htmlFor="state" className="text-sm font-medium flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              State
            </Label>
            <Select
              value={filters.stateCode || 'all'}
              onValueChange={(value) => updateFilter('stateCode', value === 'all' ? null : value)}
            >
              <SelectTrigger id="state">
                <SelectValue placeholder="Select state" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All States</SelectItem>
                {states.map((state) => (
                  <SelectItem key={state} value={state}>
                    {state}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {showPartyFilter && (
          <div className="space-y-2">
            <Label htmlFor="party" className="text-sm font-medium flex items-center gap-1">
              <Building className="h-3 w-3" />
              Party
            </Label>
            <Select
              value={filters.partyId || 'all'}
              onValueChange={(value) => updateFilter('partyId', value === 'all' ? null : value)}
              disabled={isLoading}
            >
              <SelectTrigger id="party">
                <SelectValue placeholder={isLoading ? 'Loading...' : 'Select party'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Parties</SelectItem>
                {parties.map((party) => (
                  <SelectItem key={party.id} value={party.id}>
                    {party.name} ({party.short_name})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {showStatusFilter && (
          <div className="space-y-2">
            <Label htmlFor="status" className="text-sm font-medium flex items-center gap-1">
              <Filter className="h-3 w-3" />
              Candidacy Status
            </Label>
            <Select
              value={filters.status || 'all'}
              onValueChange={(value) =>
                updateFilter('status', value === 'all' ? null : (value as CandidacyStatus))
              }
            >
              <SelectTrigger id="status">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {statuses.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Filters applied:{' '}
            {[
              filters.stateCode && `State: ${filters.stateCode}`,
              filters.partyId && 'Party selected',
              filters.status && `Status: ${filters.status}`,
              filters.search && `Search: "${filters.search}"`
            ]
              .filter(Boolean)
              .join(', ')}
          </p>
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Clear all
          </Button>
        </div>
      )}
    </div>
  )
}

// State selector component (for dedicated state pages)
export function StateSelector({
  selectedState,
  onStateChange,
  className
}: {
  selectedState: string | null
  onStateChange: (state: string | null) => void
  className?: string
}) {
  const states = getIndianStates()

  return (
    <div className={cn('space-y-2', className)}>
      <Label className="text-sm font-medium">Select State</Label>
      <Select
        value={selectedState || 'select'}
        onValueChange={(value) => onStateChange(value === 'select' ? null : value)}
      >
        <SelectTrigger>
          <MapPin className="h-4 w-4 mr-2" />
          <SelectValue placeholder="Choose a state" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="select" disabled>
            Choose a state
          </SelectItem>
          {states.map((state) => (
            <SelectItem key={state} value={state}>
              {state}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

// Quick status filter buttons
export function CandidateStatusQuickFilter({
  selectedStatus,
  onStatusChange,
  className
}: {
  selectedStatus: CandidacyStatus | null
  onStatusChange: (status: CandidacyStatus | null) => void
  className?: string
}) {
  const quickStatuses: { value: CandidacyStatus | null; label: string }[] = [
    { value: null, label: 'All' },
    { value: 'announced', label: 'Announced' },
    { value: 'filed', label: 'Filed' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'potential', label: 'Potential' }
  ]

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {quickStatuses.map((status) => (
        <Button
          key={status.value || 'all'}
          variant={selectedStatus === status.value ? 'default' : 'outline'}
          size="sm"
          onClick={() => onStatusChange(status.value)}
        >
          {status.label}
        </Button>
      ))}
    </div>
  )
}
