'use client'

import { useEffect, useState } from 'react'
import { AdminGuard } from '@/components/admin/AdminGuard'
import AdminLayout from '@/components/admin/AdminLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/useAuth'
import {
  getBans,
  getBanStats,
  getBanAppeals,
  banUser,
  unbanUser,
  reviewBanAppeal,
  getBanDurationDisplay,
  getBanTypeColor,
  getBanStatusColor,
  getAppealStatusColor,
  type Ban,
  type BanAppeal
} from '@/lib/banManagement'
import {
  Ban as BanIcon,
  UserX,
  UserCheck,
  Clock,
  AlertTriangle,
  RefreshCw,
  Calendar,
  User,
  CheckCircle,
  XCircle,
  MessageSquare
} from 'lucide-react'
import Link from 'next/link'

export default function BansManagementPage() {
  const { toast } = useToast()
  const { user } = useAuth()
  const [bans, setBans] = useState<Ban[]>([])
  const [appeals, setAppeals] = useState<BanAppeal[]>([])
  const [stats, setStats] = useState({
    totalBans: 0,
    activeBans: 0,
    temporaryBans: 0,
    permanentBans: 0,
    expiredBans: 0,
    pendingAppeals: 0,
    approvedAppeals: 0,
    rejectedAppeals: 0
  })
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'active' | 'expired'>('active')
  const [banTypeFilter, setBanTypeFilter] = useState<'all' | 'temporary' | 'permanent'>('all')

  // Ban dialog state
  const [banDialogOpen, setBanDialogOpen] = useState(false)
  const [banUserId, setBanUserId] = useState('')
  const [banReason, setBanReason] = useState('')
  const [banType, setBanType] = useState<'temporary' | 'permanent'>('temporary')
  const [banDuration, setBanDuration] = useState('7')
  const [banning, setBanning] = useState(false)

  // Unban dialog state
  const [unbanDialogOpen, setUnbanDialogOpen] = useState(false)
  const [unbanUserId, setUnbanUserId] = useState('')
  const [unbanReason, setUnbanReason] = useState('')
  const [unbanning, setUnbanning] = useState(false)

  // Appeal review dialog state
  const [appealReviewDialogOpen, setAppealReviewDialogOpen] = useState(false)
  const [selectedAppeal, setSelectedAppeal] = useState<BanAppeal | null>(null)
  const [appealReviewStatus, setAppealReviewStatus] = useState<'approved' | 'rejected'>('approved')
  const [appealReviewReason, setAppealReviewReason] = useState('')
  const [reviewing, setReviewing] = useState(false)

  useEffect(() => {
    loadData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, banTypeFilter])

  const loadData = async () => {
    setLoading(true)

    const [bansResult, appealsResult, statsData] = await Promise.all([
      getBans({
        is_active: filter === 'all' ? undefined : filter === 'active',
        ban_type: banTypeFilter === 'all' ? undefined : banTypeFilter
      }),
      getBanAppeals({ status: 'pending' }),
      getBanStats()
    ])

    if (bansResult.data) {
      setBans(bansResult.data)
    }

    if (appealsResult.data) {
      setAppeals(appealsResult.data)
    }

    setStats(statsData)
    setLoading(false)
  }

  const handleBanUser = async () => {
    if (!user?.id) return
    if (!banUserId || !banReason) {
      toast({
        title: 'Error',
        description: 'Please provide user ID and reason',
        variant: 'destructive'
      })
      return
    }

    if (banType === 'temporary' && !banDuration) {
      toast({
        title: 'Error',
        description: 'Please provide ban duration',
        variant: 'destructive'
      })
      return
    }

    setBanning(true)

    const { success, error } = await banUser({
      userId: banUserId,
      adminId: user.id,
      reason: banReason,
      banType,
      durationDays: banType === 'temporary' ? parseInt(banDuration) : undefined
    })

    if (success) {
      toast({
        title: 'Success',
        description: `User banned successfully (${banType})`
      })
      setBanDialogOpen(false)
      setBanUserId('')
      setBanReason('')
      setBanType('temporary')
      setBanDuration('7')
      await loadData()
    } else {
      toast({
        title: 'Error',
        description: error || 'Failed to ban user',
        variant: 'destructive'
      })
    }

    setBanning(false)
  }

  const handleUnbanUser = async () => {
    if (!user?.id) return
    if (!unbanUserId || !unbanReason) {
      toast({
        title: 'Error',
        description: 'Please provide user ID and reason',
        variant: 'destructive'
      })
      return
    }

    setUnbanning(true)

    const { success, error } = await unbanUser({
      userId: unbanUserId,
      adminId: user.id,
      reason: unbanReason
    })

    if (success) {
      toast({
        title: 'Success',
        description: 'User unbanned successfully'
      })
      setUnbanDialogOpen(false)
      setUnbanUserId('')
      setUnbanReason('')
      await loadData()
    } else {
      toast({
        title: 'Error',
        description: error || 'Failed to unban user',
        variant: 'destructive'
      })
    }

    setUnbanning(false)
  }

  const handleReviewAppeal = async () => {
    if (!user?.id || !selectedAppeal) return
    if (!appealReviewReason) {
      toast({
        title: 'Error',
        description: 'Please provide a review reason',
        variant: 'destructive'
      })
      return
    }

    setReviewing(true)

    const { success, error } = await reviewBanAppeal({
      appealId: selectedAppeal.id,
      adminId: user.id,
      status: appealReviewStatus,
      reviewReason: appealReviewReason
    })

    if (success) {
      // If approved, also unban the user
      if (appealReviewStatus === 'approved') {
        await unbanUser({
          userId: selectedAppeal.user_id,
          adminId: user.id,
          reason: `Appeal approved: ${appealReviewReason}`
        })
      }

      toast({
        title: 'Success',
        description: `Appeal ${appealReviewStatus} successfully`
      })
      setAppealReviewDialogOpen(false)
      setSelectedAppeal(null)
      setAppealReviewReason('')
      await loadData()
    } else {
      toast({
        title: 'Error',
        description: error || 'Failed to review appeal',
        variant: 'destructive'
      })
    }

    setReviewing(false)
  }

  return (
    <AdminGuard minLevel={2}>
      <AdminLayout title="Ban Management" breadcrumbs={[{ label: 'Bans' }]}>
        <div className="space-y-8">
          {/* Header */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-muted-foreground mt-2">
                  Manage user bans and review appeals
                </p>
              </div>
              <div className="flex gap-2">
                <Button onClick={loadData} variant="outline" disabled={loading}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
                <Button onClick={() => setBanDialogOpen(true)}>
                  <UserX className="h-4 w-4 mr-2" />
                  Ban User
                </Button>
                <Button onClick={() => setUnbanDialogOpen(true)} variant="outline">
                  <UserCheck className="h-4 w-4 mr-2" />
                  Unban User
                </Button>
              </div>
            </div>

            {/* Stats Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Active Bans
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <BanIcon className="h-5 w-5 text-red-600" />
                    <p className="text-2xl font-bold text-red-600">{stats.activeBans}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Bans
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <UserX className="h-5 w-5 text-gray-600" />
                    <p className="text-2xl font-bold">{stats.totalBans}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Pending Appeals
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-yellow-600" />
                    <p className="text-2xl font-bold text-yellow-600">
                      {stats.pendingAppeals}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Expired Bans
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-gray-600" />
                    <p className="text-2xl font-bold">{stats.expiredBans}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Pending Appeals */}
          {appeals.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  Pending Ban Appeals ({appeals.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {appeals.map(appeal => (
                    <div
                      key={appeal.id}
                      className="flex items-start justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-3 flex-wrap">
                          <div className="flex items-center gap-1 text-sm font-medium">
                            <User className="h-3 w-3" />
                            {appeal.user?.username}
                          </div>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {new Date(appeal.created_at).toLocaleString()}
                          </div>
                          <Badge className={getAppealStatusColor(appeal.status)}>
                            {appeal.status}
                          </Badge>
                        </div>

                        <p className="text-sm">
                          <strong>Appeal Reason:</strong> {appeal.appeal_reason}
                        </p>

                        {appeal.ban && (
                          <p className="text-sm text-muted-foreground">
                            <strong>Original Ban Reason:</strong> {appeal.ban.reason}
                          </p>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedAppeal(appeal)
                            setAppealReviewStatus('approved')
                            setAppealReviewDialogOpen(true)
                          }}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedAppeal(appeal)
                            setAppealReviewStatus('rejected')
                            setAppealReviewDialogOpen(true)
                          }}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Filter Bans</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Status</Label>
                  <Select value={filter} onValueChange={(value: 'all' | 'active' | 'expired') => setFilter(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Bans</SelectItem>
                      <SelectItem value="active">Active Bans</SelectItem>
                      <SelectItem value="expired">Expired Bans</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Ban Type</Label>
                  <Select
                    value={banTypeFilter}
                    onValueChange={(value: 'all' | 'temporary' | 'permanent') => setBanTypeFilter(value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="temporary">Temporary</SelectItem>
                      <SelectItem value="permanent">Permanent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bans List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BanIcon className="h-5 w-5" />
                Bans ({bans.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-12">
                  <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : bans.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No bans found</p>
              ) : (
                <div className="space-y-3">
                  {bans.map(ban => (
                    <div
                      key={ban.id}
                      className="flex items-start justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-3 flex-wrap">
                          <Badge className={getBanStatusColor(ban.is_active)}>
                            {ban.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                          <Badge className={getBanTypeColor(ban.ban_type)}>
                            {ban.ban_type === 'permanent' ? 'Permanent' : getBanDurationDisplay(ban)}
                          </Badge>
                          <div className="flex items-center gap-1 text-sm font-medium">
                            <User className="h-3 w-3" />
                            <Link
                              href={`/profile/${ban.user?.username}`}
                              className="hover:underline"
                            >
                              {ban.user?.username}
                            </Link>
                          </div>
                        </div>

                        <p className="text-sm">
                          <strong>Reason:</strong> {ban.reason}
                        </p>

                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>
                            <strong>Banned by:</strong> {ban.banner?.username}
                          </span>
                          <span>
                            <strong>Banned at:</strong>{' '}
                            {new Date(ban.banned_at).toLocaleString()}
                          </span>
                          {ban.unbanned_at && (
                            <span>
                              <strong>Unbanned at:</strong>{' '}
                              {new Date(ban.unbanned_at).toLocaleString()}
                            </span>
                          )}
                        </div>

                        {ban.unban_reason && (
                          <p className="text-sm text-muted-foreground">
                            <strong>Unban Reason:</strong> {ban.unban_reason}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

      {/* Ban User Dialog */}
      <Dialog open={banDialogOpen} onOpenChange={setBanDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ban User</DialogTitle>
            <DialogDescription>
              Issue a temporary or permanent ban to a user
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="banUserId">User ID</Label>
              <Input
                id="banUserId"
                value={banUserId}
                onChange={e => setBanUserId(e.target.value)}
                placeholder="Enter user ID"
              />
            </div>

            <div>
              <Label htmlFor="banType">Ban Type</Label>
              <Select value={banType} onValueChange={(value: 'temporary' | 'permanent') => setBanType(value)}>
                <SelectTrigger id="banType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="temporary">Temporary</SelectItem>
                  <SelectItem value="permanent">Permanent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {banType === 'temporary' && (
              <div>
                <Label htmlFor="banDuration">Duration (days)</Label>
                <Input
                  id="banDuration"
                  type="number"
                  value={banDuration}
                  onChange={e => setBanDuration(e.target.value)}
                  min="1"
                />
              </div>
            )}

            <div>
              <Label htmlFor="banReason">Reason</Label>
              <Textarea
                id="banReason"
                value={banReason}
                onChange={e => setBanReason(e.target.value)}
                placeholder="Explain why this user is being banned..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setBanDialogOpen(false)}
              disabled={banning}
            >
              Cancel
            </Button>
            <Button onClick={handleBanUser} disabled={banning}>
              {banning ? 'Banning...' : 'Ban User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unban User Dialog */}
      <Dialog open={unbanDialogOpen} onOpenChange={setUnbanDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unban User</DialogTitle>
            <DialogDescription>Remove an active ban from a user</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="unbanUserId">User ID</Label>
              <Input
                id="unbanUserId"
                value={unbanUserId}
                onChange={e => setUnbanUserId(e.target.value)}
                placeholder="Enter user ID"
              />
            </div>

            <div>
              <Label htmlFor="unbanReason">Reason</Label>
              <Textarea
                id="unbanReason"
                value={unbanReason}
                onChange={e => setUnbanReason(e.target.value)}
                placeholder="Explain why this ban is being lifted..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setUnbanDialogOpen(false)}
              disabled={unbanning}
            >
              Cancel
            </Button>
            <Button onClick={handleUnbanUser} disabled={unbanning}>
              {unbanning ? 'Unbanning...' : 'Unban User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Appeal Review Dialog */}
      <Dialog open={appealReviewDialogOpen} onOpenChange={setAppealReviewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {appealReviewStatus === 'approved' ? 'Approve' : 'Reject'} Appeal
            </DialogTitle>
            <DialogDescription>
              {selectedAppeal && (
                <span>
                  Reviewing appeal from {selectedAppeal.user?.username}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          {selectedAppeal && (
            <div className="space-y-4">
              <div className="p-3 bg-muted rounded-md">
                <p className="text-sm">
                  <strong>Appeal Reason:</strong> {selectedAppeal.appeal_reason}
                </p>
              </div>

              <div>
                <Label htmlFor="appealReviewReason">Review Reason</Label>
                <Textarea
                  id="appealReviewReason"
                  value={appealReviewReason}
                  onChange={e => setAppealReviewReason(e.target.value)}
                  placeholder={`Explain why you are ${appealReviewStatus === 'approved' ? 'approving' : 'rejecting'} this appeal...`}
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAppealReviewDialogOpen(false)}
              disabled={reviewing}
            >
              Cancel
            </Button>
            <Button onClick={handleReviewAppeal} disabled={reviewing}>
              {reviewing
                ? `${appealReviewStatus === 'approved' ? 'Approving' : 'Rejecting'}...`
                : appealReviewStatus === 'approved'
                  ? 'Approve Appeal'
                  : 'Reject Appeal'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </AdminLayout>
    </AdminGuard>
  )
}
