'use client'

import { useEffect, useState } from 'react'
import { AdminGuard } from '@/components/admin/AdminGuard'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { VerificationReviewCard } from '@/components/admin/VerificationReviewCard'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { RejectDialog } from '@/components/admin/RejectDialog'
import { useToast } from '@/hooks/use-toast'
import { approveVerification, rejectVerification } from '@/lib/moderationActions'
import { supabase } from '@/lib/supabase'
import { FileText, Loader2 } from 'lucide-react'

type StatusFilter = 'pending' | 'approved' | 'rejected' | 'all'
type SortBy = 'newest' | 'oldest' | 'most_voted' | 'most_controversial'

export default function VerificationsPage() {
  const [verifications, setVerifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const { toast } = useToast()
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [selectedVerificationId, setSelectedVerificationId] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending')
  const [sortBy, setSortBy] = useState<SortBy>('newest')
  const [totalCount, setTotalCount] = useState(0)

  useEffect(() => {
    fetchVerifications()
  }, [statusFilter, sortBy])

  const fetchVerifications = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('verifications')
        .select(`
          id,
          evidence_text,
          evidence_url,
          verdict,
          upvotes,
          downvotes,
          status,
          created_at,
          promise:promises (
            id,
            politician_name,
            promise_text,
            party
          ),
          submitter:users!verifications_submitted_by_fkey (
            id,
            username,
            citizen_score
          )
        `, { count: 'exact' })

      // Filter by status
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter)
      }

      // Sort
      switch (sortBy) {
        case 'oldest':
          query = query.order('created_at', { ascending: true })
          break
        case 'most_voted':
          query = query.order('upvotes', { ascending: false })
          break
        case 'most_controversial':
          // Most controversial = highest total votes
          break
        case 'newest':
        default:
          query = query.order('created_at', { ascending: false })
          break
      }

      query = query.limit(50)

      const { data, error, count } = await query

      if (error) throw error

      setVerifications(data || [])
      setTotalCount(count || 0)
    } catch (error) {
      console.error('Error fetching verifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (id: string) => {
    setActionLoading(true)
    try {
      const result = await approveVerification(id)
      if (result.success) {
        toast({ title: 'Success', description: 'Verification approved successfully' })
        fetchVerifications()
      } else {
        toast({ title: 'Error', description: result.error || 'Failed to approve', variant: 'destructive' })
      }
    } finally {
      setActionLoading(false)
    }
  }

  const handleReject = (id: string) => {
    setSelectedVerificationId(id)
    setRejectDialogOpen(true)
  }

  const handleRejectConfirm = async (reason: string) => {
    if (!selectedVerificationId) return
    setActionLoading(true)
    try {
      const result = await rejectVerification(selectedVerificationId, reason)
      if (result.success) {
        toast({ title: 'Success', description: 'Verification rejected' })
        setRejectDialogOpen(false)
        setSelectedVerificationId(null)
        fetchVerifications()
      } else {
        toast({ title: 'Error', description: result.error || 'Failed', variant: 'destructive' })
      }
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <AdminGuard requiredPermission="view_verification_queue">
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 container py-8">
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Verification Queue</h1>
                <p className="text-muted-foreground">Review and moderate verification submissions</p>
              </div>
              <Badge variant="outline" className="text-lg px-4 py-2">
                {totalCount} total
              </Badge>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)} className="flex-1">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="pending">Pending</TabsTrigger>
                  <TabsTrigger value="approved">Approved</TabsTrigger>
                  <TabsTrigger value="rejected">Rejected</TabsTrigger>
                  <TabsTrigger value="all">All</TabsTrigger>
                </TabsList>
              </Tabs>
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortBy)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="most_voted">Most Upvoted</SelectItem>
                  <SelectItem value="most_controversial">Most Controversial</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Verification List */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : verifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 border rounded-lg">
                <FileText className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No verifications found</h3>
                <p className="text-sm text-muted-foreground">
                  {statusFilter === 'pending' ? 'All caught up! No pending verifications.' : 'Try adjusting your filters.'}
                </p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {verifications.map((verification) => (
                  <VerificationReviewCard
                    key={verification.id}
                    verification={verification}
                    onApprove={statusFilter === 'pending' ? handleApprove : undefined}
                    onReject={statusFilter === 'pending' ? handleReject : undefined}
                  />
                ))}
              </div>
            )}
          </div>
        </main>
        <Footer />
      </div>
    <RejectDialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen} onConfirm={handleRejectConfirm} loading={actionLoading} />
    </AdminGuard>
  )
}
