'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter
} from '@/components/ui/sheet'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Filter, X, RotateCcw } from 'lucide-react'
import { getSearchFilterOptions } from '@/lib/search'
import { cn } from '@/lib/utils'

interface FilterOption {
  value: string
  label: string
  count?: number
}

interface SearchFiltersProps {
  selectedStatus: string[]
  selectedParty: string[]
  selectedCategory: string[]
  selectedState: string[]
  onStatusChange: (status: string[]) => void
  onPartyChange: (party: string[]) => void
  onCategoryChange: (category: string[]) => void
  onStateChange: (state: string[]) => void
  onClearAll: () => void
  className?: string
}

const STATUS_OPTIONS: FilterOption[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'fulfilled', label: 'Fulfilled' },
  { value: 'broken', label: 'Broken' },
  { value: 'stalled', label: 'Stalled' },
]

export function SearchFilters({
  selectedStatus,
  selectedParty,
  selectedCategory,
  selectedState,
  onStatusChange,
  onPartyChange,
  onCategoryChange,
  onStateChange,
  onClearAll,
  className
}: SearchFiltersProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [parties, setParties] = useState<string[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [states, setStates] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch filter options
  useEffect(() => {
    async function fetchOptions() {
      setLoading(true)
      try {
        const options = await getSearchFilterOptions()
        setParties(options.parties)
        setCategories(options.categories)
        setStates(options.states)
      } catch (error) {
        console.error('Error fetching filter options:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchOptions()
  }, [])

  const totalFilters =
    selectedStatus.length +
    selectedParty.length +
    selectedCategory.length +
    selectedState.length

  const toggleFilter = (
    current: string[],
    value: string,
    onChange: (values: string[]) => void
  ) => {
    if (current.includes(value)) {
      onChange(current.filter(v => v !== value))
    } else {
      onChange([...current, value])
    }
  }

  const FilterCheckbox = ({
    value,
    label,
    checked,
    onToggle
  }: {
    value: string
    label: string
    checked: boolean
    onToggle: () => void
  }) => (
    <div className="flex items-center space-x-2">
      <Checkbox
        id={value}
        checked={checked}
        onCheckedChange={onToggle}
      />
      <Label
        htmlFor={value}
        className="text-sm font-normal cursor-pointer flex-1"
      >
        {label}
      </Label>
    </div>
  )

  const FilterSection = ({
    title,
    options,
    selected,
    onChange,
    maxHeight = '200px'
  }: {
    title: string
    options: string[]
    selected: string[]
    onChange: (values: string[]) => void
    maxHeight?: string
  }) => (
    <AccordionItem value={title.toLowerCase()}>
      <AccordionTrigger className="text-sm">
        {title}
        {selected.length > 0 && (
          <Badge variant="secondary" className="ml-2">
            {selected.length}
          </Badge>
        )}
      </AccordionTrigger>
      <AccordionContent>
        <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2" style={{ maxHeight }}>
          {options.map(option => (
            <FilterCheckbox
              key={option}
              value={option}
              label={option}
              checked={selected.includes(option)}
              onToggle={() => toggleFilter(selected, option, onChange)}
            />
          ))}
        </div>
      </AccordionContent>
    </AccordionItem>
  )

  // Active filter badges (for inline display)
  const ActiveFilters = () => {
    const allFilters = [
      ...selectedStatus.map(s => ({ type: 'status', value: s })),
      ...selectedParty.map(p => ({ type: 'party', value: p })),
      ...selectedCategory.map(c => ({ type: 'category', value: c })),
      ...selectedState.map(s => ({ type: 'state', value: s })),
    ]

    if (allFilters.length === 0) return null

    return (
      <div className="flex flex-wrap gap-2 mt-3">
        {allFilters.slice(0, 5).map((filter, idx) => (
          <Badge
            key={`${filter.type}-${filter.value}-${idx}`}
            variant="secondary"
            className="gap-1"
          >
            {filter.value}
            <button
              onClick={() => {
                switch (filter.type) {
                  case 'status':
                    onStatusChange(selectedStatus.filter(s => s !== filter.value))
                    break
                  case 'party':
                    onPartyChange(selectedParty.filter(p => p !== filter.value))
                    break
                  case 'category':
                    onCategoryChange(selectedCategory.filter(c => c !== filter.value))
                    break
                  case 'state':
                    onStateChange(selectedState.filter(s => s !== filter.value))
                    break
                }
              }}
              className="hover:text-destructive"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        {allFilters.length > 5 && (
          <Badge variant="outline">+{allFilters.length - 5} more</Badge>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearAll}
          className="h-6 px-2 text-xs"
        >
          <RotateCcw className="h-3 w-3 mr-1" />
          Clear all
        </Button>
      </div>
    )
  }

  return (
    <div className={cn('', className)}>
      <div className="flex items-center gap-2">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="h-4 w-4" />
              Filters
              {totalFilters > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {totalFilters}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[320px] sm:w-[400px]">
            <SheetHeader>
              <SheetTitle className="flex items-center justify-between">
                Filters
                {totalFilters > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClearAll}
                    className="text-muted-foreground"
                  >
                    <RotateCcw className="h-4 w-4 mr-1" />
                    Clear all
                  </Button>
                )}
              </SheetTitle>
            </SheetHeader>

            <div className="mt-6">
              <Accordion
                type="multiple"
                defaultValue={['status', 'party', 'category', 'state']}
                className="w-full"
              >
                {/* Status Filter */}
                <AccordionItem value="status">
                  <AccordionTrigger className="text-sm">
                    Promise Status
                    {selectedStatus.length > 0 && (
                      <Badge variant="secondary" className="ml-2">
                        {selectedStatus.length}
                      </Badge>
                    )}
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2">
                      {STATUS_OPTIONS.map(option => (
                        <FilterCheckbox
                          key={option.value}
                          value={option.value}
                          label={option.label}
                          checked={selectedStatus.includes(option.value)}
                          onToggle={() =>
                            toggleFilter(selectedStatus, option.value, onStatusChange)
                          }
                        />
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Party Filter */}
                {parties.length > 0 && (
                  <FilterSection
                    title="Party"
                    options={parties}
                    selected={selectedParty}
                    onChange={onPartyChange}
                  />
                )}

                {/* Category Filter */}
                {categories.length > 0 && (
                  <FilterSection
                    title="Category"
                    options={categories}
                    selected={selectedCategory}
                    onChange={onCategoryChange}
                  />
                )}

                {/* State Filter */}
                {states.length > 0 && (
                  <FilterSection
                    title="State"
                    options={states}
                    selected={selectedState}
                    onChange={onStateChange}
                  />
                )}
              </Accordion>
            </div>

            <SheetFooter className="mt-6">
              <Button onClick={() => setIsOpen(false)} className="w-full">
                Apply Filters
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>

      <ActiveFilters />
    </div>
  )
}
