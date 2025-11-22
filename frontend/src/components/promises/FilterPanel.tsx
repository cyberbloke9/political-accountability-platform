'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '@/components/ui/sheet'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Filter, X } from 'lucide-react'
import { getAllParties, getAllTags } from '@/lib/searchPromises'

export interface FilterState {
  status: string[]
  party: string[]
  tags: string[]
  dateFrom?: string
  dateTo?: string
}

interface FilterPanelProps {
  filters: FilterState
  onChange: (filters: FilterState) => void
}

export function FilterPanel({ filters, onChange }: FilterPanelProps) {
  const [parties, setParties] = useState<string[]>([])
  const [tags, setTags] = useState<any[]>([])
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const loadFilterOptions = async () => {
      const [partiesData, tagsData] = await Promise.all([
        getAllParties(),
        getAllTags()
      ])
      setParties(partiesData)
      setTags(tagsData)
    }
    loadFilterOptions()
  }, [])

  const statuses = [
    { value: 'pending', label: 'Pending', color: 'bg-gray-500' },
    { value: 'in_progress', label: 'In Progress', color: 'bg-blue-500' },
    { value: 'fulfilled', label: 'Fulfilled', color: 'bg-green-500' },
    { value: 'broken', label: 'Broken', color: 'bg-red-500' },
    { value: 'stalled', label: 'Stalled', color: 'bg-yellow-500' }
  ]

  const toggleStatus = (status: string) => {
    const newStatuses = filters.status.includes(status)
      ? filters.status.filter(s => s !== status)
      : [...filters.status, status]
    onChange({ ...filters, status: newStatuses })
  }

  const toggleParty = (party: string) => {
    const newParties = filters.party.includes(party)
      ? filters.party.filter(p => p !== party)
      : [...filters.party, party]
    onChange({ ...filters, party: newParties })
  }

  const toggleTag = (tagSlug: string) => {
    const newTags = filters.tags.includes(tagSlug)
      ? filters.tags.filter(t => t !== tagSlug)
      : [...filters.tags, tagSlug]
    onChange({ ...filters, tags: newTags })
  }

  const clearAllFilters = () => {
    onChange({ status: [], party: [], tags: [] })
    setIsOpen(false)
  }

  const activeFilterCount =
    filters.status.length +
    filters.party.length +
    filters.tags.length

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="relative">
          <Filter className="mr-2 h-4 w-4" />
          Filters
          {activeFilterCount > 0 && (
            <Badge
              variant="default"
              className="ml-2 px-1.5 py-0 h-5 min-w-5 flex items-center justify-center"
            >
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center justify-between">
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="h-8"
              >
                <X className="mr-1 h-3 w-3" />
                Clear all
              </Button>
            )}
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Status Filter */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Status</h3>
            <div className="space-y-2">
              {statuses.map((status) => (
                <div key={status.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`status-${status.value}`}
                    checked={filters.status.includes(status.value)}
                    onCheckedChange={() => toggleStatus(status.value)}
                  />
                  <Label
                    htmlFor={`status-${status.value}`}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <span className={`w-2 h-2 rounded-full ${status.color}`} />
                    {status.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Party Filter */}
          {parties.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-3">Political Party</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {parties.map((party) => (
                  <div key={party} className="flex items-center space-x-2">
                    <Checkbox
                      id={`party-${party}`}
                      checked={filters.party.includes(party)}
                      onCheckedChange={() => toggleParty(party)}
                    />
                    <Label
                      htmlFor={`party-${party}`}
                      className="cursor-pointer"
                    >
                      {party}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tags Filter */}
          {tags.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-3">Categories</h3>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Badge
                    key={tag.slug}
                    variant={filters.tags.includes(tag.slug) ? 'default' : 'outline'}
                    className="cursor-pointer hover:bg-primary/90"
                    style={
                      filters.tags.includes(tag.slug)
                        ? { backgroundColor: tag.color, borderColor: tag.color }
                        : {}
                    }
                    onClick={() => toggleTag(tag.slug)}
                  >
                    {tag.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Date Range Filter - Future Enhancement */}
          {/* <div>
            <h3 className="text-sm font-semibold mb-3">Date Range</h3>
            <div className="space-y-2">
              <Input
                type="date"
                value={filters.dateFrom || ''}
                onChange={(e) => onChange({ ...filters, dateFrom: e.target.value })}
                placeholder="From"
              />
              <Input
                type="date"
                value={filters.dateTo || ''}
                onChange={(e) => onChange({ ...filters, dateTo: e.target.value })}
                placeholder="To"
              />
            </div>
          </div> */}
        </div>

        <div className="mt-6 pt-6 border-t">
          <Button onClick={() => setIsOpen(false)} className="w-full">
            Apply Filters
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
