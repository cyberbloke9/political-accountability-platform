'use client'

import { AdminGuard } from '@/components/admin/AdminGuard'
import { FraudFlagCard } from '@/components/admin/FraudFlagCard'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import {
  getFraudFlags,
  reviewFraudFlag,
  runFraudDetection,
  type FraudFlagWithTarget
} from '@/lib/fraudDetection'
import { AlertCircle, Loader2, Play, RefreshCw, Shield } from 'lucide-react'
import { useEffect, useState } from 'react'

export default function FraudDetectionPage() {
  const { toast } = useToast()
  const [flags, setFlags] = useState<FraudFlagWithTarget[]>([])
  const [filteredFlags, setFilteredFlags] = useState<FraudFlagWithTarget[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [detectLoading, setDetectLoading] = useState(false)

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [severityFilter, setSeverityFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    confirmed: 0,
    dismissed: 0,
    critical: 0
  })

  useEffect(() => {
    loadFlags()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [flags, statusFilter, severityFilter, typeFilter])

  const loadFlags = async () => {
    setLoading(true)
    const { data, error } = await getFraudFlags()

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to load fraud flags',
        variant: 'destructive'
      })
    } else if (data) {
      setFlags(data)
      calculateStats(data)
    }

    setLoading(false)
  }

  const calculateStats = (flagData: FraudFlagWithTarget[]) => {
    setStats({
      total: flagData.length,
      pending: flagData.filter(f => f.status === 'pending').length,
      confirmed: flagData.filter(f => f.status === 'confirmed').length,
      dismissed: flagData.filter(f => f.status === 'dismissed').length,
      critical: flagData.filter(f => f.severity === 'critical').length
    })
  }

  const applyFilters = () => {
    let filtered = [...flags]

    if (statusFilter !== 'all') {
      filtered = filtered.filter(f => f.status === statusFilter)
    }

    if (severityFilter !== 'all') {
      filtered = filtered.filter(f => f.severity === severityFilter)
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(f => f.flag_type === typeFilter)
    }

    setFilteredFlags(filtered)
  }

  const handleRunDetection = async () => {
    setDetectLoading(true)
    const { success, error } = await runFraudDetection()

    if (success) {
      toast({
        title: 'Success',
        description: 'Fraud detection completed successfully'
      })
      await loadFlags()
    } else {
      toast({
        title: 'Error',
        description: error || 'Failed to run fraud detection',
        variant: 'destructive'
      })
    }

    setDetectLoading(false)
  }

  const handleConfirm = async (flagId: string, notes?: string) => {
    setActionLoading(true)
    const { success, error } = await reviewFraudFlag(flagId, 'confirmed', notes)

    if (success) {
      toast({
        title: 'Flag Confirmed',
        description: 'Fraud flag has been confirmed and actions taken'
      })
      await loadFlags()
    } else {
      toast({
        title: 'Error',
        description: error || 'Failed to confirm flag',
        variant: 'destructive'
      })
    }

    setActionLoading(false)
  }

  const handleDismiss = async (flagId: string, notes?: string) => {
    setActionLoading(true)
    const { success, error } = await reviewFraudFlag(flagId, 'dismissed', notes)

    if (success) {
      toast({
        title: 'Flag Dismissed',
        description: 'Fraud flag has been dismissed'
      })
      await loadFlags()
    } else {
      toast({
        title: 'Error',
        description: error || 'Failed to dismiss flag',
        variant: 'destructive'
      })
    }

    setActionLoading(false)
  }

  return (
    <AdminGuard requiredPermission="manage_fraud">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Shield className="h-8 w-8 text-primary" />
                Fraud Detection
              </h1>
              <p className="text-muted-foreground mt-2">
                Review and manage fraud detection flags
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={loadFlags}
                variant="outline"
                disabled={loading || detectLoading}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button
                onClick={handleRunDetection}
                disabled={loading || detectLoading}
              >
                {detectLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Play className="h-4 w-4 mr-2" />
                )}
                Run Detection
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Flags
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{stats.total}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Pending Review
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-yellow-600">
                  {stats.pending}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Confirmed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-red-600">
                  {stats.confirmed}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Dismissed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-600">
                  {stats.dismissed}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Critical
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-red-600 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  {stats.critical}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 flex gap-4 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <label className="text-sm font-medium mb-2 block">Status</label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="reviewed">Reviewed</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="dismissed">Dismissed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="text-sm font-medium mb-2 block">Severity</label>
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severity</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="text-sm font-medium mb-2 block">Type</label>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="spam">Spam</SelectItem>
                <SelectItem value="vote_manipulation">
                  Vote Manipulation
                </SelectItem>
                <SelectItem value="low_quality">Low Quality</SelectItem>
                <SelectItem value="duplicate">Duplicate</SelectItem>
                <SelectItem value="coordinated_voting">
                  Coordinated Voting
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Flags List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredFlags.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No fraud flags found matching your filters.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredFlags.map(flag => (
              <FraudFlagCard
                key={flag.id}
                flag={flag}
                onConfirm={handleConfirm}
                onDismiss={handleDismiss}
                loading={actionLoading}
              />
            ))}
          </div>
        )}
      </div>
    </AdminGuard>
  )
}
