'use client'

import { useEffect, useState } from 'react'
import { AdminGuard } from '@/components/admin/AdminGuard'
import AdminLayout from '@/components/admin/AdminLayout'
import { FlaggedAccountCard } from '@/components/admin/FlaggedAccountCard'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'
import { AlertTriangle, Loader2, Shield } from 'lucide-react'

type StatusFilter = 'active' | 'resolved' | 'dismissed' | 'all'
type SeverityFilter = 'critical' | 'high' | 'medium' | 'low' | 'all'
type SortBy = 'newest' | 'oldest' | 'severity' | 'penalty'

export default function FlagsPage() {
  const [flags, setFlags] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const { toast } = useToast()
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active')
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('all')
  const [sortBy, setSortBy] = useState<SortBy>('newest')
  const [totalCount, setTotalCount] = useState(0)

  useEffect(() => {
    fetchFlags()
  }, [statusFilter, severityFilter, sortBy])

  const fetchFlags = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('user_activity_flags')
        .select(`
          id,
          user_id,
          flag_type,
          severity,
          flag_reason,
          penalty_applied,
          status,
          created_at,
          resolved_at,
          resolved_by,
          user:users!user_id (
            id,
            username,
            citizen_score,
            trust_level
          )
        `, { count: 'exact' })

      // Filter by status
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter)
      }

      // Filter by severity
      if (severityFilter !== 'all') {
        query = query.eq('severity', severityFilter)
      }

      // Sort
      switch (sortBy) {
        case 'oldest':
          query = query.order('created_at', { ascending: true })
          break
        case 'severity':
          // Order by severity: critical > high > medium > low
          query = query.order('severity', { ascending: false })
          break
        case 'penalty':
          query = query.order('penalty_applied', { ascending: false })
          break
        case 'newest':
        default:
          query = query.order('created_at', { ascending: false })
          break
      }

      query = query.limit(50)

      const { data, error, count } = await query

      if (error) {
        console.error('Error fetching flags:', error)
        toast({
          title: 'Error loading flags',
          description: error.message,
          variant: 'destructive'
        })
        setFlags([])
        setTotalCount(0)
        setLoading(false)
        return
      }

      console.log('Fetched flags:', data)
      setFlags(data || [])
      setTotalCount(count || 0)
    } catch (error) {
      console.error('Error fetching flags:', error)
      toast({
        title: 'Error',
        description: 'Failed to load flagged accounts',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleResolve = async (id: string) => {
    setActionLoading(true)
    try {
      const { error } = await supabase
        .from('user_activity_flags')
        .update({
          status: 'resolved',
          resolved_at: new Date().toISOString()
        })
        .eq('id', id)

      if (error) {
        toast({
          title: 'Error',
          description: 'Failed to resolve flag',
          variant: 'destructive'
        })
      } else {
        toast({
          title: 'Success',
          description: 'Flag marked as resolved'
        })
        fetchFlags()
      }
    } finally {
      setActionLoading(false)
    }
  }

  const handleDismiss = async (id: string) => {
    setActionLoading(true)
    try {
      const { error } = await supabase
        .from('user_activity_flags')
        .update({
          status: 'dismissed',
          resolved_at: new Date().toISOString()
        })
        .eq('id', id)

      if (error) {
        toast({
          title: 'Error',
          description: 'Failed to dismiss flag',
          variant: 'destructive'
        })
      } else {
        toast({
          title: 'Success',
          description: 'Flag dismissed'
        })
        fetchFlags()
      }
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <AdminGuard requiredPermission="manage_flagged_accounts">
      <AdminLayout
        title="Flagged Accounts"
        breadcrumbs={[{ label: 'Flagged Accounts' }]}
      >
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-red-100 p-2 rounded-full">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Sybil Attack Detection</h2>
                <p className="text-sm text-muted-foreground">
                  Suspicious activity patterns flagged by the system
                </p>
              </div>
            </div>
            <Badge variant="outline" className="text-sm sm:text-lg px-3 sm:px-4 py-2 w-fit">
              {totalCount} total
            </Badge>
          </div>

          {/* Filters */}
          <div className="flex flex-col lg:flex-row gap-4">
            <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)} className="flex-1">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="active">Active</TabsTrigger>
                <TabsTrigger value="resolved">Resolved</TabsTrigger>
                <TabsTrigger value="dismissed">Dismissed</TabsTrigger>
                <TabsTrigger value="all">All</TabsTrigger>
              </TabsList>
            </Tabs>

            <Select value={severityFilter} onValueChange={(v) => setSeverityFilter(v as SeverityFilter)}>
              <SelectTrigger className="w-full lg:w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severity</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortBy)}>
              <SelectTrigger className="w-full lg:w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="severity">By Severity</SelectItem>
                <SelectItem value="penalty">By Penalty</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Flags List */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : flags.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 border rounded-lg">
              <Shield className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No flagged accounts found</h3>
              <p className="text-sm text-muted-foreground">
                {statusFilter === 'active' ? 'Great! No active flags to review.' : 'Try adjusting your filters.'}
              </p>
            </div>
          ) : (
            <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
              {flags.map((flag) => (
                <FlaggedAccountCard
                  key={flag.id}
                  flag={flag}
                  onResolve={statusFilter === 'active' ? handleResolve : undefined}
                  onDismiss={statusFilter === 'active' ? handleDismiss : undefined}
                />
              ))}
            </div>
          )}
        </div>
      </AdminLayout>
    </AdminGuard>
  )
}
