'use client'

import { useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  Download,
  Share2,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Award,
  Users,
  FileText
} from 'lucide-react'
import { format } from 'date-fns'
import { getPartyColor, formatPosition, type PoliticianStats } from '@/lib/politicians'
import { useToast } from '@/hooks/use-toast'

interface ReportCardProps {
  politician: {
    id: string
    name: string
    party: string | null
    position: string | null
    state: string | null
    image_url: string | null
  }
  stats: PoliticianStats
  showActions?: boolean
}

export function ReportCard({ politician, stats, showActions = true }: ReportCardProps) {
  const reportRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  // Safely parse numeric values to prevent NaN
  const safeNumber = (val: number | null | undefined): number => {
    if (val === null || val === undefined || isNaN(Number(val))) return 0
    return Number(val)
  }

  const fulfillmentRate = safeNumber(stats.fulfillment_rate)
  const fulfilledCount = safeNumber(stats.fulfilled_count)
  const brokenCount = safeNumber(stats.broken_count)
  const inProgressCount = safeNumber(stats.in_progress_count)
  const stalledCount = safeNumber(stats.stalled_count)
  const pendingCount = safeNumber(stats.pending_count)
  const totalPromises = safeNumber(stats.total_promises)
  const totalResolved = fulfilledCount + brokenCount

  // Calculate grade
  const getGrade = (rate: number): { grade: string; color: string; description: string } => {
    if (rate >= 80) return { grade: 'A', color: 'text-green-600', description: 'Excellent Track Record' }
    if (rate >= 60) return { grade: 'B', color: 'text-blue-600', description: 'Good Performance' }
    if (rate >= 40) return { grade: 'C', color: 'text-yellow-600', description: 'Average Performance' }
    if (rate >= 20) return { grade: 'D', color: 'text-orange-600', description: 'Below Average' }
    return { grade: 'F', color: 'text-red-600', description: 'Poor Track Record' }
  }

  const gradeInfo = getGrade(fulfillmentRate)

  // Print/PDF function
  const handlePrint = () => {
    const printContent = reportRef.current
    if (!printContent) return

    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      toast({
        title: 'Popup Blocked',
        description: 'Please allow popups to download the report card',
        variant: 'destructive'
      })
      return
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Report Card - ${politician.name}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              padding: 40px;
              max-width: 800px;
              margin: 0 auto;
              color: #1f2937;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              padding-bottom: 20px;
              border-bottom: 2px solid #e5e7eb;
            }
            .header h1 { font-size: 28px; margin-bottom: 8px; }
            .header .subtitle { color: #6b7280; font-size: 14px; }
            .party-badge {
              display: inline-block;
              padding: 4px 12px;
              border-radius: 20px;
              font-size: 12px;
              font-weight: 500;
              margin-top: 8px;
            }
            .grade-section {
              text-align: center;
              margin: 30px 0;
              padding: 30px;
              background: #f9fafb;
              border-radius: 12px;
            }
            .grade {
              font-size: 72px;
              font-weight: bold;
              line-height: 1;
            }
            .grade-a { color: #16a34a; }
            .grade-b { color: #2563eb; }
            .grade-c { color: #ca8a04; }
            .grade-d { color: #ea580c; }
            .grade-f { color: #dc2626; }
            .grade-description { margin-top: 8px; color: #6b7280; }
            .stats-grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 20px;
              margin: 30px 0;
            }
            .stat-box {
              padding: 20px;
              background: #f9fafb;
              border-radius: 8px;
              text-align: center;
            }
            .stat-value { font-size: 32px; font-weight: bold; }
            .stat-label { font-size: 12px; color: #6b7280; margin-top: 4px; }
            .stat-fulfilled .stat-value { color: #16a34a; }
            .stat-broken .stat-value { color: #dc2626; }
            .stat-progress .stat-value { color: #2563eb; }
            .stat-stalled .stat-value { color: #ca8a04; }
            .progress-bar {
              height: 24px;
              background: #e5e7eb;
              border-radius: 12px;
              overflow: hidden;
              margin: 20px 0;
            }
            .progress-fill {
              height: 100%;
              border-radius: 12px;
              transition: width 0.3s;
            }
            .progress-green { background: #16a34a; }
            .progress-red { background: #dc2626; }
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
              text-align: center;
              font-size: 12px;
              color: #9ca3af;
            }
            .footer a { color: #6366f1; text-decoration: none; }
            @media print {
              body { padding: 20px; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${politician.name}</h1>
            <div class="subtitle">
              ${formatPosition(politician.position)} ${politician.state ? `| ${politician.state}` : ''}
            </div>
            ${politician.party ? `<span class="party-badge" style="background: #f3f4f6;">${politician.party}</span>` : ''}
          </div>

          <div class="grade-section">
            <div class="grade grade-${gradeInfo.grade.toLowerCase()}">${gradeInfo.grade}</div>
            <div class="grade-description">${gradeInfo.description}</div>
            <div style="margin-top: 12px; font-size: 24px; font-weight: 600;">
              ${fulfillmentRate.toFixed(1)}% Fulfillment Rate
            </div>
          </div>

          <div class="stats-grid">
            <div class="stat-box stat-fulfilled">
              <div class="stat-value">${fulfilledCount}</div>
              <div class="stat-label">Promises Fulfilled</div>
            </div>
            <div class="stat-box stat-broken">
              <div class="stat-value">${brokenCount}</div>
              <div class="stat-label">Promises Broken</div>
            </div>
            <div class="stat-box stat-progress">
              <div class="stat-value">${inProgressCount}</div>
              <div class="stat-label">In Progress</div>
            </div>
            <div class="stat-box stat-stalled">
              <div class="stat-value">${stalledCount + pendingCount}</div>
              <div class="stat-label">Pending/Stalled</div>
            </div>
          </div>

          <div style="margin: 30px 0;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <span style="font-weight: 500;">Promise Outcomes</span>
              <span style="color: #6b7280;">${totalResolved} of ${totalPromises} resolved</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill progress-green" style="width: ${totalPromises > 0 ? (fulfilledCount / totalPromises) * 100 : 0}%"></div>
            </div>
            <div style="display: flex; gap: 20px; font-size: 12px; color: #6b7280;">
              <span style="display: flex; align-items: center; gap: 4px;">
                <span style="width: 12px; height: 12px; background: #16a34a; border-radius: 2px;"></span>
                Fulfilled (${fulfilledCount})
              </span>
              <span style="display: flex; align-items: center; gap: 4px;">
                <span style="width: 12px; height: 12px; background: #dc2626; border-radius: 2px;"></span>
                Broken (${brokenCount})
              </span>
              <span style="display: flex; align-items: center; gap: 4px;">
                <span style="width: 12px; height: 12px; background: #e5e7eb; border-radius: 2px;"></span>
                Other (${totalPromises - fulfilledCount - brokenCount})
              </span>
            </div>
          </div>

          <div class="footer">
            <p>Generated on ${format(new Date(), 'MMMM d, yyyy')}</p>
            <p style="margin-top: 8px;">
              Data sourced from <a href="https://political-accountability.in">Political Accountability Platform</a>
            </p>
            <p style="margin-top: 4px;">
              Verified by community members | Tamper-proof with cryptographic hashing
            </p>
          </div>
        </body>
      </html>
    `)

    printWindow.document.close()
    printWindow.focus()

    // Delay print to ensure content loads
    setTimeout(() => {
      printWindow.print()
    }, 250)
  }

  // Share function
  const handleShare = async () => {
    const shareData = {
      title: `${politician.name} - Promise Report Card`,
      text: `${politician.name} has a ${fulfillmentRate.toFixed(1)}% promise fulfillment rate. Check out their full report card!`,
      url: window.location.href
    }

    if (navigator.share) {
      try {
        await navigator.share(shareData)
      } catch (err) {
        // User cancelled or error
      }
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`)
      toast({
        title: 'Copied to Clipboard',
        description: 'Share link has been copied'
      })
    }
  }

  return (
    <Card className="overflow-hidden" ref={reportRef}>
      <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-2xl">{politician.name}</CardTitle>
            <p className="text-indigo-100 mt-1">
              {formatPosition(politician.position)}
              {politician.state && ` | ${politician.state}`}
            </p>
            {politician.party && (
              <Badge className="mt-2 bg-white/20 hover:bg-white/30 text-white border-0">
                {politician.party}
              </Badge>
            )}
          </div>
          <div className="text-right">
            <div className={`text-6xl font-bold ${gradeInfo.color} bg-white rounded-lg px-4 py-2`}>
              {gradeInfo.grade}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        {/* Fulfillment Rate */}
        <div className="text-center mb-6">
          <p className="text-4xl font-bold">{fulfillmentRate.toFixed(1)}%</p>
          <p className="text-muted-foreground">Promise Fulfillment Rate</p>
          <p className="text-sm text-muted-foreground mt-1">{gradeInfo.description}</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span>Promise Outcomes</span>
            <span className="text-muted-foreground">{totalResolved} of {totalPromises} resolved</span>
          </div>
          <div className="h-4 bg-muted rounded-full overflow-hidden flex">
            <div
              className="bg-green-500 transition-all"
              style={{ width: `${totalPromises > 0 ? (fulfilledCount / totalPromises) * 100 : 0}%` }}
            />
            <div
              className="bg-red-500 transition-all"
              style={{ width: `${totalPromises > 0 ? (brokenCount / totalPromises) * 100 : 0}%` }}
            />
          </div>
          <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 bg-green-500 rounded" /> Fulfilled ({fulfilledCount})
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 bg-red-500 rounded" /> Broken ({brokenCount})
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 bg-muted rounded" /> Other ({totalPromises - fulfilledCount - brokenCount})
            </span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <CheckCircle className="h-6 w-6 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-green-600">{fulfilledCount}</p>
            <p className="text-xs text-muted-foreground">Fulfilled</p>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <XCircle className="h-6 w-6 text-red-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-red-600">{brokenCount}</p>
            <p className="text-xs text-muted-foreground">Broken</p>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <Clock className="h-6 w-6 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-blue-600">{inProgressCount}</p>
            <p className="text-xs text-muted-foreground">In Progress</p>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <AlertCircle className="h-6 w-6 text-yellow-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-yellow-600">{stalledCount + pendingCount}</p>
            <p className="text-xs text-muted-foreground">Pending/Stalled</p>
          </div>
        </div>

        {/* Action Buttons */}
        {showActions && (
          <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t">
            <Button onClick={handlePrint} variant="outline" className="flex-1">
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
            <Button onClick={handleShare} variant="outline" className="flex-1">
              <Share2 className="h-4 w-4 mr-2" />
              Share Report
            </Button>
          </div>
        )}

        {/* Footer */}
        <div className="mt-4 pt-4 border-t text-center text-xs text-muted-foreground">
          <p>Generated on {format(new Date(), 'MMMM d, yyyy')}</p>
          <p>Data verified by community members on Political Accountability Platform</p>
        </div>
      </CardContent>
    </Card>
  )
}

// Compact version for listings
export function ReportCardCompact({ stats }: { stats: PoliticianStats }) {
  // Safely parse numeric values to prevent NaN
  const safeNumber = (val: number | null | undefined): number => {
    if (val === null || val === undefined || isNaN(Number(val))) return 0
    return Number(val)
  }

  const fulfillmentRate = safeNumber(stats.fulfillment_rate)
  const fulfilledCount = safeNumber(stats.fulfilled_count)
  const totalPromises = safeNumber(stats.total_promises)

  const getGradeColor = (rate: number) => {
    if (rate >= 80) return 'bg-green-500'
    if (rate >= 60) return 'bg-blue-500'
    if (rate >= 40) return 'bg-yellow-500'
    if (rate >= 20) return 'bg-orange-500'
    return 'bg-red-500'
  }

  return (
    <div className="flex items-center gap-3">
      <div className={`${getGradeColor(fulfillmentRate)} text-white text-xs font-bold px-2 py-1 rounded`}>
        {fulfillmentRate.toFixed(0)}%
      </div>
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-green-500"
          style={{ width: `${fulfillmentRate}%` }}
        />
      </div>
      <span className="text-xs text-muted-foreground">
        {fulfilledCount}/{totalPromises}
      </span>
    </div>
  )
}
