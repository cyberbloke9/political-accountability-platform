'use client'

import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  HelpCircle,
  ExternalLink,
  X
} from 'lucide-react'
import { ComparisonPolitician, getGradeConfig } from '@/lib/comparison'
import { cn } from '@/lib/utils'

interface ComparisonCardProps {
  politician: ComparisonPolitician
  onRemove?: () => void
  showRemove?: boolean
  isWinner?: boolean
  className?: string
}

const STATUS_ICONS = {
  fulfilled: { icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-500' },
  broken: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-500' },
  in_progress: { icon: Clock, color: 'text-blue-500', bg: 'bg-blue-500' },
  pending: { icon: HelpCircle, color: 'text-gray-500', bg: 'bg-gray-500' },
  stalled: { icon: AlertTriangle, color: 'text-yellow-500', bg: 'bg-yellow-500' },
}

export function ComparisonCard({
  politician,
  onRemove,
  showRemove = true,
  isWinner = false,
  className
}: ComparisonCardProps) {
  const gradeConfig = getGradeConfig(politician.grade)
  const fulfillmentRate = politician.fulfillment_rate || 0

  return (
    <Card className={cn(
      'relative overflow-hidden transition-all',
      isWinner && 'ring-2 ring-primary',
      className
    )}>
      {/* Remove Button */}
      {showRemove && onRemove && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 h-7 w-7 z-10 hover:bg-destructive/20 hover:text-destructive"
          onClick={onRemove}
        >
          <X className="h-4 w-4" />
        </Button>
      )}

      {/* Winner Badge */}
      {isWinner && (
        <div className="absolute top-0 left-0 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-br-lg">
          Higher Rate
        </div>
      )}

      <CardContent className="p-6">
        {/* Header - Avatar & Name */}
        <div className="flex flex-col items-center text-center mb-6">
          <Avatar className="h-20 w-20 mb-3">
            <AvatarImage src={politician.image_url || undefined} alt={politician.name} />
            <AvatarFallback className="text-2xl">{politician.name[0]}</AvatarFallback>
          </Avatar>
          <Link href={`/politicians/${politician.slug}`} className="hover:underline">
            <h3 className="font-semibold text-lg">{politician.name}</h3>
          </Link>
          <div className="flex flex-wrap justify-center gap-1 mt-1">
            {politician.party && (
              <Badge variant="secondary" className="text-xs">{politician.party}</Badge>
            )}
            {politician.politician_position && (
              <Badge variant="outline" className="text-xs">{politician.politician_position}</Badge>
            )}
          </div>
          {politician.state && (
            <span className="text-xs text-muted-foreground mt-1">{politician.state}</span>
          )}
        </div>

        {/* Grade Badge */}
        {gradeConfig && (
          <div className="flex justify-center mb-6">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center"
              style={{ backgroundColor: gradeConfig.bgColor }}
            >
              <span
                className="text-4xl font-bold"
                style={{ color: gradeConfig.color }}
              >
                {politician.grade}
              </span>
            </div>
          </div>
        )}

        {/* Fulfillment Rate */}
        <div className="text-center mb-6">
          <div className="text-3xl font-bold">{Math.round(fulfillmentRate)}%</div>
          <div className="text-sm text-muted-foreground">Fulfillment Rate</div>
          <Progress value={fulfillmentRate} className="h-2 mt-2" />
        </div>

        {/* Promise Stats */}
        <div className="space-y-2">
          <div className="text-sm font-medium text-center mb-3">
            {politician.total_promises} Promises Tracked
          </div>

          {/* Status Breakdown */}
          <div className="grid grid-cols-2 gap-2">
            <StatItem
              icon={STATUS_ICONS.fulfilled.icon}
              color={STATUS_ICONS.fulfilled.color}
              label="Fulfilled"
              count={politician.fulfilled_count}
            />
            <StatItem
              icon={STATUS_ICONS.broken.icon}
              color={STATUS_ICONS.broken.color}
              label="Broken"
              count={politician.broken_count}
            />
            <StatItem
              icon={STATUS_ICONS.in_progress.icon}
              color={STATUS_ICONS.in_progress.color}
              label="In Progress"
              count={politician.in_progress_count}
            />
            <StatItem
              icon={STATUS_ICONS.pending.icon}
              color={STATUS_ICONS.pending.color}
              label="Pending"
              count={politician.pending_count}
            />
          </div>
          {politician.stalled_count > 0 && (
            <div className="flex justify-center pt-1">
              <StatItem
                icon={STATUS_ICONS.stalled.icon}
                color={STATUS_ICONS.stalled.color}
                label="Stalled"
                count={politician.stalled_count}
              />
            </div>
          )}
        </div>

        {/* View Profile Link */}
        <Link href={`/politicians/${politician.slug}`} className="block mt-6">
          <Button variant="outline" className="w-full">
            View Full Profile
            <ExternalLink className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}

function StatItem({
  icon: Icon,
  color,
  label,
  count
}: {
  icon: React.ElementType
  color: string
  label: string
  count: number
}) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <Icon className={cn('h-4 w-4', color)} />
      <span className="text-muted-foreground">{label}:</span>
      <span className="font-medium">{count}</span>
    </div>
  )
}

// Stacked bar chart for visual comparison
interface ComparisonBarProps {
  politicians: ComparisonPolitician[]
  metric: 'status' | 'rate'
  className?: string
}

export function ComparisonBar({ politicians, metric, className }: ComparisonBarProps) {
  if (metric === 'rate') {
    return (
      <div className={cn('space-y-3', className)}>
        {politicians.map((p) => (
          <div key={p.slug} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="font-medium truncate">{p.name}</span>
              <span>{Math.round(p.fulfillment_rate || 0)}%</span>
            </div>
            <Progress value={p.fulfillment_rate || 0} className="h-3" />
          </div>
        ))}
      </div>
    )
  }

  // Status breakdown stacked bar
  return (
    <div className={cn('space-y-3', className)}>
      {politicians.map((p) => {
        const total = p.total_promises || 1
        const segments = [
          { color: 'bg-green-500', width: (p.fulfilled_count / total) * 100, label: 'Fulfilled' },
          { color: 'bg-blue-500', width: (p.in_progress_count / total) * 100, label: 'In Progress' },
          { color: 'bg-gray-400', width: (p.pending_count / total) * 100, label: 'Pending' },
          { color: 'bg-yellow-500', width: (p.stalled_count / total) * 100, label: 'Stalled' },
          { color: 'bg-red-500', width: (p.broken_count / total) * 100, label: 'Broken' },
        ]

        return (
          <div key={p.slug} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="font-medium truncate">{p.name}</span>
              <span className="text-muted-foreground">{p.total_promises} promises</span>
            </div>
            <div className="h-4 bg-muted rounded-full overflow-hidden flex">
              {segments.map((seg, i) => (
                seg.width > 0 && (
                  <div
                    key={i}
                    className={cn('h-full', seg.color)}
                    style={{ width: `${seg.width}%` }}
                    title={`${seg.label}: ${Math.round(seg.width)}%`}
                  />
                )
              ))}
            </div>
          </div>
        )
      })}

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground pt-2">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-500" /> Fulfilled</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-500" /> In Progress</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-gray-400" /> Pending</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-yellow-500" /> Stalled</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-500" /> Broken</span>
      </div>
    </div>
  )
}
