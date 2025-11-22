'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { FraudFlagWithTarget } from '@/lib/fraudDetection'
import {
  AlertTriangle,
  CheckCircle,
  Shield,
  User,
  FileText,
  XCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { useState } from 'react'

interface FraudFlagCardProps {
  flag: FraudFlagWithTarget
  onConfirm?: (flagId: string, notes?: string) => void
  onDismiss?: (flagId: string, notes?: string) => void
  loading?: boolean
}

const severityConfig = {
  low: { label: 'Low', color: 'bg-blue-100 text-blue-800', icon: Shield },
  medium: { label: 'Medium', color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle },
  high: { label: 'High', color: 'bg-orange-100 text-orange-800', icon: AlertTriangle },
  critical: { label: 'Critical', color: 'bg-red-100 text-red-800', icon: AlertTriangle }
}

const typeConfig = {
  spam: { label: 'Spam', description: 'Rapid or repetitive submissions' },
  vote_manipulation: { label: 'Vote Manipulation', description: 'Suspicious voting patterns' },
  low_quality: { label: 'Low Quality', description: 'Poor evidence or AI-generated content' },
  duplicate: { label: 'Duplicate', description: 'Plagiarized or copied evidence' },
  coordinated_voting: { label: 'Coordinated Voting', description: 'Organized vote brigading' }
}

const statusConfig = {
  pending: { label: 'Pending Review', color: 'bg-gray-100 text-gray-800' },
  reviewed: { label: 'Reviewed', color: 'bg-blue-100 text-blue-800' },
  confirmed: { label: 'Confirmed', color: 'bg-red-100 text-red-800' },
  dismissed: { label: 'Dismissed', color: 'bg-green-100 text-green-800' }
}

export function FraudFlagCard({ flag, onConfirm, onDismiss, loading }: FraudFlagCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [adminNotes, setAdminNotes] = useState('')

  const severity = severityConfig[flag.severity]
  const type = typeConfig[flag.flag_type]
  const status = statusConfig[flag.status]
  const SeverityIcon = severity.icon

  const confidencePercent = Math.round(flag.confidence_score * 100)

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className={severity.color}>
                <SeverityIcon className="h-3 w-3 mr-1" />
                {severity.label}
              </Badge>
              <Badge variant="outline">{type.label}</Badge>
              <Badge className={status.color}>{status.label}</Badge>
              {flag.auto_detected && (
                <Badge variant="secondary" className="text-xs">
                  Auto-detected
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Shield className="h-4 w-4" />
                <span>Confidence: {confidencePercent}%</span>
              </div>
              <div className="flex items-center gap-1">
                {flag.target_type === 'verification' ? (
                  <FileText className="h-4 w-4" />
                ) : (
                  <User className="h-4 w-4" />
                )}
                <span className="capitalize">Target: {flag.target_type}</span>
              </div>
            </div>

            <p className="text-sm text-muted-foreground">{type.description}</p>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="space-y-4 border-t pt-4">
          {/* Target Details */}
          {flag.target_type === 'verification' && flag.verification && (
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Verification Details</h4>
              <div className="bg-muted p-3 rounded-md space-y-2">
                <p className="text-sm">
                  <span className="font-medium">Promise:</span>{' '}
                  {flag.verification.promise.title}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Politician:</span>{' '}
                  {flag.verification.promise.politician.name}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Verdict:</span>{' '}
                  <Badge variant="outline">{flag.verification.verdict}</Badge>
                </p>
                <p className="text-sm">
                  <span className="font-medium">Submitted by:</span>{' '}
                  {flag.verification.submitted_by_user.username} (Score:{' '}
                  {flag.verification.submitted_by_user.citizen_score})
                </p>
                <div className="mt-2">
                  <p className="text-sm font-medium mb-1">Evidence:</p>
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {flag.verification.evidence}
                  </p>
                </div>
              </div>
            </div>
          )}

          {flag.target_type === 'user' && flag.user && (
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">User Details</h4>
              <div className="bg-muted p-3 rounded-md space-y-2">
                <p className="text-sm">
                  <span className="font-medium">Username:</span> {flag.user.username}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Citizen Score:</span>{' '}
                  {flag.user.citizen_score}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Account Created:</span>{' '}
                  {new Date(flag.user.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          )}

          {/* Detection Details */}
          {flag.details && (
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Detection Details</h4>
              <div className="bg-muted p-3 rounded-md">
                <pre className="text-xs overflow-auto">
                  {JSON.stringify(flag.details, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {/* Review Section */}
          {flag.status === 'pending' && (onConfirm || onDismiss) && (
            <div className="space-y-3 pt-4 border-t">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Admin Notes (Optional)
                </label>
                <textarea
                  className="w-full p-2 border rounded-md text-sm"
                  rows={3}
                  placeholder="Add any additional notes about this flag..."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                {onConfirm && (
                  <Button
                    onClick={() => onConfirm(flag.id, adminNotes || undefined)}
                    variant="destructive"
                    className="flex-1"
                    disabled={loading}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Confirm Fraud
                  </Button>
                )}
                {onDismiss && (
                  <Button
                    onClick={() => onDismiss(flag.id, adminNotes || undefined)}
                    variant="outline"
                    className="flex-1"
                    disabled={loading}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Dismiss
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Review Info (if already reviewed) */}
          {flag.status !== 'pending' && flag.reviewed_at && (
            <div className="text-sm text-muted-foreground pt-4 border-t">
              <p>
                Reviewed on {new Date(flag.reviewed_at).toLocaleDateString()} at{' '}
                {new Date(flag.reviewed_at).toLocaleTimeString()}
              </p>
              {flag.details?.admin_notes && (
                <p className="mt-2">
                  <span className="font-medium">Admin Notes:</span>{' '}
                  {flag.details.admin_notes}
                </p>
              )}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}
