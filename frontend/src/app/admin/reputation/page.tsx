'use client'

import { AdminGuard } from '@/components/admin/AdminGuard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import {
  applyReputationDecay,
  getReputationRules,
  getReputationStats,
  updateReputationRule,
  type ReputationRule
} from '@/lib/reputationEngine'
import { Award, Loader2, RefreshCw, Save, TrendingDown } from 'lucide-react'
import { useEffect, useState } from 'react'

export default function ReputationSettingsPage() {
  const { toast } = useToast()
  const [rules, setRules] = useState<ReputationRule[]>([])
  const [stats, setStats] = useState({
    totalUsers: 0,
    avgReputation: 0,
    highestReputation: 0,
    usersWithDecay: 0
  })
  const [loading, setLoading] = useState(true)
  const [decayLoading, setDecayLoading] = useState(false)
  const [editingRule, setEditingRule] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<{
    points_change: number
    description: string
    enabled: boolean
  }>({ points_change: 0, description: '', enabled: true })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)

    const [rulesResult, statsData] = await Promise.all([
      getReputationRules(),
      getReputationStats()
    ])

    if (rulesResult.error) {
      toast({
        title: 'Error',
        description: 'Failed to load reputation rules',
        variant: 'destructive'
      })
    } else if (rulesResult.data) {
      setRules(rulesResult.data)
    }

    setStats(statsData)
    setLoading(false)
  }

  const handleEdit = (rule: ReputationRule) => {
    setEditingRule(rule.id)
    setEditValues({
      points_change: rule.points_change,
      description: rule.description,
      enabled: rule.enabled
    })
  }

  const handleSave = async (ruleId: string) => {
    const { success, error } = await updateReputationRule(ruleId, editValues)

    if (success) {
      toast({
        title: 'Success',
        description: 'Reputation rule updated successfully'
      })
      setEditingRule(null)
      await loadData()
    } else {
      toast({
        title: 'Error',
        description: error || 'Failed to update reputation rule',
        variant: 'destructive'
      })
    }
  }

  const handleCancel = () => {
    setEditingRule(null)
  }

  const handleApplyDecay = async () => {
    setDecayLoading(true)
    const { success, error } = await applyReputationDecay()

    if (success) {
      toast({
        title: 'Success',
        description: 'Reputation decay applied successfully'
      })
      await loadData()
    } else {
      toast({
        title: 'Error',
        description: error || 'Failed to apply reputation decay',
        variant: 'destructive'
      })
    }

    setDecayLoading(false)
  }

  const getEventTypeLabel = (eventType: string) => {
    const labels: Record<string, string> = {
      verification_submitted: 'Verification Submitted',
      verification_approved: 'Verification Approved',
      verification_rejected: 'Verification Rejected',
      helpful_vote_received: 'Helpful Vote Received',
      unhelpful_vote_received: 'Unhelpful Vote Received',
      fraud_confirmed: 'Fraud Confirmed'
    }
    return labels[eventType] || eventType
  }

  return (
    <AdminGuard minLevel={3}>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Award className="h-8 w-8 text-primary" />
                Reputation Engine Settings
              </h1>
              <p className="text-muted-foreground mt-2">
                Configure automated reputation rules and scoring system
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={loadData}
                variant="outline"
                disabled={loading || decayLoading}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button
                onClick={handleApplyDecay}
                variant="outline"
                disabled={loading || decayLoading}
              >
                {decayLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <TrendingDown className="h-4 w-4 mr-2" />
                )}
                Apply Decay
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Users
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{stats.totalUsers}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Average Reputation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-blue-600">
                  {stats.avgReputation}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Highest Reputation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-600">
                  {stats.highestReputation}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Inactive Users (30+ days)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-orange-600">
                  {stats.usersWithDecay}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Reputation Rules */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Reputation Rules</h2>
          <p className="text-sm text-muted-foreground mb-4">
            These rules automatically adjust user reputation when events occur. Changes are applied immediately.
          </p>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-3">
              {rules.map(rule => (
                <Card key={rule.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="py-4">
                    {editingRule === rule.id ? (
                      // Edit Mode
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold">{getEventTypeLabel(rule.event_type)}</p>
                            <Badge variant="outline" className="mt-1">
                              {rule.rule_name}
                            </Badge>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="points">Points Change</Label>
                            <Input
                              id="points"
                              type="number"
                              value={editValues.points_change}
                              onChange={(e) =>
                                setEditValues({
                                  ...editValues,
                                  points_change: parseInt(e.target.value)
                                })
                              }
                            />
                          </div>

                          <div className="flex items-center gap-2">
                            <Switch
                              checked={editValues.enabled}
                              onCheckedChange={(checked) =>
                                setEditValues({ ...editValues, enabled: checked })
                              }
                            />
                            <Label>Enabled</Label>
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="description">Description</Label>
                          <Textarea
                            id="description"
                            value={editValues.description}
                            onChange={(e) =>
                              setEditValues({ ...editValues, description: e.target.value })
                            }
                            rows={2}
                          />
                        </div>

                        <div className="flex gap-2">
                          <Button onClick={() => handleSave(rule.id)} size="sm">
                            <Save className="h-4 w-4 mr-2" />
                            Save
                          </Button>
                          <Button onClick={handleCancel} variant="outline" size="sm">
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      // View Mode
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <p className="font-semibold">{getEventTypeLabel(rule.event_type)}</p>
                            <Badge variant="outline">{rule.rule_name}</Badge>
                            {!rule.enabled && (
                              <Badge variant="secondary">Disabled</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{rule.description}</p>
                        </div>

                        <div className="flex items-center gap-4">
                          <Badge
                            className={
                              rule.points_change > 0
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }
                          >
                            {rule.points_change > 0 ? '+' : ''}
                            {rule.points_change} points
                          </Badge>
                          <Button
                            onClick={() => handleEdit(rule)}
                            variant="outline"
                            size="sm"
                          >
                            Edit
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Decay Information */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Reputation Decay</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Users lose 1 reputation point for every 30 days of inactivity (max -10 points per decay run).
                This prevents inactive high-reputation accounts from being exploited.
              </p>
              <p className="text-sm text-muted-foreground">
                <strong>Recommendation:</strong> Run decay daily via a scheduled job or manually as needed.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminGuard>
  )
}
