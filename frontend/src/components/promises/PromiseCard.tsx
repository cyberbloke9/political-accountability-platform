'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, Eye, FileText, ExternalLink } from 'lucide-react'

interface PromiseCardProps {
  promise: {
    id: string
    politician_name: string
    promise_text: string
    promise_date: string
    category?: string
    status: 'pending' | 'in_progress' | 'fulfilled' | 'broken' | 'stalled'
    view_count?: number
    verification_count?: number
    created_at: string
  }
}

const statusConfig = {
  pending: {
    label: 'Pending',
    className: 'bg-muted text-muted-foreground',
  },
  in_progress: {
    label: 'In Progress',
    className: 'bg-warning text-warning-foreground',
  },
  fulfilled: {
    label: 'Fulfilled',
    className: 'bg-success text-success-foreground',
  },
  broken: {
    label: 'Broken',
    className: 'bg-destructive text-destructive-foreground',
  },
  stalled: {
    label: 'Stalled',
    className: 'bg-muted text-muted-foreground',
  },
}

export function PromiseCard({ promise }: PromiseCardProps) {
  const status = statusConfig[promise.status]

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="p-4 sm:p-6">
        <div className="flex items-start justify-between gap-2 sm:gap-4">
          <div className="flex-1 space-y-1 min-w-0">
            <CardTitle className="text-base sm:text-lg line-clamp-2">
              {promise.politician_name}
            </CardTitle>
            <CardDescription className="line-clamp-2 text-sm">
              {promise.promise_text}
            </CardDescription>
          </div>
          <Badge className={`${status.className} text-xs sm:text-sm shrink-0`}>
            {status.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
        <div className="flex flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>
              {new Date(promise.promise_date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </span>
          </div>

          {promise.view_count !== undefined && (
            <div className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              <span>{promise.view_count} views</span>
            </div>
          )}

          {promise.verification_count !== undefined && (
            <div className="flex items-center gap-1">
              <FileText className="h-4 w-4" />
              <span>{promise.verification_count} verifications</span>
            </div>
          )}
        </div>

        {promise.category && (
          <div className="mt-3">
            <Badge variant="outline">{promise.category}</Badge>
          </div>
        )}
      </CardContent>

      <CardFooter className="p-4 sm:p-6 pt-0 sm:pt-0">
        <Link href={`/promises/${promise.id}`} className="w-full">
          <Button variant="outline" className="w-full text-sm">
            <ExternalLink className="mr-2 h-4 w-4" />
            View Details
          </Button>
        </Link>
      </CardFooter>
    </Card>
  )
}
