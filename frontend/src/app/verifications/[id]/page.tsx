'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'
import {
  ArrowLeft,
  ExternalLink,
  User,
  Calendar,
  Award,
  ThumbsUp,
  ThumbsDown,
  Shield,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Loader2,
  Copy,
  Check
} from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { approveVerification, rejectVerification } from '@/lib/moderationActions'
import { RejectDialog } from '@/components/admin/RejectDialog'

interface VerificationData {
  id: string
  evidence_text: string
  evidence_urls: string[]
  verdict: 'fulfilled' | 'broken' | 'in_progress' | 'stalled'
  status: 'pending' | 'approved' | 'rejected'
  upvotes: number
  downvotes: number
  created_at: string
  verification_hash: string
  trust_level?: 'admin' | 'trusted_community' | 'community' | 'untrusted'
  is_self_verification?: boolean
  verification_weight?: number
  promise: {
    id: string
    politician_name: string
    promise_text: string
  }
  submitter: {
    id: string
    username: string
    citizen_score: number
  }
}

const verdictConfig = {
  fulfilled: { label: 'Fulfilled', color: 'bg-green-500', icon: CheckCircle2 },
  broken: { label: 'Broken', color: 'bg-red-500', icon: XCircle },
  in_progress: { label: 'In Progress', color: 'bg-blue-500', icon: Clock },
  stalled: { label: 'Stalled', color: 'bg-yellow-500', icon: AlertTriangle }
}

const statusConfig = {
  pending: { label: 'Pending Review', color: 'bg-yellow-600' },
  approved: { label: 'Approved', color: 'bg-green-600' },
  rejected: { label: 'Rejected', color: 'bg-red-600' }
}

export default function VerificationDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [verification, setVerification] = useState<VerificationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [hashVerified, setHashVerified] = useState<boolean | null>(null)
  const [verifyingHash, setVerifyingHash] = useState(false)
  const [hashCopied, setHashCopied] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)

  useEffect(() => {
    if (params.id) {
      fetchVerification(params.id as string)
      checkAdminStatus()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id])

  const checkAdminStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setIsAdmin(false)
      return
    }

    const { data: userData } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', user.id)
      .single()

    if (!userData) {
      setIsAdmin(false)
      return
    }

    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role_name')
      .eq('user_id', userData.id)
      .single()

    setIsAdmin(!!roleData)
  }

  const fetchVerification = async (id: string) => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('verifications')
        .select(`
          id,
          evidence_text,
          evidence_urls,
          verdict,
          status,
          upvotes,
          downvotes,
          created_at,
          verification_hash,
          trust_level,
          is_self_verification,
          verification_weight,
          promise:promises!promise_id (
            id,
            politician_name,
            promise_text
          ),
          submitter:users!submitted_by (
            id,
            username,
            citizen_score
          )
        `)
        .eq('id', id)
        .single()

      if (error) throw error

      setVerification(data as any)
    } catch (error) {
      console.error('Error fetching verification:', error)
      toast({
        title: 'Error',
        description: 'Failed to load verification',
        variant: 'destructive'
      })
      router.push('/404')
    } finally {
      setLoading(false)
    }
  }

  const verifyHash = async () => {
    if (!verification) return

    setVerifyingHash(true)
    try {
      const { data, error } = await supabase.rpc('verify_verification_hash', {
        verification_id: verification.id
      })

      if (error) throw error

      setHashVerified(data)
      toast({
        title: data ? 'Hash Verified ✓' : 'Hash Mismatch ⚠',
        description: data
          ? 'Evidence is authentic and untampered'
          : 'Evidence may have been modified',
        variant: data ? 'default' : 'destructive'
      })
    } catch (error) {
      console.error('Error verifying hash:', error)
      toast({
        title: 'Verification Failed',
        description: 'Could not verify hash integrity',
        variant: 'destructive'
      })
    } finally {
      setVerifyingHash(false)
    }
  }

  const copyHash = () => {
    if (verification?.verification_hash) {
      navigator.clipboard.writeText(verification.verification_hash)
      setHashCopied(true)
      setTimeout(() => setHashCopied(false), 2000)
      toast({
        title: 'Hash Copied',
        description: 'Verification hash copied to clipboard'
      })
    }
  }

  const handleApprove = async () => {
    if (!verification) return

    setActionLoading(true)
    try {
      const result = await approveVerification(verification.id)
      if (result.success) {
        toast({
          title: 'Success',
          description: 'Verification approved successfully'
        })
        fetchVerification(verification.id)
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to approve',
          variant: 'destructive'
        })
      }
    } finally {
      setActionLoading(false)
    }
  }

  const handleReject = () => {
    setRejectDialogOpen(true)
  }

  const handleRejectConfirm = async (reason: string) => {
    if (!verification) return

    setActionLoading(true)
    try {
      const result = await rejectVerification(verification.id, reason)
      if (result.success) {
        toast({
          title: 'Success',
          description: 'Verification rejected'
        })
        setRejectDialogOpen(false)
        fetchVerification(verification.id)
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed',
          variant: 'destructive'
        })
      }
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 container py-8 px-4 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    )
  }

  if (!verification) {
    return null
  }

  const verdict = verdictConfig[verification.verdict]
  const status = statusConfig[verification.status]
  const VerdictIcon = verdict.icon
  const voteTotal = verification.upvotes + verification.downvotes
  const voteRatio = voteTotal > 0
    ? Math.round((verification.upvotes / voteTotal) * 100)
    : 0

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 container py-8 px-4">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Back Button */}
          <Button variant="ghost" onClick={() => router.back()} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>

          {/* Header Card */}
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <Badge className={status.color + ' text-white'}>
                  {status.label}
                </Badge>
                <Badge variant="outline" className="gap-1">
                  <VerdictIcon className="h-3 w-3" />
                  Claim: {verdict.label}
                </Badge>
                <Badge variant="outline">
                  {voteRatio}% ({verification.upvotes}/{verification.downvotes})
                </Badge>
                {verification.trust_level === 'admin' && (
                  <Badge className="bg-purple-500/10 text-purple-600 border-purple-500/20 gap-1">
                    <Shield className="h-3 w-3" />
                    Admin Verified (3.0x points)
                  </Badge>
                )}
                {verification.trust_level === 'trusted_community' && (
                  <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20 gap-1">
                    <Shield className="h-3 w-3" />
                    Trusted User (2.0x points)
                  </Badge>
                )}
                {verification.trust_level === 'community' && (
                  <Badge className="bg-gray-500/10 text-gray-600 border-gray-500/20 gap-1">
                    <User className="h-3 w-3" />
                    Community (1.0x points)
                  </Badge>
                )}
                {verification.trust_level === 'untrusted' && (
                  <Badge className="bg-orange-500/10 text-orange-600 border-orange-500/20 gap-1">
                    <ShieldAlert className="h-3 w-3" />
                    New User (0.5x points)
                  </Badge>
                )}
                {verification.is_self_verification && (
                  <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20 gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Self-Verified (0.1x points)
                  </Badge>
                )}
              </div>
              <CardTitle className="text-2xl">
                {verification.promise.politician_name}
              </CardTitle>
              <p className="text-muted-foreground mt-2">
                Promise: {verification.promise.promise_text}
              </p>
              <Link
                href={`/promises/${verification.promise.id}`}
                className="text-sm text-primary hover:underline flex items-center gap-1 mt-2"
              >
                View Full Promise <ExternalLink className="h-3 w-3" />
              </Link>
            </CardHeader>
          </Card>

          {/* Evidence Card */}
          <Card>
            <CardHeader>
              <CardTitle>Evidence</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="whitespace-pre-wrap">{verification.evidence_text}</p>

              {verification.evidence_urls && verification.evidence_urls.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Sources:</h4>
                  {verification.evidence_urls.map((url, index) => (
                    <a
                      key={index}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline flex items-center gap-1"
                    >
                      <ExternalLink className="h-3 w-3" />
                      {verification.evidence_urls!.length > 1 && `Source ${index + 1}: `}
                      {url}
                    </a>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Verification Integrity Card */}
          <Card className="border-2 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Verification Integrity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-primary/5 rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-sm font-medium mb-1">Digital Fingerprint (Hash):</p>
                    <code className="text-xs bg-muted px-2 py-1 rounded break-all block">
                      {verification.verification_hash}
                    </code>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyHash}
                    className="flex-shrink-0"
                  >
                    {hashCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>

                {hashVerified !== null && (
                  <div className={`flex items-center gap-2 p-3 rounded ${
                    hashVerified ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                  }`}>
                    {hashVerified ? (
                      <>
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                        <span className="text-sm text-green-800 font-medium">
                          ✓ Evidence is authentic and untampered
                        </span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                        <span className="text-sm text-red-800 font-medium">
                          ⚠ Evidence may have been modified
                        </span>
                      </>
                    )}
                  </div>
                )}

                <Button
                  onClick={verifyHash}
                  disabled={verifyingHash}
                  className="w-full"
                  variant="outline"
                >
                  {verifyingHash ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <Shield className="h-4 w-4 mr-2" />
                      Verify Hash Integrity
                    </>
                  )}
                </Button>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900 font-medium mb-2">
                  🔐 What is a Hash?
                </p>
                <p className="text-xs text-blue-800">
                  A hash is like a digital fingerprint. It's a unique code created from this evidence when it was submitted.
                  If anything changes in the evidence (even a single space), the hash changes completely. This proves the
                  evidence hasn't been tampered with since submission on {format(new Date(verification.created_at), 'MMM d, yyyy')}.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Submitter Info */}
          <Card>
            <CardHeader>
              <CardTitle>Submitted By</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      <User className="h-6 w-6" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <Link href={`/profile/${verification.submitter.username}`} className="font-semibold hover:underline">
                      {verification.submitter.username}
                    </Link>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Award className="h-3 w-3" />
                      <span>{verification.submitter.citizen_score} points</span>
                    </div>
                  </div>
                </div>
                <div className="text-right text-sm text-muted-foreground">
                  <div className="flex items-center gap-1 justify-end">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(verification.created_at), 'MMM d, yyyy')}
                  </div>
                  <div>{format(new Date(verification.created_at), 'h:mm a')}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Voting Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Community Voting</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-6">
                <div className="flex items-center gap-3">
                  <div className="bg-green-100 p-3 rounded-full">
                    <ThumbsUp className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{verification.upvotes}</p>
                    <p className="text-sm text-muted-foreground">Upvotes</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-red-100 p-3 rounded-full">
                    <ThumbsDown className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{verification.downvotes}</p>
                    <p className="text-sm text-muted-foreground">Downvotes</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Admin Actions (if pending and user is admin) */}
          {isAdmin && verification.status === 'pending' && (
            <Card className="border-2 border-yellow-500/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Admin Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="flex gap-3">
                <Button
                  onClick={handleApprove}
                  disabled={actionLoading}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  {actionLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                  )}
                  Approve
                </Button>
                <Button
                  onClick={handleReject}
                  disabled={actionLoading}
                  variant="destructive"
                  className="flex-1"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <Footer />

      <RejectDialog
        open={rejectDialogOpen}
        onOpenChange={setRejectDialogOpen}
        onConfirm={handleRejectConfirm}
        loading={actionLoading}
      />
    </div>
  )
}
