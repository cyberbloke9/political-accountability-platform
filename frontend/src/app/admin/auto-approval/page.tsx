'use client'

import { AdminGuard } from '@/components/admin/AdminGuard'
import AdminLayout from '@/components/admin/AdminLayout'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import {
  getAutoApprovalLogs,
  getAutoApprovalRules,
  getAutoApprovalStats,
  updateAutoApprovalRules,
  type AutoApprovalLog,
  type AutoApprovalRules
} from '@/lib/autoApproval'
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Save,
  XCircle
} from 'lucide-react'
import { useEffect, useState } from 'react'

export default function AutoApprovalPage() {
  const { toast } = useToast()
  const [rules, setRules] = useState<AutoApprovalRules | null>(null)
  const [editedRules, setEditedRules] = useState<AutoApprovalRules | null>(null)
  const [logs, setLogs] = useState<AutoApprovalLog[]>([])
  const [stats, setStats] = useState<{
    totalChecked: number
    totalApproved: number
    totalRejected: number
    approvalRate: number
    todayApproved: number
    topUsers: Array<{
      user_id: string
      username: string
      auto_approved_count: number
    }>
  }>({
    totalChecked: 0,
    totalApproved: 0,
    totalRejected: 0,
    approvalRate: 0,
    todayApproved: 0,
    topUsers: []
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    loadData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadData = async () => {
    setLoading(true)

    const [rulesResult, logsResult, statsData] = await Promise.all([
      getAutoApprovalRules(),
      getAutoApprovalLogs({ limit: 10 }),
      getAutoApprovalStats()
    ])

    if (rulesResult.error) {
      toast({
        title: 'Error',
        description: 'Failed to load auto-approval rules',
        variant: 'destructive'
      })
    } else if (rulesResult.data) {
      setRules(rulesResult.data)
      setEditedRules(rulesResult.data)
    }

    if (logsResult.data) {
      setLogs(logsResult.data)
    }

    setStats(statsData)
    setLoading(false)
  }

  const handleFieldChange = (field: keyof AutoApprovalRules, value: string | number | boolean) => {
    if (!editedRules) return

    setEditedRules({
      ...editedRules,
      [field]: value
    })
    setHasChanges(true)
  }

  const handleSave = async () => {
    if (!editedRules) return

    setSaving(true)
    const { success, error } = await updateAutoApprovalRules({
      enabled: editedRules.enabled,
      min_citizen_score: editedRules.min_citizen_score,
      min_evidence_length: editedRules.min_evidence_length,
      require_source_url: editedRules.require_source_url,
      min_account_age_days: editedRules.min_account_age_days,
      min_approved_verifications: editedRules.min_approved_verifications,
      max_recent_rejections: editedRules.max_recent_rejections,
      rejection_lookback_days: editedRules.rejection_lookback_days,
      description: editedRules.description
    })

    if (success) {
      toast({
        title: 'Success',
        description: 'Auto-approval rules updated successfully'
      })
      setRules(editedRules)
      setHasChanges(false)
      await loadData()
    } else {
      toast({
        title: 'Error',
        description: error || 'Failed to update auto-approval rules',
        variant: 'destructive'
      })
    }

    setSaving(false)
  }

  const handleCancel = () => {
    if (rules) {
      setEditedRules(rules)
      setHasChanges(false)
    }
  }

  return (
    <AdminGuard minLevel={3}>
      <AdminLayout title="Auto-Approval Settings" breadcrumbs={[{ label: 'Auto-Approval' }]}>
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-muted-foreground mt-2">
                HARSH rules - only top-tier contributors qualify
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={loadData}
                variant="outline"
                disabled={loading || saving}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              {hasChanges && (
                <>
                  <Button onClick={handleCancel} variant="outline" disabled={saving}>
                    Cancel
                  </Button>
                  <Button onClick={handleSave} disabled={saving}>
                    {saving ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Save Changes
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Auto-Approved Today
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-600">
                  {stats.todayApproved}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Auto-Approved
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{stats.totalApproved}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Approval Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-blue-600">
                  {stats.approvalRate}%
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Manual Reviews
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-orange-600">
                  {stats.totalRejected}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-8">
            {/* Global Enable/Disable */}
            <Card>
              <CardHeader>
                <CardTitle>Auto-Approval Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold mb-1">
                      {editedRules?.enabled ? (
                        <span className="text-green-600">ENABLED</span>
                      ) : (
                        <span className="text-red-600">DISABLED</span>
                      )}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {editedRules?.enabled
                        ? 'Verifications meeting ALL criteria will be auto-approved immediately'
                        : 'All verifications require manual admin review'}
                    </p>
                  </div>
                  <Switch
                    checked={editedRules?.enabled || false}
                    onCheckedChange={(checked) => handleFieldChange('enabled', checked)}
                  />
                </div>
                {editedRules?.enabled && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-yellow-800">
                          Warning: Changes affect new submissions immediately
                        </p>
                        <p className="text-sm text-yellow-700 mt-1">
                          Only users meeting ALL harsh criteria will be auto-approved
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Threshold Configuration */}
            <Card>
              <CardHeader>
                <CardTitle>Qualification Criteria (HARSH)</CardTitle>
                <p className="text-sm text-muted-foreground">
                  ALL criteria must be met for auto-approval
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="min_citizen_score">
                      Minimum Citizen Score (HARSH: 250+)
                    </Label>
                    <Input
                      id="min_citizen_score"
                      type="number"
                      value={editedRules?.min_citizen_score || 250}
                      onChange={(e) =>
                        handleFieldChange('min_citizen_score', parseInt(e.target.value))
                      }
                      min={0}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Top-tier contributors only (~20-25 approved verifications)
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="min_evidence_length">
                      Minimum Evidence Length (chars)
                    </Label>
                    <Input
                      id="min_evidence_length"
                      type="number"
                      value={editedRules?.min_evidence_length || 250}
                      onChange={(e) =>
                        handleFieldChange('min_evidence_length', parseInt(e.target.value))
                      }
                      min={0}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Detailed, quality evidence required
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="min_account_age_days">
                      Minimum Account Age (days)
                    </Label>
                    <Input
                      id="min_account_age_days"
                      type="number"
                      value={editedRules?.min_account_age_days || 60}
                      onChange={(e) =>
                        handleFieldChange('min_account_age_days', parseInt(e.target.value))
                      }
                      min={0}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      HARSH: 60 days minimum (2 months)
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="min_approved_verifications">
                      Minimum Approved Verifications
                    </Label>
                    <Input
                      id="min_approved_verifications"
                      type="number"
                      value={editedRules?.min_approved_verifications || 10}
                      onChange={(e) =>
                        handleFieldChange(
                          'min_approved_verifications',
                          parseInt(e.target.value)
                        )
                      }
                      min={0}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      HARSH: 10+ approved verifications (proven track record)
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="max_recent_rejections">
                      Maximum Recent Rejections
                    </Label>
                    <Input
                      id="max_recent_rejections"
                      type="number"
                      value={editedRules?.max_recent_rejections ?? 0}
                      onChange={(e) =>
                        handleFieldChange('max_recent_rejections', parseInt(e.target.value))
                      }
                      min={0}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      HARSH: Zero rejections allowed (perfect quality only)
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="rejection_lookback_days">
                      Rejection Lookback Period (days)
                    </Label>
                    <Input
                      id="rejection_lookback_days"
                      type="number"
                      value={editedRules?.rejection_lookback_days || 30}
                      onChange={(e) =>
                        handleFieldChange('rejection_lookback_days', parseInt(e.target.value))
                      }
                      min={1}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Check rejections in last X days
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    checked={editedRules?.require_source_url || false}
                    onCheckedChange={(checked) =>
                      handleFieldChange('require_source_url', checked)
                    }
                  />
                  <Label>Require Source URLs (HARSH: Mandatory)</Label>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={editedRules?.description || ''}
                    onChange={(e) => handleFieldChange('description', e.target.value)}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Recent Auto-Approval Decisions */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Decisions</CardTitle>
              </CardHeader>
              <CardContent>
                {logs.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No auto-approval decisions yet
                  </p>
                ) : (
                  <div className="space-y-3">
                    {logs.map(log => (
                      <div
                        key={log.id}
                        className="flex items-center justify-between p-3 border rounded-md"
                      >
                        <div className="flex items-center gap-3">
                          {log.auto_approved ? (
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                          ) : (
                            <XCircle className="h-5 w-5 text-orange-600" />
                          )}
                          <div>
                            <p className="text-sm font-medium">{log.reason}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(log.created_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <Badge
                          variant={log.auto_approved ? 'default' : 'secondary'}
                        >
                          {log.auto_approved ? 'Auto-Approved' : 'Manual Review'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </AdminLayout>
    </AdminGuard>
  )
}
