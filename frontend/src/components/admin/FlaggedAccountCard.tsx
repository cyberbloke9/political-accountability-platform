'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  AlertTriangle,
  Shield,
  Clock,
  User,
  CheckCircle,
  XCircle,
  TrendingDown
} from 'lucide-react'
import { format } from 'date-fns'

interface FlaggedAccountCardProps {
  flag: {
    id: string
    user_id: string
    flag_type: 'sybil_voting_pattern' | 'rapid_submission' | 'coordinated_activity' | 'suspicious_voting'
    severity: 'low' | 'medium' | 'high' | 'critical'
    flag_reason: string
    penalty_applied: number
    status: 'active' | 'resolved' | 'dismissed'
    created_at: string
    resolved_at?: string
    resolved_by?: string
    user: {
      id: string
      username: string
      citizen_score: number
      trust_level?: string
    }
  }
  onResolve?: (id: string) => void
  onDismiss?: (id: string) => void
}

const flagTypeConfig = {
  sybil_voting_pattern: {
    label: 'Sybil Voting Pattern',
    description: 'Detected coordinated voting behavior',
    icon: TrendingDown,
  },
  rapid_submission: {
    label: 'Rapid Submission',
    description: 'Suspicious high-frequency submissions',
    icon: Clock,
  },
  coordinated_activity: {
    label: 'Coordinated Activity',
    description: 'Pattern of coordinated actions detected',
    icon: Shield,
  },
  suspicious_voting: {
    label: 'Suspicious Voting',
    description: 'Unusual voting patterns detected',
    icon: AlertTriangle,
  },
}

const severityConfig = {
  low: {
    label: 'Low',
    color: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
    textColor: 'text-yellow-600'
  },
  medium: {
    label: 'Medium',
    color: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
    textColor: 'text-orange-600'
  },
  high: {
    label: 'High',
    color: 'bg-red-500/10 text-red-600 border-red-500/20',
    textColor: 'text-red-600'
  },
  critical: {
    label: 'Critical',
    color: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
    textColor: 'text-purple-600'
  },
}

const statusConfig = {
  active: {
    label: 'Active',
    color: 'bg-red-600 text-white',
    icon: AlertTriangle
  },
  resolved: {
    label: 'Resolved',
    color: 'bg-green-600 text-white',
    icon: CheckCircle
  },
  dismissed: {
    label: 'Dismissed',
    color: 'bg-gray-600 text-white',
    icon: XCircle
  },
}

export function FlaggedAccountCard({
  flag,
  onResolve,
  onDismiss
}: FlaggedAccountCardProps) {
  const flagType = flagTypeConfig[flag.flag_type]
  const severity = severityConfig[flag.severity]
  const status = statusConfig[flag.status]
  const FlagIcon = flagType.icon
  const StatusIcon = status.icon

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {/* Status Badge */}
              <Badge className={status.color + ' text-xs sm:text-sm'}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {status.label}
              </Badge>

              {/* Severity Badge */}
              <Badge className={severity.color + ' border text-xs sm:text-sm'}>
                {severity.label} Severity
              </Badge>

              {/* Flag Type Badge */}
              <Badge variant="outline" className="text-xs sm:text-sm">
                <FlagIcon className="h-3 w-3 mr-1" />
                {flagType.label}
              </Badge>
            </div>

            <CardTitle className="text-base sm:text-lg mb-1">
              Flagged User: {flag.user.username}
            </CardTitle>

            <p className="text-xs sm:text-sm text-muted-foreground">
              {flagType.description}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* User Info */}
        <div className="flex items-center justify-between pt-3 border-t">
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary/10 text-primary">
                <User className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">{flag.user.username}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>Citizen Score: {flag.user.citizen_score}</span>
                {flag.user.trust_level && (
                  <>
                    <span>•</span>
                    <span className="capitalize">{flag.user.trust_level.replace('_', ' ')}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="text-right text-xs text-muted-foreground">
            <Clock className="h-3 w-3 inline mr-1" />
            {format(new Date(flag.created_at), 'MMM d, yyyy')}
          </div>
        </div>

        {/* Flag Reason */}
        <div className="pt-3 border-t">
          <h4 className="text-sm font-semibold mb-2">Reason</h4>
          <p className="text-sm text-muted-foreground">
            {flag.flag_reason}
          </p>
        </div>

        {/* Penalty Info */}
        {flag.penalty_applied > 0 && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
            <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0" />
            <div className="text-sm">
              <span className="font-semibold text-red-600">Penalty Applied:</span>
              <span className="text-red-700 ml-1">-{flag.penalty_applied} points</span>
            </div>
          </div>
        )}

        {/* Resolution Info */}
        {flag.resolved_at && (
          <div className="pt-3 border-t text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              <span>Resolved on {format(new Date(flag.resolved_at), 'MMM d, yyyy')}</span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {flag.status === 'active' && (onResolve || onDismiss) && (
          <div className="flex flex-col sm:flex-row gap-2 pt-4">
            {onResolve && (
              <Button
                onClick={() => onResolve(flag.id)}
                className="flex-1 bg-green-600 hover:bg-green-700 w-full"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Mark Resolved
              </Button>
            )}
            {onDismiss && (
              <Button
                onClick={() => onDismiss(flag.id)}
                variant="outline"
                className="flex-1 w-full"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Dismiss Flag
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
