'use client'

import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  HelpCircle
} from 'lucide-react'
import { highlightSearchTerms } from '@/lib/search'

interface SearchResultCardProps {
  promise: {
    id: string
    politician_name: string
    promise_text: string
    party?: string
    status: string
    view_count?: number
    category?: string
    state?: string
    tags?: { name: string; color?: string }[]
  }
  searchQuery?: string
}

const statusConfig = {
  pending: {
    label: 'Pending',
    icon: HelpCircle,
    className: 'bg-gray-500/10 text-gray-600 border-gray-500/20'
  },
  in_progress: {
    label: 'In Progress',
    icon: Clock,
    className: 'bg-blue-500/10 text-blue-600 border-blue-500/20'
  },
  fulfilled: {
    label: 'Fulfilled',
    icon: CheckCircle2,
    className: 'bg-green-500/10 text-green-600 border-green-500/20'
  },
  broken: {
    label: 'Broken',
    icon: XCircle,
    className: 'bg-red-500/10 text-red-600 border-red-500/20'
  },
  stalled: {
    label: 'Stalled',
    icon: AlertTriangle,
    className: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20'
  }
}

export function SearchResultCard({ promise, searchQuery }: SearchResultCardProps) {
  const status = statusConfig[promise.status as keyof typeof statusConfig] || statusConfig.pending
  const StatusIcon = status.icon

  // Highlight search terms in text
  const highlightedName = searchQuery
    ? highlightSearchTerms(promise.politician_name, searchQuery)
    : promise.politician_name

  const highlightedText = searchQuery
    ? highlightSearchTerms(promise.promise_text, searchQuery)
    : promise.promise_text

  return (
    <Link href={`/promises/${promise.id}`}>
      <Card className="hover:shadow-md transition-all hover:border-primary/50 cursor-pointer h-full">
        <CardContent className="p-4 sm:p-5">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex-1 min-w-0">
              <h3
                className="font-semibold text-base sm:text-lg truncate"
                dangerouslySetInnerHTML={{ __html: highlightedName }}
              />
              {promise.party && (
                <p className="text-sm text-muted-foreground">{promise.party}</p>
              )}
            </div>
            <Badge className={`${status.className} border shrink-0`}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {status.label}
            </Badge>
          </div>

          {/* Promise Text */}
          <p
            className="text-sm text-muted-foreground line-clamp-3 mb-3"
            dangerouslySetInnerHTML={{ __html: highlightedText }}
          />

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            {promise.category && (
              <Badge variant="outline" className="text-xs">
                {promise.category}
              </Badge>
            )}
            {promise.state && (
              <Badge variant="outline" className="text-xs">
                {promise.state}
              </Badge>
            )}
            {promise.view_count !== undefined && (
              <span className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                {promise.view_count} views
              </span>
            )}
          </div>

          {/* Tags */}
          {promise.tags && promise.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-3">
              {promise.tags.slice(0, 3).map((tag, idx) => (
                <Badge
                  key={idx}
                  variant="secondary"
                  className="text-xs"
                  style={tag.color ? { backgroundColor: `${tag.color}20`, color: tag.color } : undefined}
                >
                  {tag.name}
                </Badge>
              ))}
              {promise.tags.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{promise.tags.length - 3}
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
