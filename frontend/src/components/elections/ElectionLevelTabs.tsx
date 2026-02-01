'use client'

import { cn } from '@/lib/utils'
import { ElectionLevel, formatElectionLevel, getElectionLevelColor } from '@/lib/elections'
import { Building, Landmark, MapPin, Home, Globe, Vote, Sparkles } from 'lucide-react'

interface ElectionLevelTabsProps {
  selectedLevel: ElectionLevel | 'all'
  onLevelChange: (level: ElectionLevel | 'all') => void
  counts?: Record<ElectionLevel | 'all', number>
  className?: string
  compact?: boolean
}

const levelIcons: Record<ElectionLevel | 'all', React.ReactNode> = {
  all: <Globe className="h-4 w-4" />,
  national: <Landmark className="h-4 w-4" />,
  state: <Building className="h-4 w-4" />,
  regional: <MapPin className="h-4 w-4" />,
  district: <MapPin className="h-4 w-4" />,
  municipal: <Building className="h-4 w-4" />,
  local: <Home className="h-4 w-4" />,
  special: <Sparkles className="h-4 w-4" />
}

const levels: (ElectionLevel | 'all')[] = [
  'all',
  'national',
  'state',
  'municipal',
  'local',
  'special'
]

export function ElectionLevelTabs({
  selectedLevel,
  onLevelChange,
  counts,
  className,
  compact = false
}: ElectionLevelTabsProps) {
  return (
    <div className={cn('w-full', className)}>
      {/* Mobile: Horizontal scrollable tabs */}
      <div className="flex overflow-x-auto pb-2 gap-2 sm:flex-wrap sm:overflow-x-visible sm:pb-0">
        {levels.map((level) => {
          const isActive = selectedLevel === level
          const count = counts?.[level]

          return (
            <button
              key={level}
              onClick={() => onLevelChange(level)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap',
                'border focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary',
                isActive
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background text-muted-foreground border-border hover:bg-muted hover:text-foreground',
                compact && 'px-3 py-1.5 text-xs'
              )}
            >
              {!compact && levelIcons[level]}
              <span>{level === 'all' ? 'All' : formatElectionLevel(level as ElectionLevel)}</span>
              {count !== undefined && count > 0 && (
                <span
                  className={cn(
                    'ml-1 px-1.5 py-0.5 rounded-full text-xs',
                    isActive
                      ? 'bg-primary-foreground/20 text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// Vertical variant for sidebars
export function ElectionLevelTabsVertical({
  selectedLevel,
  onLevelChange,
  counts,
  className
}: ElectionLevelTabsProps) {
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      {levels.map((level) => {
        const isActive = selectedLevel === level
        const count = counts?.[level]

        return (
          <button
            key={level}
            onClick={() => onLevelChange(level)}
            className={cn(
              'flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all',
              'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary',
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <span className="flex items-center gap-2">
              {levelIcons[level]}
              {level === 'all' ? 'All Elections' : formatElectionLevel(level as ElectionLevel)}
            </span>
            {count !== undefined && count > 0 && (
              <span
                className={cn(
                  'px-2 py-0.5 rounded-full text-xs',
                  isActive
                    ? 'bg-primary-foreground/20 text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                {count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

// Badge-style level indicator
export function ElectionLevelBadge({
  level,
  className,
  showIcon = true
}: {
  level: ElectionLevel
  className?: string
  showIcon?: boolean
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
        getElectionLevelColor(level),
        className
      )}
    >
      {showIcon && levelIcons[level]}
      {formatElectionLevel(level)}
    </span>
  )
}
