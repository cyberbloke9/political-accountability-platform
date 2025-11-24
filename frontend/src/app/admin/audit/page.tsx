'use client'

import { useEffect, useState } from 'react'
import { AdminGuard } from '@/components/admin/AdminGuard'
import AdminLayout from '@/components/admin/AdminLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  getAdminActions,
  getAdminActionStats,
  getActionTypeDisplay,
  getActionTypeColor,
  getTargetTypeDisplay,
  type AdminAction
} from '@/lib/adminActions'
import {
  Shield,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Download,
  RefreshCw,
  Calendar,
  User,
  FileText,
  TrendingUp,
  Search
} from 'lucide-react'
import Link from 'next/link'

export default function AdminAuditPage() {
  const [actions, setActions] = useState<AdminAction[]>([])
  const [stats, setStats] = useState({
    totalActions: 0,
    todayActions: 0,
    approvedToday: 0,
    rejectedToday: 0,
    fraudFlagsToday: 0,
    topAdmins: [] as Array<{
      admin_id: string
      username: string
      action_count: number
    }>,
    actionsByType: {} as Record<string, number>
  })
  const [loading, setLoading] = useState(true)
  const [totalCount, setTotalCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [filters, setFilters] = useState({
    action_type: '',
    target_type: '',
    search: '',
    start_date: '',
    end_date: ''
  })

  const pageSize = 50

  useEffect(() => {
    loadData()
  }, [currentPage, filters])

  const loadData = async () => {
    setLoading(true)

    const [actionsResult, statsData] = await Promise.all([
      getAdminActions({
        ...filters,
        action_type: filters.action_type || undefined,
        target_type: filters.target_type || undefined,
        search: filters.search || undefined,
        start_date: filters.start_date || undefined,
        end_date: filters.end_date || undefined,
        limit: pageSize,
        offset: (currentPage - 1) * pageSize
      }),
      getAdminActionStats()
    ])

    if (actionsResult.data) {
      setActions(actionsResult.data)
      setTotalCount(actionsResult.count)
    }

    setStats(statsData)
    setLoading(false)
  }

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }))
    setCurrentPage(1) // Reset to first page when filtering
  }

  const clearFilters = () => {
    setFilters({
      action_type: '',
      target_type: '',
      search: '',
      start_date: '',
      end_date: ''
    })
    setCurrentPage(1)
  }

  const exportToCSV = () => {
    const headers = [
      'Timestamp',
      'Action Type',
      'Admin',
      'Target Type',
      'Target ID',
      'Reason',
      'Metadata'
    ]

    const rows = actions.map(action => [
      new Date(action.created_at).toISOString(),
      action.action_type,
      action.admin?.username || 'System',
      action.target_type,
      action.target_id,
      action.reason || '',
      JSON.stringify(action.metadata || {})
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `admin-audit-${new Date().toISOString()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportToJSON = () => {
    const jsonContent = JSON.stringify(actions, null, 2)
    const blob = new Blob([jsonContent], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `admin-audit-${new Date().toISOString()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const totalPages = Math.ceil(totalCount / pageSize)

  return (
    <AdminGuard minLevel={1}>
      <AdminLayout title="Admin Audit Log" breadcrumbs={[{ label: 'Audit Log' }]}>
        <div className="space-y-8">
          {/* Header */}
          <div>
            <div className="flex flex-col gap-4 mb-4">
              <div>
                <p className="text-sm sm:text-base text-muted-foreground mt-2">
                  Complete audit trail of all moderation actions
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button onClick={loadData} variant="outline" disabled={loading} className="w-full sm:w-auto">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
                <Button onClick={exportToCSV} variant="outline" disabled={loading} className="w-full sm:w-auto">
                  <Download className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Export CSV</span>
                  <span className="sm:hidden">CSV</span>
                </Button>
                <Button onClick={exportToJSON} variant="outline" disabled={loading} className="w-full sm:w-auto">
                  <Download className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Export JSON</span>
                  <span className="sm:hidden">JSON</span>
                </Button>
              </div>
            </div>

            {/* Stats Dashboard */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Actions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-gray-600" />
                    <p className="text-2xl font-bold">{stats.totalActions}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Actions Today
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                    <p className="text-2xl font-bold">{stats.todayActions}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Approved Today
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <p className="text-2xl font-bold text-green-600">
                      {stats.approvedToday}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Rejected Today
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <XCircle className="h-5 w-5 text-red-600" />
                    <p className="text-2xl font-bold text-red-600">
                      {stats.rejectedToday}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Fraud Flags Today
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                    <p className="text-2xl font-bold text-orange-600">
                      {stats.fraudFlagsToday}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Advanced Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Advanced Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="action_type">Action Type</Label>
                    <Select
                      value={filters.action_type}
                      onValueChange={value => handleFilterChange('action_type', value)}
                    >
                      <SelectTrigger id="action_type">
                        <SelectValue placeholder="All actions" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="approve_verification">
                          Approve Verification
                        </SelectItem>
                        <SelectItem value="reject_verification">
                          Reject Verification
                        </SelectItem>
                        <SelectItem value="flag_fraud">Flag Fraud</SelectItem>
                        <SelectItem value="update_reputation">
                          Update Reputation
                        </SelectItem>
                        <SelectItem value="ban_user">Ban User</SelectItem>
                        <SelectItem value="unban_user">Unban User</SelectItem>
                        <SelectItem value="auto_approve">Auto-Approve</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="target_type">Target Type</Label>
                    <Select
                      value={filters.target_type}
                      onValueChange={value => handleFilterChange('target_type', value)}
                    >
                      <SelectTrigger id="target_type">
                        <SelectValue placeholder="All targets" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="verification">Verification</SelectItem>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="politician">Politician</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="search">Search</Label>
                    <Input
                      id="search"
                      type="text"
                      placeholder="Search reason or action..."
                      value={filters.search}
                      onChange={e => handleFilterChange('search', e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="start_date">Start Date</Label>
                    <Input
                      id="start_date"
                      type="date"
                      value={filters.start_date}
                      onChange={e => handleFilterChange('start_date', e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="end_date">End Date</Label>
                    <Input
                      id="end_date"
                      type="date"
                      value={filters.end_date}
                      onChange={e => handleFilterChange('end_date', e.target.value)}
                    />
                  </div>

                  <div className="flex items-end sm:col-span-2 lg:col-span-1">
                    <Button onClick={clearFilters} variant="outline" className="w-full">
                      Clear Filters
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Admin Actions Timeline
                </span>
                <Badge variant="outline">
                  {totalCount} total action{totalCount !== 1 ? 's' : ''}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-12">
                  <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : actions.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No actions found matching your filters
                </p>
              ) : (
                <div className="space-y-3">
                  {actions.map(action => (
                    <div
                      key={action.id}
                      className="flex items-start justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-3 flex-wrap">
                          <Badge className={getActionTypeColor(action.action_type)}>
                            {getActionTypeDisplay(action.action_type)}
                          </Badge>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <User className="h-3 w-3" />
                            <span className="font-medium">
                              {action.admin?.username || 'System'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {new Date(action.created_at).toLocaleString()}
                          </div>
                        </div>

                        {action.reason && (
                          <p className="text-sm text-muted-foreground">
                            <strong>Reason:</strong> {action.reason}
                          </p>
                        )}

                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>
                            Target: {getTargetTypeDisplay(action.target_type)}
                          </span>
                          <span className="text-xs font-mono">{action.target_id}</span>
                          {action.target_type === 'verification' && (
                            <Link
                              href={`/verifications/${action.target_id}`}
                              className="text-primary hover:underline"
                            >
                              View verification
                            </Link>
                          )}
                          {action.target_type === 'user' && (
                            <Link
                              href={`/profile/${action.target_id}`}
                              className="text-primary hover:underline"
                            >
                              View profile
                            </Link>
                          )}
                        </div>

                        {action.metadata && Object.keys(action.metadata).length > 0 && (
                          <details className="text-xs">
                            <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                              View metadata ({Object.keys(action.metadata).length} field
                              {Object.keys(action.metadata).length !== 1 ? 's' : ''})
                            </summary>
                            <pre className="mt-2 p-3 bg-muted rounded text-xs overflow-x-auto">
                              {JSON.stringify(action.metadata, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1 || loading}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages || loading}
                  >
                    Next
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Type Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Action Type Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(stats.actionsByType)
                  .sort(([, a], [, b]) => b - a)
                  .map(([actionType, count]) => (
                    <div
                      key={actionType}
                      className="flex items-center justify-between p-3 border rounded-md"
                    >
                      <div className="flex items-center gap-3">
                        <Badge className={getActionTypeColor(actionType)}>
                          {getActionTypeDisplay(actionType)}
                        </Badge>
                      </div>
                      <span className="text-sm font-bold">{count} actions</span>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>

          {/* Top Admins */}
          {stats.topAdmins.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Most Active Moderators
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.topAdmins.map((admin, index) => (
                    <div
                      key={admin.admin_id}
                      className="flex items-center justify-between p-3 border rounded-md"
                    >
                      <div className="flex items-center gap-3">
                        <Badge
                          variant="outline"
                          className="w-8 h-8 flex items-center justify-center"
                        >
                          #{index + 1}
                        </Badge>
                        <div>
                          <p className="font-medium">{admin.username}</p>
                          <p className="text-sm text-muted-foreground">
                            {admin.action_count} action{admin.action_count !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </AdminLayout>
    </AdminGuard>
  )
}
